"""Password hashing (bcrypt) and token helpers (JWT access tokens, opaque refresh tokens)."""
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import get_settings


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(dt: datetime) -> datetime:
    """Treat naive datetimes as UTC so comparisons never raise."""
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)


# ---------- passwords ----------
def hash_password(plain: str) -> str:
    rounds = get_settings().bcrypt_rounds
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=rounds)).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("ascii"))
    except ValueError:
        return False


# A real bcrypt hash of a random value. Login verifies against it when the email is unknown,
# so response time does not reveal whether an account exists.
DUMMY_HASH = hash_password(secrets.token_urlsafe(16))


# ---------- access tokens (JWT) ----------
class TokenError(Exception):
    pass


def create_access_token(user_id: uuid.UUID) -> tuple[str, int]:
    s = get_settings()
    now = utcnow()
    expires = now + timedelta(minutes=s.access_token_minutes)
    payload = {
        "sub": str(user_id),
        "type": "access",
        "jti": uuid.uuid4().hex,
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
    }
    return jwt.encode(payload, s.jwt_secret, algorithm=s.jwt_algorithm), s.access_token_minutes * 60


def decode_access_token(token: str) -> uuid.UUID:
    s = get_settings()
    try:
        payload = jwt.decode(token, s.jwt_secret, algorithms=[s.jwt_algorithm], options={"require": ["exp", "sub"]})
    except jwt.PyJWTError as exc:
        raise TokenError("invalid or expired token") from exc
    if payload.get("type") != "access":
        raise TokenError("wrong token type")
    try:
        return uuid.UUID(payload["sub"])
    except ValueError as exc:
        raise TokenError("bad subject") from exc


# ---------- refresh tokens (opaque, stored hashed) ----------
def new_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
