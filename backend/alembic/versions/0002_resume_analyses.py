"""create resume analyses

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-16
"""
import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "resume_analyses",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("resume_text", sa.Text(), nullable=False),
        sa.Column("job_description", sa.Text(), nullable=False),
        sa.Column("ats_score", sa.Integer(), nullable=False),
        sa.Column("matched_skills", sa.JSON(), nullable=False),
        sa.Column("missing_skills", sa.JSON(), nullable=False),
        sa.Column("matched_keywords", sa.JSON(), nullable=False),
        sa.Column("missing_keywords", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(
        "idx_resume_analyses_user_created",
        "resume_analyses",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("idx_resume_analyses_user_created", table_name="resume_analyses")
    op.drop_table("resume_analyses")
