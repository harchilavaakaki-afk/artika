"""project yandex_token_ref

Revision ID: a1b2c3d4e5f6
Revises: 5b2edab7249d
Create Date: 2026-04-18 07:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "5b2edab7249d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column(
            "yandex_token_ref",
            sa.String(length=32),
            nullable=False,
            server_default="default",
        ),
    )
    # Падел — artikavidnoe токен
    op.execute(
        "UPDATE projects SET yandex_token_ref = 'padel' "
        "WHERE domain = 'padelvidnoe.ru' OR name ILIKE '%падел%'"
    )


def downgrade() -> None:
    op.drop_column("projects", "yandex_token_ref")
