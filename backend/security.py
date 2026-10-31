"""
Session authentication, role checks and rate limiting.

Sessions are signed JWTs stored in httpOnly cookies — one for external users
(`atperf_user`) and one for internal staff (`atperf_staff`), since the same
browser can hold both. The server re-reads the account on every request, so a
suspended account or a role change takes effect immediately.
"""
import os
import secrets
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

import models
from database import get_gcp_db
from dependencies import logger

# ── Configuration ─────────────────────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    JWT_SECRET = secrets.token_urlsafe(48)
    logger.warning("JWT_SECRET is not set: using a random key — all sessions end when the server restarts.")
JWT_ALGORITHM = "HS256"
SESSION_DAYS = int(os.getenv("SESSION_DAYS", "7"))

USER_COOKIE = "atperf_user"
STAFF_COOKIE = "atperf_staff"

ADMIN_ROLES = {"admin", "super_admin"}
COMPANY_EDITOR_ROLES = {"collaborator", "developer", "admin", "super_admin"}


# ── Tokens & cookies ──────────────────────────────────────────────────────────
def _encode(subject: str, kind: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": subject, "kind": kind, "iat": now, "exp": now + timedelta(days=SESSION_DAYS)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode(token: Optional[str], kind: str) -> Optional[str]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
    return payload.get("sub") if payload.get("kind") == kind else None


def _is_https(request: Request) -> bool:
    # Behind Nginx the scheme arrives in X-Forwarded-Proto.
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    return proto.split(",")[0].strip() == "https"


def set_session_cookie(response: Response, request: Request, kind: str, subject: str) -> None:
    response.set_cookie(
        key=USER_COOKIE if kind == "user" else STAFF_COOKIE,
        value=_encode(subject, kind),
        max_age=SESSION_DAYS * 86400,
        httponly=True,
        secure=_is_https(request),
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response, kind: str) -> None:
    response.delete_cookie(key=USER_COOKIE if kind == "user" else STAFF_COOKIE, path="/")


# ── Principal ─────────────────────────────────────────────────────────────────
@dataclass
class Principal:
    user: Optional[models.ExternalUser] = None
    staff: Optional[models.InternalUser] = None

    @property
    def is_external_admin(self) -> bool:
        return self.user is not None and self.user.role in ADMIN_ROLES

    @property
    def is_staff_admin(self) -> bool:
        return self.staff is not None and self.staff.internal_role in ADMIN_ROLES

    @property
    def is_admin(self) -> bool:
        """May manage users and staff (mirrors the Admin panel rules)."""
        return self.is_external_admin or self.is_staff_admin

    @property
    def is_super_admin(self) -> bool:
        return (self.user is not None and self.user.role == "super_admin") or \
               (self.staff is not None and self.staff.internal_role == "super_admin")

    @property
    def can_open_admin_panel(self) -> bool:
        return self.staff is not None or self.is_external_admin

    @property
    def can_edit_companies(self) -> bool:
        return self.is_external_admin or (self.staff is not None and self.staff.internal_role in COMPANY_EDITOR_ROLES)


def get_principal(request: Request, gcp_db: Session = Depends(get_gcp_db)) -> Principal:
    principal = Principal()

    user_id = _decode(request.cookies.get(USER_COOKIE), "user")
    if user_id:
        user = gcp_db.query(models.ExternalUser).filter(models.ExternalUser.user_id == user_id).first()
        if user and user.status == "active" and user.is_email_verified:
            principal.user = user

    staff_id = _decode(request.cookies.get(STAFF_COOKIE), "staff")
    if staff_id:
        staff = gcp_db.query(models.InternalUser).filter(models.InternalUser.staff_id == staff_id).first()
        if staff and staff.status == "active" and staff.deleted_at is None:
            principal.staff = staff

    return principal


def _unauthenticated() -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated. Please log in.")


def _forbidden() -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to do this.")


def require_user(principal: Principal = Depends(get_principal)) -> models.ExternalUser:
    if principal.user is None:
        raise _unauthenticated()
    return principal.user


def require_admin_panel(principal: Principal = Depends(get_principal)) -> Principal:
    """Any active staff member, or an external admin."""
    if principal.user is None and principal.staff is None:
        raise _unauthenticated()
    if not principal.can_open_admin_panel:
        raise _forbidden()
    return principal


def require_admin(principal: Principal = Depends(require_admin_panel)) -> Principal:
    if not principal.is_admin:
        raise _forbidden()
    return principal


def require_super_admin(principal: Principal = Depends(require_admin_panel)) -> Principal:
    if not principal.is_super_admin:
        raise _forbidden()
    return principal


def require_company_editor(principal: Principal = Depends(require_admin_panel)) -> Principal:
    if not principal.can_edit_companies:
        raise _forbidden()
    return principal


# ── Rate limiting (in-memory, per process) ────────────────────────────────────
_hits: dict[str, deque] = defaultdict(deque)
_hits_lock = Lock()


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")


def check_rate(key: str, limit: int, window_seconds: int) -> None:
    now = time.monotonic()
    with _hits_lock:
        q = _hits[key]
        while q and now - q[0] > window_seconds:
            q.popleft()
        if len(q) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait a few minutes and try again.",
            )
        q.append(now)


def rate_limit(scope: str, limit: int, window_seconds: int):
    """Dependency: at most `limit` calls per client IP per window for this scope."""
    def dependency(request: Request) -> None:
        check_rate(f"{scope}:{client_ip(request)}", limit, window_seconds)
    return dependency


def reset_rate_limits() -> None:
    with _hits_lock:
        _hits.clear()
