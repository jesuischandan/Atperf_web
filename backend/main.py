import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import gcp_engine
from sqlalchemy import inspect, text

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
from api.strap_maintenance import router as maintenance_router

# Create tables
models.GCPBase.metadata.create_all(bind=gcp_engine)


def ensure_columns():
    """create_all() never alters existing tables: add columns introduced after a table was created."""
    added = {"companies": {"maintenance_pilot": "SMALLINT DEFAULT 0"}}
    inspector = inspect(gcp_engine)
    with gcp_engine.begin() as conn:
        for table, columns in added.items():
            existing = {c["name"] for c in inspector.get_columns(table)}
            for name, ddl in columns.items():
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))


ensure_columns()

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
app.include_router(maintenance_router)
