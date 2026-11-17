import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AnalysisCreate(BaseModel):
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
    ats_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    matched_keywords: list[str]
    missing_keywords: list[str]
    suggestions: list[str]
    created_at: datetime
