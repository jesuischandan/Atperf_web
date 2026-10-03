from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# GCP DB — atperf (single database for all tables)
# ─────────────────────────────────────────────
GCP_DB_USER     = os.getenv("GCP_DB_USER",     "atperf_admin")
GCP_DB_PASSWORD = os.getenv("GCP_DB_PASSWORD", "AtperfAdmin")
GCP_DB_HOST     = os.getenv("GCP_DB_HOST",     "34.155.81.181")
GCP_DB_PORT     = os.getenv("GCP_DB_PORT",     "3306")
GCP_DB_NAME     = os.getenv("GCP_DB_NAME",     "atperf")

GCP_DATABASE_URL = (
    f"mysql+pymysql://{GCP_DB_USER}:{GCP_DB_PASSWORD}@{GCP_DB_HOST}:{GCP_DB_PORT}/{GCP_DB_NAME}"
)

gcp_engine      = create_engine(GCP_DATABASE_URL)
GCPSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=gcp_engine)
GCPBase         = declarative_base()


def get_gcp_db():
    db = GCPSessionLocal()
    try:
        yield db
    finally:
        db.close()
