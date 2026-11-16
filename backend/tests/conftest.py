"""Test fixtures use a dedicated PostgreSQL database supplied via TEST_DATABASE_URL."""
import os

import pytest

os.environ.setdefault("JWT_SECRET", "test-secret-test-secret-test-secret-123456")
os.environ.setdefault("BCRYPT_ROUNDS", "4")      # fast hashing in tests only; production default is 12
os.environ.setdefault("COOKIE_SECURE", "true")

DB_URL = os.environ.get("TEST_DATABASE_URL")
if not DB_URL:
    raise RuntimeError(
        "Set TEST_DATABASE_URL to a dedicated PostgreSQL test database. "
        "Tests drop and recreate tables in that database."
    )
os.environ["DATABASE_URL"] = DB_URL

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402
from app import models as _models  # noqa: E402,F401

engine = create_engine(DB_URL, pool_pre_ping=True)
TestingSession = sessionmaker(bind=engine, expire_on_commit=False)


@pytest.fixture(scope="session", autouse=True)
def _schema():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE resume_analyses, refresh_tokens, users RESTART IDENTITY CASCADE"))
    yield


@pytest.fixture
def db():
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    def _override():
        s = TestingSession()
        try:
            yield s
        finally:
            s.close()
    fastapi_app.dependency_overrides[get_db] = _override
    with TestClient(fastapi_app, base_url="https://testserver") as c:   # https so Secure cookies are sent back
        yield c
    fastapi_app.dependency_overrides.clear()


GOOD_PASSWORD = "S3cure!Pass42"


def register(client, email="maher@example.com", name="Maher Abdullah", password=GOOD_PASSWORD, consent=True):
    return client.post("/api/v1/auth/register",
                       json={"full_name": name, "email": email, "password": password, "consent": consent})


def login(client, email="maher@example.com", password=GOOD_PASSWORD):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})
