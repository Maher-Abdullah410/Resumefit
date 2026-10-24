import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str
    consent: bool

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("full_name must not be blank")
        return v

    @field_validator("password")
    @classmethod
    def password_policy(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        if len(v.encode("utf-8")) > 72:  # bcrypt only uses the first 72 bytes
            raise ValueError("password must be at most 72 bytes")
        if not (re.search(r"[A-Za-z]", v) and re.search(r"\d", v)):
            raise ValueError("password must contain at least one letter and one digit")
        return v

    @field_validator("consent")
    @classmethod
    def consent_required(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError("you must accept the privacy policy")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: str
    full_name: str
    created_at: datetime


class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    full_name: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserBrief
