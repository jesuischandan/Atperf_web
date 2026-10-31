from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import random
import string

import models
import schemas
from database import get_gcp_db
from email_utils import send_otp_email, notify_admins_new_request
from dependencies import hash_password, verify_password
from security import (
    check_rate, clear_session_cookie, client_ip, rate_limit, require_user, set_session_cookie,
)

router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(rate_limit("register", 5, 3600))])
def register(user_in: schemas.UserCreate, gcp_db: Session = Depends(get_gcp_db)):
    existing = gcp_db.query(models.ExternalUser).filter(models.ExternalUser.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered.")

    # ── Find or create company in GCP ────────────────────────────────
    company_name = (user_in.company_name or "Independent").strip()
    company = gcp_db.query(models.GCPCompany).filter(
        models.GCPCompany.company_name == company_name
    ).first()
    
    if company is None:
        new_company_id = company_name.replace(" ", "_").lower()
        if new_company_id == "independent":
            new_company_id = str(uuid.uuid4())
        else:
            # Check for ID collisions (e.g. if another company name collapsed to the same ID)
            existing_id = gcp_db.query(models.GCPCompany).filter(models.GCPCompany.company_id == new_company_id).first()
            if existing_id:
                new_company_id = f"{new_company_id}_{uuid.uuid4().hex[:8]}"

        # Auto-fill using OpenAI
        from prompts.CompanyInfo import guess_company_info
        ai_info = None
        if company_name.lower() != "independent":
            ai_info = guess_company_info(company_name, user_location=user_in.location)

        company = models.GCPCompany(
            company_id=new_company_id,
            company_name=company_name,
            industry_sector=ai_info.industry_sectors if ai_info and ai_info.industry_sectors else user_in.company_industry,
            company_ho=ai_info.company_ho if ai_info else None
        )
        gcp_db.add(company)
        gcp_db.flush()

    # ── Create external user ───────────────────────────────────────
    user = models.ExternalUser(
        user_id=str(uuid.uuid4()),
        company_id=company.company_id,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        role="user",
        status="active",
        plan_type="free",
        credit_balance=100,   # starter credits
        is_email_verified=0,  # requires OTP verification
    )
    gcp_db.add(user)

    # ── OTP stored in GCP DB ──────────────────────────────────────────
    otp_code = "".join(random.choices(string.digits, k=6))
    otp_hash = hash_password(otp_code)
    gcp_db.query(models.EmailVerification).filter(models.EmailVerification.email == user_in.email).delete()
    gcp_db.add(models.EmailVerification(
        email=user_in.email,
        otp_hash=otp_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    ))

    gcp_db.commit()
    gcp_db.refresh(user)
    send_otp_email(user_in.email, otp_code)

    user_dict = {c.name: getattr(user, c.name) for c in user.__table__.columns}
    user_dict["company_name"] = company.company_name
    return user_dict


@router.post("/verify-otp")
def verify_otp(payload: schemas.OTPVerify, request: Request, gcp_db: Session = Depends(get_gcp_db)):
    check_rate(f"otp-ip:{client_ip(request)}", 10, 900)
    check_rate(f"otp-email:{payload.email.lower()}", 5, 900)
    verification = gcp_db.query(models.EmailVerification).filter(models.EmailVerification.email == payload.email).first()
    if not verification:
        raise HTTPException(status_code=400, detail="OTP not found or already verified.")
        
    if verification.expires_at < datetime.utcnow():
        gcp_db.delete(verification)
        gcp_db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired.")
        
    if not verify_password(payload.otp, verification.otp_hash):
        raise HTTPException(status_code=400, detail="Invalid OTP code.")
        
    notify_type = None
    notify_name = None

    # Check external user
    ext_user = gcp_db.query(models.ExternalUser).filter(models.ExternalUser.email == payload.email).first()
    if ext_user and ext_user.is_email_verified == 0:
        ext_user.is_email_verified = 1
        gcp_db.commit()
        notify_type = "External User"
        notify_name = f"{ext_user.first_name} {ext_user.last_name}"

    # Check internal staff
    staff = gcp_db.query(models.InternalUser).filter(models.InternalUser.email == payload.email).first()
    if staff and staff.status == "pending":
        staff.is_email_verified = 1
        staff.email_verified_at = datetime.utcnow()
        # status stays pending — requires admin approval
        gcp_db.commit()
        notify_type = "Internal Staff"
        notify_name = f"{staff.first_name} {staff.last_name}"

    # Delete OTP record
    gcp_db.delete(verification)
    gcp_db.commit()

    # Notify admins
    if notify_type and notify_name:
        import threading
        all_admin_emails = [
            s.email for s in gcp_db.query(models.InternalUser).filter(
                models.InternalUser.internal_role.in_(["admin", "super_admin"]),
                models.InternalUser.status == "active"
            ).all()
        ]
        threading.Thread(
            target=notify_admins_new_request,
            args=(all_admin_emails, notify_name, payload.email, notify_type),
            daemon=True
        ).start()

    return {"message": "Email verified successfully."}


@router.post("/login", response_model=schemas.UserResponse)
def login(login_in: schemas.UserLogin, request: Request, response: Response, gcp_db: Session = Depends(get_gcp_db)):
    check_rate(f"login-ip:{client_ip(request)}", 20, 900)
    check_rate(f"login-email:{login_in.email.lower()}", 10, 900)
    user = gcp_db.query(models.ExternalUser).filter(models.ExternalUser.email == login_in.email).first()
    if user is None or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if user.is_email_verified == 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your email via the OTP sent to you.")

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended or expired. Please contact support.",
        )

    company = gcp_db.query(models.GCPCompany).filter(models.GCPCompany.company_id == user.company_id).first()
    user_dict = {c.name: getattr(user, c.name) for c in user.__table__.columns}
    if company:
        user_dict["company_name"] = company.company_name

    set_session_cookie(response, request, "user", user.user_id)
    return user_dict


