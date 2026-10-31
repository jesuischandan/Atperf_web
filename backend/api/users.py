from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
import schemas
from database import get_gcp_db
from security import Principal, get_principal, require_admin_panel


def _require_self_or(principal: Principal, user_id: str, allowed: bool) -> None:
    if principal.user is None and principal.staff is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated. Please log in.")
    if not allowed and (principal.user is None or principal.user.user_id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to do this.")


router = APIRouter(tags=["Users"])

@router.get("/users", response_model=List[schemas.UserResponse])
def list_users(gcp_db: Session = Depends(get_gcp_db), _: Principal = Depends(require_admin_panel)):
    """List all external users."""
    users = gcp_db.query(models.ExternalUser).order_by(models.ExternalUser.created_at.desc()).all()
    # To keep list fast without N+1 queries ideally we'd join, but this is fine for now
    companies = {c.company_id: c.company_name for c in gcp_db.query(models.GCPCompany).all()}
    resp = []
    for u in users:
        d = {c.name: getattr(u, c.name) for c in u.__table__.columns}
        d["company_name"] = companies.get(u.company_id)
        resp.append(d)
    return resp


@router.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: str, gcp_db: Session = Depends(get_gcp_db), principal: Principal = Depends(get_principal)):
    _require_self_or(principal, user_id, principal.can_open_admin_panel)
    user = gcp_db.query(models.ExternalUser).filter(models.ExternalUser.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    company = gcp_db.query(models.GCPCompany).filter(models.GCPCompany.company_id == user.company_id).first()
    user_dict = {c.name: getattr(user, c.name) for c in user.__table__.columns}
    if company:
        user_dict["company_name"] = company.company_name
    return user_dict


class UserUpdatePayload(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    plan_type: Optional[str] = None
    credit_balance: Optional[int] = None


@router.patch("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: str, payload: UserUpdatePayload, gcp_db: Session = Depends(get_gcp_db),
                principal: Principal = Depends(get_principal)):
    _require_self_or(principal, user_id, principal.is_admin)
    # Account owners may edit their identity; role, status, plan and credits are admin-only.
    if not principal.is_admin and any(v is not None for v in (payload.role, payload.status, payload.plan_type, payload.credit_balance)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can change role, status, plan or credits.")
    user = gcp_db.query(models.ExternalUser).filter(models.ExternalUser.user_id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if payload.first_name is not None:
        user.first_name = payload.first_name
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.email is not None:
        existing = gcp_db.query(models.ExternalUser).filter(
            models.ExternalUser.email == payload.email,
            models.ExternalUser.user_id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already in use.")
        user.email = payload.email
    if payload.role is not None:
        if (payload.role == "super_admin" or user.role == "super_admin") and payload.role != user.role and not principal.is_super_admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only a super admin can grant or remove the super admin role.")
        user.role = payload.role
    if payload.status is not None:
        user.status = payload.status
    if payload.plan_type is not None:
        user.plan_type = payload.plan_type
    if payload.credit_balance is not None:
        user.credit_balance = payload.credit_balance

    gcp_db.commit()
    gcp_db.refresh(user)
    
    company = gcp_db.query(models.GCPCompany).filter(models.GCPCompany.company_id == user.company_id).first()
    user_dict = {c.name: getattr(user, c.name) for c in user.__table__.columns}
    if company:
        user_dict["company_name"] = company.company_name
    return user_dict


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: str, gcp_db: Session = Depends(get_gcp_db), principal: Principal = Depends(get_principal)):
    """Delete an external user account (the owner, or a super admin)."""
    _require_self_or(principal, user_id, principal.is_super_admin)
    user = gcp_db.query(models.ExternalUser).filter(models.ExternalUser.user_id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    gcp_db.delete(user)
    gcp_db.commit()
