"""Init hub schema and extend employee profile

Revision ID: d375cbfd4deb
Revises: a07d350f5678
Create Date: 2026-08-14 15:47:37.952844

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd375cbfd4deb'
down_revision: Union[str, Sequence[str], None] = 'a07d350f5678'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Создаем схему hub и все таблицы Хаба в ней, перенося данные из public."""
    # 1. Создаем схему
    op.execute("CREATE SCHEMA IF NOT EXISTS hub")

    # 2. Собственная таблица пользователей Хаба (НЕ трогаем public.users — это База Знаний)
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_admin", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        schema="hub",
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False, schema="hub")

    # 3. Расширенные профили сотрудников
    op.create_table(
        "employee_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("first_name", sa.String(), nullable=False),
        sa.Column("last_name", sa.String(), nullable=False),
        sa.Column("middle_name", sa.String(), nullable=True),
        sa.Column("position", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("cover_url", sa.String(), nullable=True),
        sa.Column("access_pin_hash", sa.String(), nullable=True),
        sa.Column("manager_id", sa.Integer(), nullable=True),
        sa.Column("department", sa.String(), nullable=True),
        sa.Column("hire_date", sa.Date(), nullable=True),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("employment_type", sa.String(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["hub.users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["manager_id"], ["hub.employee_profiles.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        schema="hub",
    )
    op.create_index(
        op.f("ix_employee_profiles_id"), "employee_profiles", ["id"], unique=False, schema="hub"
    )

    # 4. Ссылки профилей
    op.create_table(
        "employee_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("profile_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("icon", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(
            ["profile_id"], ["hub.employee_profiles.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        schema="hub",
    )
    op.create_index(
        op.f("ix_employee_links_id"), "employee_links", ["id"], unique=False, schema="hub"
    )

    # 5. Бейджи и события
    op.create_table(
        "achievements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("color_theme", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        schema="hub",
    )
    op.create_index(
        op.f("ix_achievements_id"), "achievements", ["id"], unique=False, schema="hub"
    )

    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("event_time", sa.String(), nullable=True),
        sa.Column("format", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        schema="hub",
    )
    op.create_index(op.f("ix_events_id"), "events", ["id"], unique=False, schema="hub")

    # 6. Таблицы-связки
    op.create_table(
        "profile_achievements",
        sa.Column("profile_id", sa.Integer(), nullable=False),
        sa.Column("achievement_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["profile_id"], ["hub.employee_profiles.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["achievement_id"], ["hub.achievements.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("profile_id", "achievement_id"),
        schema="hub",
    )
    op.create_table(
        "profile_events",
        sa.Column("profile_id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["profile_id"], ["hub.employee_profiles.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["event_id"], ["hub.events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("profile_id", "event_id"),
        schema="hub",
    )

    # 7. Переносим пользователей из общей базы (База Знаний) в собственную таблицу Хаба.
    #    Берем email и bcrypt-хэш пароля "как есть", роль администратора сохраняем.
    op.execute(
        """
        INSERT INTO hub.users (id, email, hashed_password, is_admin)
        SELECT id, email, password_hash, (role = 'admin')
        FROM public.users
        """
    )
    op.execute(
        "SELECT setval(pg_get_serial_sequence('hub.users', 'id'), "
        "(SELECT GREATEST(COALESCE(MAX(id), 1), 1) FROM hub.users))"
    )

    # 8. Переносим существующие профили и ссылки
    op.execute(
        """
        INSERT INTO hub.employee_profiles (
            id, user_id, first_name, last_name, middle_name, position, status,
            avatar_url, cover_url, access_pin_hash
        )
        SELECT id, user_id, first_name, last_name, middle_name, position, status,
               avatar_url, cover_url, access_pin_hash
        FROM public.employee_profiles
        """
    )
    op.execute(
        "SELECT setval(pg_get_serial_sequence('hub.employee_profiles', 'id'), "
        "(SELECT GREATEST(COALESCE(MAX(id), 1), 1) FROM hub.employee_profiles))"
    )

    op.execute(
        """
        INSERT INTO hub.employee_links (id, profile_id, title, url, icon)
        SELECT id, profile_id, title, url, icon
        FROM public.employee_links
        """
    )
    op.execute(
        "SELECT setval(pg_get_serial_sequence('hub.employee_links', 'id'), "
        "(SELECT GREATEST(COALESCE(MAX(id), 1), 1) FROM hub.employee_links))"
    )


def downgrade() -> None:
    """Удаляем все таблицы Хаба (данные Базы Знаний не трогаем)."""
    op.drop_table("profile_events", schema="hub")
    op.drop_table("profile_achievements", schema="hub")
    op.drop_table("events", schema="hub")
    op.drop_table("achievements", schema="hub")
    op.drop_table("employee_links", schema="hub")
    op.drop_table("employee_profiles", schema="hub")
    op.drop_table("users", schema="hub")