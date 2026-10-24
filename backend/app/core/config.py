"""Application settings, loaded from environment variables (or a local .env file)."""
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "ResumeFit API"
    environment: str = "development"

    # Database (PostgreSQL via psycopg 3)
    database_url: str = "postgresql+psycopg://resumefit:resumefit@localhost:5432/resumefit"

    # JWT / sessions. The secret has no default on purpose: the app refuses to start without it.
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60          # NFR-10
    refresh_token_days: int = 7             # NFR-10

    # Passwords and lockout
    bcrypt_rounds: int = 12                 # NFR-8
    max_failed_logins: int = 5              # NFR-13
    lockout_minutes: int = 15               # NFR-13

    # Cookies / CORS
    cookie_secure: bool = True              # must stay True outside local development
    cors_origins: list[str] = ["http://localhost:5173"]

    @field_validator("jwt_secret")
    @classmethod
    def secret_must_be_strong(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
