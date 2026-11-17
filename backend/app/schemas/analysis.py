import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AnalysisCreate(BaseModel):
    job_title: str = Field(default="Resume analysis", min_length=1, max_length=120)
    custom_keywords: list[Annotated[str, Field(min_length=2, max_length=40)]] = Field(
        default_factory=list, max_length=30
    )
    resume_text: str = Field(min_length=100, max_length=30000)
    job_description: str = Field(min_length=50, max_length=20000)

    @field_validator("resume_text", "job_description")
    @classmethod
    def reject_blank_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("text must not be blank")
        return value


class AnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_title: str
    custom_keywords: list[str]
    ats_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    matched_keywords: list[str]
    missing_keywords: list[str]
    suggestions: list[str]
    suggestions_error: str | None
    created_at: datetime


class AnalysisDetail(AnalysisOut):
    resume_text: str
    job_description: str


class RewriteRequest(BaseModel):
    bullet: str = Field(min_length=3, max_length=2000)


class RewriteOut(BaseModel):
    suggestion: str


class CoverLetterOut(BaseModel):
    cover_letter: str
