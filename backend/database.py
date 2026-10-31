from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# GCP DB — atperf (single database for all tables)
# ─────────────────────────────────────────────
# Credentials come from the environment (backend/.env) only — never from the code.
# GCP_DATABASE_URL, when set, overrides the individual parts (e.g. tests use SQLite).
GCP_DATABASE_URL = os.getenv("GCP_DATABASE_URL")
if not GCP_DATABASE_URL:
    missing = [k for k in ("GCP_DB_USER", "GCP_DB_PASSWORD", "GCP_DB_HOST") if not os.getenv(k)]
    if missing:
        raise RuntimeError(f"Missing database settings in backend/.env: {', '.join(missing)}")
    GCP_DATABASE_URL = (
        f"mysql+pymysql://{os.getenv('GCP_DB_USER')}:{os.getenv('GCP_DB_PASSWORD')}"
        f"@{os.getenv('GCP_DB_HOST')}:{os.getenv('GCP_DB_PORT', '3306')}/{os.getenv('GCP_DB_NAME', 'atperf')}"
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
