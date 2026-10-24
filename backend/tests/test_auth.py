from datetime import timedelta

from sqlalchemy import select, text

from app.core.security import utcnow
from app.models.user import RefreshToken, User
from tests.conftest import GOOD_PASSWORD, login, register


# ---------------- sign up ----------------
def test_register_success_hides_password_and_stores_bcrypt(client, db):
    r = register(client)
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == "maher@example.com" and "password" not in body and "password_hash" not in body
    stored = db.scalar(select(User.password_hash).where(User.email == "maher@example.com"))
    assert stored.startswith("$2b$") and GOOD_PASSWORD not in stored


def test_register_normalizes_email_and_rejects_duplicates_case_insensitively(client):
    assert register(client, email="Maher@Example.COM").status_code == 201
    r = register(client, email="maher@example.com")
    assert r.status_code == 409 and r.json()["error"]["code"] == "EMAIL_EXISTS"


def test_register_db_unique_index_blocks_duplicates(db):
    now = utcnow()
    db.add(User(email="a@x.com", full_name="A", password_hash="h", consent_at=now))
    db.commit()
    db.add(User(email="A@X.com", full_name="B", password_hash="h", consent_at=now))
    try:
        db.commit()
        raise AssertionError("duplicate email was accepted by the database")
    except Exception as exc:
        assert "uq_users_email_lower" in str(exc)
        db.rollback()


def test_register_validation(client):
    for bad in ["short1", "onlyletters", "12345678", "a1" * 40]:
        r = register(client, password=bad)
        assert r.status_code == 422 and r.json()["error"]["code"] == "VALIDATION_ERROR", bad
    assert register(client, consent=False).status_code == 422
    assert register(client, email="not-an-email").status_code == 422
    assert register(client, name="   ").status_code == 422


# ---------------- login ----------------
def test_login_success_returns_jwt_and_secure_refresh_cookie(client):
    register(client)
    r = login(client)
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer" and body["expires_in"] == 3600 and body["access_token"]
    cookie = r.headers["set-cookie"].lower()
    assert "refresh_token=" in cookie and "httponly" in cookie and "secure" in cookie and "samesite=strict" in cookie
    assert "path=/api/v1/auth" in cookie


def test_wrong_password_and_unknown_email_look_identical(client):
    register(client)
    a = login(client, password="Wrong-pass1")
    b = login(client, email="nobody@example.com")
    assert a.status_code == b.status_code == 401
    assert a.json()["error"]["code"] == b.json()["error"]["code"] == "INVALID_CREDENTIALS"
    assert a.json()["error"]["message"] == b.json()["error"]["message"]


def test_lockout_after_five_failures_then_unlock(client, db):
    register(client)
    codes = [login(client, password="Wrong-pass1").status_code for _ in range(5)]
    assert codes == [401, 401, 401, 401, 423]
    assert login(client).status_code == 423          # correct password is refused while locked
    user = db.scalar(select(User))
    user.locked_until = utcnow() - timedelta(minutes=1)   # simulate 15 minutes passing
    db.commit()
    assert login(client).status_code == 200
    db.refresh(user)
    assert user.failed_logins == 0 and user.locked_until is None


def test_successful_login_resets_failed_counter(client, db):
    register(client)
    for _ in range(3):
        login(client, password="Wrong-pass1")
    assert login(client).status_code == 200
    assert db.scalar(select(User.failed_logins)) == 0


# ---------------- protected route ----------------
def test_me_requires_valid_token(client):
    assert client.get("/api/v1/users/me").status_code == 401
    assert client.get("/api/v1/users/me", headers={"Authorization": "Bearer garbage"}).status_code == 401
    assert client.get("/api/v1/users/me", headers={"Authorization": "Basic abc"}).status_code == 401


def test_me_returns_current_user(client):
    register(client)
    token = login(client).json()["access_token"]
    r = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200 and r.json()["email"] == "maher@example.com"


# ---------------- multi-tenancy ----------------
def test_users_are_isolated_from_each_other(client):
    register(client, email="a@example.com", name="User A")
    register(client, email="b@example.com", name="User B")
    ta = login(client, email="a@example.com").json()["access_token"]
    tb = login(client, email="b@example.com").json()["access_token"]
    me_a = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {ta}"}).json()
    me_b = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {tb}"}).json()
    assert me_a["email"] == "a@example.com" and me_b["email"] == "b@example.com" and me_a["id"] != me_b["id"]


def test_token_for_deleted_user_is_rejected(client, db):
    register(client)
    token = login(client).json()["access_token"]
    db.execute(text("DELETE FROM users"))
    db.commit()
    assert client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


# ---------------- refresh / logout ----------------
def test_refresh_rotates_token_and_detects_reuse(client, db):
    register(client)
    login(client)
    first_cookie = client.cookies.get("refresh_token", path="/api/v1/auth")
    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 200 and r.json()["access_token"]
    second_cookie = client.cookies.get("refresh_token", path="/api/v1/auth")
    assert second_cookie and second_cookie != first_cookie
    # replay the OLD token: must fail and revoke the whole session family
    client.cookies.set("refresh_token", first_cookie, path="/api/v1/auth")
    reuse = client.post("/api/v1/auth/refresh")
    assert reuse.status_code == 401 and reuse.json()["error"]["code"] == "REFRESH_TOKEN_REUSED"
    assert db.scalar(select(RefreshToken.id).where(RefreshToken.revoked_at.is_(None))) is None
    client.cookies.set("refresh_token", second_cookie, path="/api/v1/auth")
    assert client.post("/api/v1/auth/refresh").status_code == 401


def test_refresh_without_cookie_fails(client):
    assert client.post("/api/v1/auth/refresh").status_code == 401


def test_refresh_token_is_stored_hashed(client, db):
    register(client)
    login(client)
    raw = client.cookies.get("refresh_token", path="/api/v1/auth")
    stored = db.scalar(select(RefreshToken.token_hash))
    assert stored != raw and len(stored) == 64


def test_logout_revokes_refresh_token(client, db):
    register(client)
    token = login(client).json()["access_token"]
    assert client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"}).status_code == 204
    assert db.scalar(select(RefreshToken.revoked_at)) is not None
    assert client.post("/api/v1/auth/refresh").status_code == 401


def test_logout_requires_authentication(client):
    assert client.post("/api/v1/auth/logout").status_code == 401


# ---------------- API conventions ----------------
def test_error_body_and_request_id_and_security_headers(client):
    r = client.get("/api/v1/users/me")
    err = r.json()["error"]
    assert err["code"] == "UNAUTHORIZED" and err["request_id"] == r.headers["X-Request-ID"]
    assert r.headers["X-Content-Type-Options"] == "nosniff" and r.headers["X-Frame-Options"] == "DENY"


def test_health_reports_database_up(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json() == {"status": "ok", "database": "up"}
