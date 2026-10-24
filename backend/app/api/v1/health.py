from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter(tags=["system"])


@router.get("/health")
def health(db: Session = Depends(get_db)):
    """Liveness plus database connectivity (used by uptime monitoring, NFR-17)."""
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse({"status": "degraded", "database": "down"}, status_code=503)
    return {"status": "ok", "database": "up"}