@router.post("/logout", status_code=204)
def logout(response: Response):
    clear_session_cookie(response, "user")


@router.get("/me", response_model=schemas.UserResponse)
def me(user: models.ExternalUser = Depends(require_user), gcp_db: Session = Depends(get_gcp_db)):
    company = gcp_db.query(models.GCPCompany).filter(models.GCPCompany.company_id == user.company_id).first()
    user_dict = {c.name: getattr(user, c.name) for c in user.__table__.columns}
    if company:
        user_dict["company_name"] = company.company_name
    return user_dict


@router.post("/api/auth/forgot-password/send-otp", dependencies=[Depends(rate_limit("forgot-send", 5, 3600))])
def forgot_password_send_otp(payload: schemas.ForgotPasswordRequest, gcp_db: Session = Depends(get_gcp_db)):
    # Check if email exists in external or internal users
    ext_user = gcp_db.query(models.ExternalUser).filter(models.ExternalUser.email == payload.email).first()
    int_user = gcp_db.query(models.InternalUser).filter(models.InternalUser.email == payload.email).first()
    
    if not ext_user and not int_user:
        raise HTTPException(status_code=404, detail="Email not found.")
        
    otp_code = "".join(random.choices(string.digits, k=6))
    otp_hash = hash_password(otp_code)
    
    gcp_db.query(models.EmailVerification).filter(models.EmailVerification.email == payload.email).delete()
    gcp_db.add(models.EmailVerification(
        email=payload.email,
        otp_hash=otp_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    ))
    gcp_db.commit()
    
    send_otp_email(payload.email, otp_code)
    return {"message": "OTP sent successfully."}


@router.post("/api/auth/forgot-password/reset")
def forgot_password_reset(payload: schemas.PasswordResetRequest, request: Request, gcp_db: Session = Depends(get_gcp_db)):
    check_rate(f"otp-ip:{client_ip(request)}", 10, 900)
    check_rate(f"otp-email:{payload.email.lower()}", 5, 900)
    verification = gcp_db.query(models.EmailVerification).filter(models.EmailVerification.email == payload.email).first()
    if not verification:
        raise HTTPException(status_code=400, detail="OTP not found or already used.")
        
    if verification.expires_at < datetime.utcnow():
        gcp_db.delete(verification)
        gcp_db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired.")
        
    if not verify_password(payload.otp, verification.otp_hash):
        raise HTTPException(status_code=400, detail="Invalid OTP code.")
        
    new_hashed = hash_password(payload.new_password)
    
    ext_user = gcp_db.query(models.ExternalUser).filter(models.ExternalUser.email == payload.email).first()
    if ext_user:
        ext_user.password_hash = new_hashed
        
    int_user = gcp_db.query(models.InternalUser).filter(models.InternalUser.email == payload.email).first()
    if int_user:
        int_user.password_hash = new_hashed
        
    gcp_db.delete(verification)
    gcp_db.commit()
    
    return {"message": "Password has been reset successfully."}
