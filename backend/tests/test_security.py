import jwt
import pytest

import models
from tests.conftest import PASSWORD, login_staff, login_user


# ── Unauthenticated access ────────────────────────────────────────────────────
@pytest.mark.parametrize("method,path", [
    ("get", "/users"), ("get", "/users/someone"), ("patch", "/users/someone"), ("delete", "/users/someone"),
    ("get", "/staff"), ("patch", "/staff/someone"), ("delete", "/staff/someone"),
    ("get", "/companies"), ("post", "/companies"), ("patch", "/companies/acme"),
    ("post", "/use-cases"), ("delete", "/use-cases/x"), ("get", "/use-cases/gallery"),
    ("get", "/api/decision-radar/history"), ("get", "/api/strap-diagnostics/history"),
    ("get", "/api/strapilot/history"), ("post", "/api/reports/email"), ("get", "/me"),
])
def test_protected_endpoints_reject_anonymous(client, method, path):
    res = getattr(client, method)(path, **({"json": {}} if method in ("post", "patch") else {}))
    assert res.status_code == 401, (path, res.status_code, res.text)


def test_public_endpoints_stay_open(client):
    assert client.get("/use-cases", params={"status": "published"}).status_code == 200


# ── Sessions ──────────────────────────────────────────────────────────────────
def test_login_sets_httponly_cookie_and_me_works(client, make_user):
    make_user()
    res = login_user(client)
    cookie = res.headers["set-cookie"]
    assert "atperf_user=" in cookie and "HttpOnly" in cookie and "samesite=lax" in cookie.lower()
    assert client.get("/me").json()["email"] == "user@client.com"


def test_logout_ends_session(client, make_user):
    make_user()
    login_user(client)
    assert client.post("/logout").status_code == 204
    assert client.get("/me").status_code == 401


def test_forged_or_raw_id_tokens_are_rejected(client, make_user):
    make_user()
    forged = jwt.encode({"sub": "user@client.com", "kind": "user"}, "wrong-key", algorithm="HS256")
    client.cookies.set("atperf_user", forged)
    assert client.get("/me").status_code == 401
    # The old StrAPilot scheme (raw user_id as bearer token) no longer authenticates.
    client.cookies.clear()
    assert client.get("/api/strapilot/history", headers={"Authorization": "Bearer user@client.com"}).status_code == 401


def test_user_token_cannot_be_used_as_staff_token(client, make_user, make_staff):
    make_user(email="staff@atperf.com")
    make_staff(role="super_admin")
    token = login_user(client, "staff@atperf.com").cookies["atperf_user"]
    client.cookies.clear()
    client.cookies.set("atperf_staff", token)
    assert client.get("/staff").status_code == 401


def test_suspended_account_loses_access_immediately(client, db, make_user):
    make_user()
    login_user(client)
    db.query(models.ExternalUser).filter_by(user_id="user@client.com").update({"status": "suspended"})
    db.commit()
    assert client.get("/me").status_code == 401


# ── External users ────────────────────────────────────────────────────────────
def test_user_can_edit_own_identity_but_not_privileges(client, make_user):
    make_user()
    login_user(client)
    assert client.patch("/users/user@client.com", json={"first_name": "Annie"}).json()["first_name"] == "Annie"
    for field, value in [("role", "admin"), ("status", "active"), ("credit_balance", 9999), ("plan_type", "enterprise")]:
        assert client.patch("/users/user@client.com", json={field: value}).status_code == 403


def test_user_cannot_read_or_edit_someone_else(client, make_user):
    make_user()
    make_user(email="other@client.com")
    login_user(client)
    assert client.get("/users").status_code == 403
    assert client.get("/users/other@client.com").status_code == 403
    assert client.patch("/users/other@client.com", json={"first_name": "X"}).status_code == 403
    assert client.delete("/users/other@client.com").status_code == 403


def test_user_can_delete_own_account(client, make_user):
    make_user()
    login_user(client)
    assert client.delete("/users/user@client.com").status_code == 204


