from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import TokenError, decode_access_token
from app.db.session import get_db
from app.models.user import User

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from the Bearer access token.

    Multi-tenancy rule: every tenant-scoped query in later weeks must filter by `current_user.id`.
    The user id comes only from the signed token, never from the request body or URL.
    """
    unauthorized = AppError(401, "UNAUTHORIZED", "Missing, invalid, or expired access token.")
    if creds is None or creds.scheme.lower() != "bearer":
        raise unauthorized
    try:
        user_id = decode_access_token(creds.credentials)
    except TokenError:
        raise unauthorized
    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    return user
