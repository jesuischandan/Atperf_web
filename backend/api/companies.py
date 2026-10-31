from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
import uuid

import models
import schemas
from database import get_gcp_db
from security import Principal, require_admin_panel, require_company_editor

router = APIRouter(tags=["Companies"])

@router.get("/companies", response_model=List[schemas.CompanyResponse])
def list_companies(gcp_db: Session = Depends(get_gcp_db), _: Principal = Depends(require_admin_panel)):
    """List all companies."""
    return gcp_db.query(models.GCPCompany).order_by(models.GCPCompany.created_at.desc()).all()


@router.post("/companies", response_model=schemas.CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(company_in: schemas.CompanyCreate, gcp_db: Session = Depends(get_gcp_db),
                   _: Principal = Depends(require_company_editor)):
    existing = gcp_db.query(models.GCPCompany).filter(
        models.GCPCompany.company_name == company_in.company_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A company with this name already exists.")

    company = models.GCPCompany(
        company_id=str(uuid.uuid4()),
        company_name=company_in.company_name,
        industry_sector=company_in.industry_sector,
        tax_id=company_in.tax_id,
        billing_contact_email=company_in.billing_contact_email,
    )
    gcp_db.add(company)
    gcp_db.commit()
    gcp_db.refresh(company)
    return company


@router.patch("/companies/{company_id}", response_model=schemas.CompanyResponse)
def update_company(company_id: str, payload: schemas.CompanyUpdate, gcp_db: Session = Depends(get_gcp_db),
                   _: Principal = Depends(require_company_editor)):
    company = gcp_db.query(models.GCPCompany).filter(models.GCPCompany.company_id == company_id).first()
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found.")

    if payload.company_name is not None:
        company.company_name = payload.company_name
    if payload.industry_sector is not None:
        company.industry_sector = payload.industry_sector
    if payload.tax_id is not None:
        company.tax_id = payload.tax_id
    if payload.billing_contact_email is not None:
        company.billing_contact_email = payload.billing_contact_email
    if payload.plan_type is not None:
        company.plan_type = payload.plan_type
    if payload.company_status is not None:
        company.company_status = payload.company_status
    if payload.total_credits is not None:
        company.total_credits = payload.total_credits
    if payload.max_users is not None:
        company.max_users = payload.max_users

    gcp_db.commit()
    gcp_db.refresh(company)
    return company
