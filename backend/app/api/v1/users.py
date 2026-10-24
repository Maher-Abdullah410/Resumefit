from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.auth import UserOut

router = APIRouter(prefix="/users", tags=["users"])


# U1: GET /users/me
@router.get("/me", response_model=UserOut)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user