def test_history_is_limited_to_the_session_user(client, make_user):
    make_user()
    login_user(client)
    assert client.get("/api/decision-radar/history").status_code == 200
    assert client.get("/api/decision-radar/history", params={"user_id": "other"}).status_code == 403
    assert client.get("/api/strap-diagnostics/history", params={"user_id": "other"}).status_code == 403
    assert client.get("/api/strapilot/history", params={"user_id": "other"}).status_code == 403


def test_strap_diagnostic_rejects_spoofed_user_id(client, make_user):
    make_user(email="victim@client.com")
    answers = {k: "A" for k in ("q_pilotage", "q_incidents", "q_pertes", "q_anticipation", "q_organisation")}
    res = client.post("/analyze-strap", json={"user_id": "victim@client.com", **answers})
    assert res.status_code == 401


# ── Staff & admin rules ───────────────────────────────────────────────────────
def test_staff_member_can_view_but_not_manage(client, make_user, make_staff):
    make_user()
    make_staff(role="member")
    login_staff(client)
    assert client.get("/users").status_code == 200
    assert client.get("/staff").status_code == 200
    assert client.patch("/users/user@client.com", json={"status": "suspended"}).status_code == 403
    assert client.post("/companies", json={"company_name": "New"}).status_code == 403


def test_admin_manages_users_but_cannot_grant_super_admin(client, make_user, make_staff):
    make_user()
    make_staff(role="admin")
    make_staff(email="junior@atperf.com", role="member")
    login_staff(client)
    assert client.patch("/users/user@client.com", json={"status": "suspended"}).json()["status"] == "suspended"
    assert client.patch("/staff/junior@atperf.com", json={"internal_role": "admin"}).status_code == 200
    assert client.patch("/staff/junior@atperf.com", json={"internal_role": "super_admin"}).status_code == 403
    assert client.patch("/staff/staff@atperf.com", json={"internal_role": "super_admin"}).status_code == 403
    assert client.delete("/staff/junior@atperf.com").status_code == 403


def test_super_admin_can_delete_others_but_not_self(client, make_staff):
    make_staff(role="super_admin")
    make_staff(email="junior@atperf.com")
    login_staff(client)
    assert client.delete("/staff/junior@atperf.com").status_code == 204
    assert client.delete("/staff/staff@atperf.com").status_code == 400


def test_pending_staff_cannot_log_in(client, make_staff):
    make_staff(status="pending")
    assert client.post("/staff/login", json={"email": "staff@atperf.com", "password": PASSWORD}).status_code == 403


# ── Use cases ─────────────────────────────────────────────────────────────────
def test_drafts_are_staff_only(client, make_staff):
    assert client.get("/use-cases").status_code == 403
    assert client.get("/use-cases", params={"status": "draft"}).status_code == 403
    make_staff()
    login_staff(client)
    assert client.get("/use-cases").status_code == 200


def test_upload_rejects_active_content(client, make_staff):
    make_staff()
    login_staff(client)
    res = client.post("/use-cases/upload", files={"file": ("x.html", b"<script>alert(1)</script>", "text/html")})
    assert res.status_code == 400
    res = client.post("/use-cases/upload", files={"file": ("x.svg", b"<svg onload=alert(1)>", "image/svg+xml")})
    assert res.status_code == 400


# ── Rate limiting & CORS ──────────────────────────────────────────────────────
def test_login_brute_force_is_rate_limited(client, make_user):
    make_user()
    codes = [client.post("/login", json={"email": "user@client.com", "password": "wrong"}).status_code for _ in range(11)]
    assert codes[:10] == [401] * 10 and codes[10] == 429


def test_otp_guessing_is_rate_limited(client):
    codes = [client.post("/verify-otp", json={"email": "a@b.com", "otp": "000000"}).status_code for _ in range(6)]
    assert codes[5] == 429


def test_cors_only_allows_the_site(client):
    ok = client.get("/use-cases", params={"status": "published"}, headers={"Origin": "https://atperf.com"})
    assert ok.headers.get("access-control-allow-origin") == "https://atperf.com"
    evil = client.get("/use-cases", params={"status": "published"}, headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in evil.headers
