"""add Gemini suggestions to resume analyses

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-17
"""
import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "resume_analyses",
        sa.Column("suggestions", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
    )
    op.alter_column("resume_analyses", "suggestions", server_default=None)


def downgrade() -> None:
    op.drop_column("resume_analyses", "suggestions")
