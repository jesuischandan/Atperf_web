"""Test setup: an isolated SQLite database and fixed secrets, configured before the app is imported."""
import os
import sys
import tempfile
from pathlib import Path

_DB = Path(tempfile.mkdtemp()) / "test.db"
os.environ["GCP_DATABASE_URL"] = f"sqlite:///{_DB}"
os.environ["JWT_SECRET"] = "test-secret"
os.environ.setdefault("OPENAI_API_KEY", "test-key")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402,F401  (creates the tables)
import models  # noqa: E402
import security  # noqa: E402
from database import GCPSessionLocal  # noqa: E402
from dependencies import hash_password  # noqa: E402

PASSWORD = "Secret-123"


@pytest.fixture(autouse=True)
def clean_state():
    security.reset_rate_limits()
    db = GCPSessionLocal()
    for table in reversed(models.GCPBase.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()
    db.close()
    yield


@pytest.fixture
def db():
    session = GCPSessionLocal()
    yield session
    session.close()


@pytest.fixture
def client():
    return TestClient(main.app)


@pytest.fixture
def make_user(db):
    def _make(email="user@client.com", role="user", status="active", user_id=None):
        if not db.query(models.GCPCompany).filter_by(company_id="acme").first():
            db.add(models.GCPCompany(company_id="acme", company_name="Acme"))
        user = models.ExternalUser(
            user_id=user_id or email, company_id="acme", first_name="Ann", last_name="Lee", email=email,
            password_hash=hash_password(PASSWORD), role=role, status=status, credit_balance=10, is_email_verified=1,
        )
        db.add(user)
        db.commit()
        return user
    return _make


@pytest.fixture
def make_staff(db):
    def _make(email="staff@atperf.com", role="member", status="active"):
        staff = models.InternalUser(
            staff_id=email, first_name="Sam", last_name="Roy", email=email,
            password_hash=hash_password(PASSWORD), internal_role=role, status=status, is_email_verified=1,
        )
        db.add(staff)
        db.commit()
        return staff
    return _make


def login_user(client, email="user@client.com"):
    res = client.post("/login", json={"email": email, "password": PASSWORD})
    assert res.status_code == 200, res.text
    return res


def login_staff(client, email="staff@atperf.com"):
    res = client.post("/staff/login", json={"email": email, "password": PASSWORD})
    assert res.status_code == 200, res.text
    return res
