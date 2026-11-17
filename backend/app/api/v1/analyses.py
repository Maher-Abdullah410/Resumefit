import logging
import uuid
from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.errors import AppError
from app.db.session import get_db
from app.models.analysis import ResumeAnalysis
from app.models.user import User
from app.schemas.analysis import (
    AnalysisCreate,
    AnalysisDetail,
    AnalysisOut,
    CoverLetterOut,
    RewriteOut,
    RewriteRequest,
)
from app.services.ats import analyze_resume
from app.services.gemini import (
    generate_cover_letter,
    generate_resume_suggestions,
    rewrite_resume_bullet,
)

router = APIRouter(prefix="/analyses", tags=["analyses"])
logger = logging.getLogger(__name__)
MAX_PDF_BYTES = 5 * 1024 * 1024
MAX_PDF_PAGES = 50


@router.post("/extract")
async def extract_resume_text(
    file: UploadFile = File(...),
    _current_user: User = Depends(get_current_user),
):
    content = await file.read(MAX_PDF_BYTES + 1)
    if len(content) > MAX_PDF_BYTES:
        raise AppError(413, "PDF_TOO_LARGE", "PDF files must be 5 MB or smaller.")
    if not content.startswith(b"%PDF-"):
        raise AppError(400, "INVALID_PDF", "Upload a valid PDF file.")
    try:
        reader = PdfReader(BytesIO(content), strict=True)
        if reader.is_encrypted:
            raise AppError(400, "ENCRYPTED_PDF", "Password-protected PDFs are not supported.")
        if len(reader.pages) > MAX_PDF_PAGES:
            raise AppError(400, "PDF_TOO_MANY_PAGES", "PDF files must have 50 pages or fewer.")
        text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except (PdfReadError, EOFError, OSError, ValueError) as exc:
        raise AppError(400, "INVALID_PDF", "The PDF could not be read.") from exc
    if not text:
        raise AppError(400, "PDF_NO_TEXT", "No selectable text was found in the PDF.")
    return {"text": text[:30000]}


@router.post("", response_model=AnalysisOut, status_code=201)
def create_analysis(
    body: AnalysisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    custom_keywords = list(dict.fromkeys(
        keyword.strip() for keyword in body.custom_keywords if keyword.strip()
    ))
    result = analyze_resume(body.resume_text, body.job_description, custom_keywords)
    suggestions_error = None
    try:
        suggestions = generate_resume_suggestions(body.resume_text, body.job_description)
    except AppError as exc:
        if not exc.code.startswith("GEMINI_"):
            raise
        logger.warning("Saving resume analysis without Gemini suggestions: %s", exc.code)
        suggestions = []
        suggestions_error = exc.message
    analysis = ResumeAnalysis(
        user_id=current_user.id,
        job_title=body.job_title.strip(),
        custom_keywords=custom_keywords,
        resume_text=body.resume_text,
        job_description=body.job_description,
        suggestions=suggestions,
        suggestions_error=suggestions_error,
        **result,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@router.get("/{analysis_id}", response_model=AnalysisDetail)
def get_analysis(
    analysis_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = db.scalar(
        select(ResumeAnalysis).where(
            ResumeAnalysis.id == analysis_id,
            ResumeAnalysis.user_id == current_user.id,
        )
    )
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return analysis


@router.delete("/{analysis_id}", status_code=204)
def delete_analysis(
    analysis_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = db.scalar(
        select(ResumeAnalysis).where(
            ResumeAnalysis.id == analysis_id,
            ResumeAnalysis.user_id == current_user.id,
        )
    )
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    db.delete(analysis)
    db.commit()
    return Response(status_code=204)


@router.post("/{analysis_id}/rewrite", response_model=RewriteOut)
def rewrite_bullet(
    analysis_id: uuid.UUID,
    body: RewriteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = db.scalar(
        select(ResumeAnalysis).where(
            ResumeAnalysis.id == analysis_id,
            ResumeAnalysis.user_id == current_user.id,
        )
    )
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return {
        "suggestion": rewrite_resume_bullet(body.bullet, analysis.job_description)
    }


@router.post("/{analysis_id}/cover-letter", response_model=CoverLetterOut)
def create_cover_letter(
    analysis_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = db.scalar(
        select(ResumeAnalysis).where(
            ResumeAnalysis.id == analysis_id,
            ResumeAnalysis.user_id == current_user.id,
        )
    )
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return {
        "cover_letter": generate_cover_letter(
            analysis.resume_text, analysis.job_description
        )
    }


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
