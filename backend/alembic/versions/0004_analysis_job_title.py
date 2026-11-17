"""Add a job title to each resume analysis."""
from alembic import op
import sqlalchemy as sa


revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "resume_analyses",
        sa.Column("job_title", sa.String(length=120), nullable=False, server_default="Resume analysis"),
    )
    op.alter_column("resume_analyses", "job_title", server_default=None)
    op.add_column(
        "resume_analyses",
        sa.Column(
            "custom_keywords",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )
    op.alter_column("resume_analyses", "custom_keywords", server_default=None)


def downgrade() -> None:
    op.drop_column("resume_analyses", "custom_keywords")
    op.drop_column("resume_analyses", "job_title")
