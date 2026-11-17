import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    job_title: Mapped[str] = mapped_column(String(120), nullable=False, default="Resume analysis")
    custom_keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    resume_text: Mapped[str] = mapped_column(Text, nullable=False)
    job_description: Mapped[str] = mapped_column(Text, nullable=False)
    ats_score: Mapped[int] = mapped_column(Integer, nullable=False)
    matched_skills: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    missing_skills: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    matched_keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    missing_keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    suggestions: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    suggestions_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


Index("idx_resume_analyses_user_created", ResumeAnalysis.user_id, ResumeAnalysis.created_at)
