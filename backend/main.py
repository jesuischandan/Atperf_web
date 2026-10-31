import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import gcp_engine

# Import routers
from api.auth import router as auth_router
from api.staff import router as staff_router
from api.users import router as users_router
from api.strap_diagnostics import router as strap_router
from api.decision_radar import router as radar_router
from api.companies import router as companies_router
from api.reports import router as reports_router
from api.contact import router as contact_router
from api.use_cases import router as use_cases_router
from api.strapilot import router as strapilot_router

# Create tables
models.GCPBase.metadata.create_all(bind=gcp_engine)

app = FastAPI(title="Atperf API")

# Only the site itself (and the local dev server) may call the API with credentials.
CORS_ORIGINS = [
    o.strip() for o in os.getenv(
        "CORS_ORIGINS",
        "https://atperf.com,https://www.atperf.com,http://localhost:35000,http://127.0.0.1:35000",
    ).split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(staff_router)
app.include_router(users_router)
app.include_router(strap_router)
app.include_router(radar_router)
app.include_router(companies_router)
app.include_router(reports_router)
app.include_router(contact_router)
app.include_router(use_cases_router)
app.include_router(strapilot_router)
