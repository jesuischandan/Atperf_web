from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import string
from pydantic import BaseModel

import models
import schemas
from database import get_gcp_db
from email_utils import send_otp_email
from dependencies import hash_password, verify_password, generate_staff_id

router = APIRouter(tags=["Staff"])

@router.post("/staff/register", response_model=schemas.StaffResponse, status_code=status.HTTP_201_CREATED)
def register_staff(staff_in: schemas.StaffCreate, gcp_db: Session = Depends(get_gcp_db)):
    if not staff_in.email.endswith("@atperf.com"):
        raise HTTPException(status_code=400, detail="Only @atperf.com emails are allowed for internal staff.")

    existing = gcp_db.query(models.InternalUser).filter(models.InternalUser.email == staff_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered as staff.")

    # Generate staff_id — count existing entries with same name prefix
    prefix = f"atperf{datetime.now().strftime('%m%Y')}{staff_in.first_name[0].lower()}{staff_in.last_name.lower()}"
    count_row = gcp_db.query(models.InternalUser).filter(
        models.InternalUser.staff_id.like(f"{prefix}%")
    ).count()
    staff_id = generate_staff_id(staff_in.first_name, staff_in.last_name, count_row + 1)

    staff = models.InternalUser(
        staff_id=staff_id,
        first_name=staff_in.first_name,
        last_name=staff_in.last_name,
        email=staff_in.email,
        password_hash=hash_password(staff_in.password),
        internal_role="member",
        status="pending",
        mfa_enabled=0,
        is_email_verified=0,
    )
    gcp_db.add(staff)

    # Generate OTP (stored in GCP DB)
    otp_code = "".join(random.choices(string.digits, k=6))
    gcp_db.query(models.EmailVerification).filter(models.EmailVerification.email == staff_in.email).delete()
    gcp_db.add(models.EmailVerification(
        email=staff_in.email,
        otp_hash=hash_password(otp_code),
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    ))

    gcp_db.commit()
    gcp_db.refresh(staff)
    send_otp_email(staff_in.email, otp_code)

    return staff

@router.post("/staff/forgot-password", status_code=200)
def staff_forgot_password(req: schemas.ForgotPasswordRequest, gcp_db: Session = Depends(get_gcp_db)):
    staff = gcp_db.query(models.InternalUser).filter(models.InternalUser.email == req.email).first()
    if not staff:
        # Prevent email enumeration by returning a generic success message
        return {"message": "If the email is registered, an OTP has been sent."}

    if staff.status != "active":
        # Don't let suspended or pending accounts do this
        return {"message": "If the email is registered, an OTP has been sent."}

    otp_code = "".join(random.choices(string.digits, k=6))
    gcp_db.query(models.EmailVerification).filter(models.EmailVerification.email == req.email).delete()
    gcp_db.add(models.EmailVerification(
        email=req.email,
        otp_hash=hash_password(otp_code),
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    ))
    gcp_db.commit()

    send_otp_email(req.email, otp_code)
    return {"message": "If the email is registered, an OTP has been sent."}

@router.post("/staff/reset-password", status_code=200)
def staff_reset_password(req: schemas.PasswordResetRequest, gcp_db: Session = Depends(get_gcp_db)):
    staff = gcp_db.query(models.InternalUser).filter(models.InternalUser.email == req.email).first()
    if not staff or staff.status != "active":
        raise HTTPException(status_code=400, detail="Invalid request.")

    verification = gcp_db.query(models.EmailVerification).filter(models.EmailVerification.email == req.email).first()
    if not verification:
        raise HTTPException(status_code=400, detail="No pending password reset request.")

    if datetime.utcnow() > verification.expires_at:
        gcp_db.delete(verification)
        gcp_db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired.")

    if not verify_password(req.otp, verification.otp_hash):
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    staff.password_hash = hash_password(req.new_password)
    gcp_db.delete(verification)
    gcp_db.commit()

    return {"message": "Password updated successfully."}


@router.post("/staff/login", response_model=schemas.StaffResponse)
def login_staff(login_in: schemas.StaffLogin, gcp_db: Session = Depends(get_gcp_db)):
    staff = gcp_db.query(models.InternalUser).filter(models.InternalUser.email == login_in.email).first()
    if staff is None or not verify_password(login_in.password, staff.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if staff.status != "active":
        if staff.status == "pending":
            raise HTTPException(status_code=403, detail="Staff account is pending approval by an admin.")
        if staff.status == "suspended":
            raise HTTPException(status_code=403, detail="This account has been suspended.")
        raise HTTPException(status_code=403, detail="Account not active.")

    staff.last_login = datetime.utcnow()
    gcp_db.commit()
    gcp_db.refresh(staff)
    return staff


@router.get("/staff", response_model=List[schemas.StaffResponse])
def list_staff(gcp_db: Session = Depends(get_gcp_db)):
    """List all internal staff for administration."""
    return gcp_db.query(models.InternalUser).filter(
        models.InternalUser.deleted_at == None
    ).order_by(models.InternalUser.created_at.desc()).all()


class StaffUpdatePayload(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    internal_role: Optional[str] = None
    status: Optional[str] = None


@router.patch("/staff/{staff_id}", response_model=schemas.StaffResponse)
def update_staff(staff_id: str, payload: StaffUpdatePayload, gcp_db: Session = Depends(get_gcp_db)):
    staff = gcp_db.query(models.InternalUser).filter(models.InternalUser.staff_id == staff_id).first()
    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    if payload.first_name is not None:
        staff.first_name = payload.first_name
    if payload.last_name is not None:
        staff.last_name = payload.last_name
    if payload.email is not None:
        existing = gcp_db.query(models.InternalUser).filter(
            models.InternalUser.email == payload.email,
            models.InternalUser.staff_id != staff_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use by another staff member.")
        staff.email = payload.email
    if payload.internal_role is not None:
        staff.internal_role = payload.internal_role
    if payload.status is not None:
        staff.status = payload.status

    gcp_db.commit()
    gcp_db.refresh(staff)
    return staff


@router.delete("/staff/{staff_id}", status_code=204)
def delete_staff(staff_id: str, gcp_db: Session = Depends(get_gcp_db)):
    """Soft-delete an internal staff account (sets deleted_at)."""
    staff = gcp_db.query(models.InternalUser).filter(models.InternalUser.staff_id == staff_id).first()
    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found.")
    staff.deleted_at = datetime.utcnow()
    gcp_db.commit()
