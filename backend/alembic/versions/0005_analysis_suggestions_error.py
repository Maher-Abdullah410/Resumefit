"""Persist Gemini suggestion failures without blocking ATS analysis."""
from alembic import op
import sqlalchemy as sa


revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "resume_analyses",
        sa.Column("suggestions_error", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("resume_analyses", "suggestions_error")
