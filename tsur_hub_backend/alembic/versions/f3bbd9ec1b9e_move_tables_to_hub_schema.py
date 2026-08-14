"""Move tables to hub schema

Revision ID: f3bbd9ec1b9e
Revises: d375cbfd4deb
Create Date: 2026-08-14 15:55:09.881092

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3bbd9ec1b9e'
down_revision: Union[str, Sequence[str], None] = 'd375cbfd4deb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No-op: схема hub и все таблицы Хаба создаются (с переносом данных) в d375cbfd4deb."""
    pass


def downgrade() -> None:
    """No-op: откат выполняет d375cbfd4deb."""
    pass
