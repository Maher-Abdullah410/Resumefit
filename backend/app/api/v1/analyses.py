from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.analysis import ResumeAnalysis
from app.models.user import User
from app.schemas.analysis import AnalysisCreate, AnalysisOut
from app.services.ats import analyze_resume

router = APIRouter(prefix="/analyses", tags=["analyses"])


@router.post("", response_model=AnalysisOut, status_code=201)
def create_analysis(
    body: AnalysisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = analyze_resume(body.resume_text, body.job_description)
    analysis = ResumeAnalysis(
        user_id=current_user.id,
        resume_text=body.resume_text,
        job_description=body.job_description,
        **result,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@router.get("", response_model=list[AnalysisOut])
def list_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.scalars(
        select(ResumeAnalysis)
        .where(ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.created_at.desc(), ResumeAnalysis.id.desc())
    ).all()
