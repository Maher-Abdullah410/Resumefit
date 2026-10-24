from datetime import timedelta

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.errors import AppError
from app.core.security import (DUMMY_HASH, as_utc, create_access_token, hash_password, hash_token,
                               new_refresh_token, utcnow, verify_password)
from app.db.session import get_db
from app.models.user import RefreshToken, User
from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
COOKIE_NAME = "refresh_token"
COOKIE_PATH = "/api/v1/auth"


def _set_refresh_cookie(response: Response, raw: str) -> None:
    s = get_settings()
    response.set_cookie(COOKIE_NAME, raw, max_age=s.refresh_token_days * 86400, path=COOKIE_PATH,
                        httponly=True, secure=s.cookie_secure, samesite="strict")


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path=COOKIE_PATH)


def _issue_refresh(db: Session, user_id) -> str:
    raw = new_refresh_token()
    db.add(RefreshToken(user_id=user_id, token_hash=hash_token(raw),
                        expires_at=utcnow() + timedelta(days=get_settings().refresh_token_days)))
    return raw


def _token_response(user: User, raw_refresh: str, response: Response) -> TokenOut:
    access, expires_in = create_access_token(user.id)
    _set_refresh_cookie(response, raw_refresh)
    return TokenOut(access_token=access, expires_in=expires_in, user=user)


# A1: POST /auth/register
@router.post("/register", response_model=UserOut, status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    if db.scalar(select(User.id).where(func.lower(User.email) == email)):
        raise AppError(409, "EMAIL_EXISTS", "An account with this email already exists.")
    user = User(email=email, full_name=body.full_name, password_hash=hash_password(body.password),
                consent_at=utcnow())
    db.add(user)
    try:
        db.commit()
    except IntegrityError:  # two sign-ups racing for the same email
        db.rollback()
        raise AppError(409, "EMAIL_EXISTS", "An account with this email already exists.")
    return user


# A2: POST /auth/login
@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, response: Response, db: Session = Depends(get_db)):
    s = get_settings()
    email = body.email.strip().lower()
    user = db.scalar(select(User).where(func.lower(User.email) == email).with_for_update())
    invalid = AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.")

    if user is None:
        verify_password(body.password, DUMMY_HASH)  # equalize timing; never reveal that the email is unknown
        raise invalid

    now = utcnow()
    if user.locked_until is not None:
        if as_utc(user.locked_until) > now:
            raise AppError(423, "ACCOUNT_LOCKED", "Account locked after too many failed attempts. Try again later.")
        user.locked_until, user.failed_logins = None, 0  # lock has expired

    if not verify_password(body.password, user.password_hash):
        user.failed_logins += 1
        locked = user.failed_logins >= s.max_failed_logins
        if locked:
            user.locked_until = now + timedelta(minutes=s.lockout_minutes)
        db.commit()
        if locked:
            raise AppError(423, "ACCOUNT_LOCKED", "Account locked after too many failed attempts. Try again later.")
        raise invalid

    user.failed_logins, user.locked_until = 0, None
    raw = _issue_refresh(db, user.id)
    db.commit()
    return _token_response(user, raw, response)


# A3: POST /auth/refresh  (rotating refresh tokens with reuse detection)
@router.post("/refresh", response_model=TokenOut)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    raw = request.cookies.get(COOKIE_NAME)
    if not raw:
        raise AppError(401, "INVALID_REFRESH_TOKEN", "Missing refresh token.")
    rec = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(raw)).with_for_update())
    if rec is None:
        _clear_refresh_cookie(response)
        raise AppError(401, "INVALID_REFRESH_TOKEN", "Invalid refresh token.")
    now = utcnow()
    if rec.revoked_at is not None:
        # An already-used token came back: assume theft and end every session of this user.
        db.execute(update(RefreshToken).where(RefreshToken.user_id == rec.user_id,
                                              RefreshToken.revoked_at.is_(None)).values(revoked_at=now))
        db.commit()
        raise AppError(401, "REFRESH_TOKEN_REUSED", "Refresh token was already used. Please log in again.")
    if as_utc(rec.expires_at) <= now:
        raise AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token expired.")
    user = db.get(User, rec.user_id)
    rec.revoked_at = now
    new_raw = _issue_refresh(db, user.id)
    db.commit()
    return _token_response(user, new_raw, response)


# A4: POST /auth/logout
@router.post("/logout", status_code=204)
def logout(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    raw = request.cookies.get(COOKIE_NAME)
    if raw:
        db.execute(update(RefreshToken).where(RefreshToken.token_hash == hash_token(raw),
                                              RefreshToken.user_id == current_user.id,
                                              RefreshToken.revoked_at.is_(None)).values(revoked_at=utcnow()))
        db.commit()
    response = Response(status_code=204)
    _clear_refresh_cookie(response)
    return response
