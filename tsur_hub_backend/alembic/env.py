import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

from app.core.config import settings
from app.models.models import Base

# Объект конфигурации Alembic
config = context.config

# Настройка логирования
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Указываем метаданные наших моделей
target_metadata = Base.metadata

# Берем URL базы данных из настроек приложения
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)


def include_object(object, name, type_, reflected, compare_to):
    # Ограничиваем Alembic: работаем ТОЛЬКО с таблицами из схемы "hub".
    # Это защитит нас от удаления или изменения таблиц других модулей (CRM, KBA).
    if type_ == "table" and object.schema != "hub":
        return False
    return True


def run_migrations_offline() -> None:
    """Запуск миграций в offline-режиме."""
    print("MARK_OFFLINE")
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table_schema="hub",  # Таблица версий Alembic тоже будет в схеме hub
        include_schemas=True,  # Включаем поддержку схем
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Синхронная функция, которая вызывается внутри асинхронного контекста."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        version_table_schema="hub",  # Таблица версий Alembic тоже будет в схеме hub
        include_schemas=True,  # Включаем поддержку схем
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Настройка асинхронного подключения для миграций."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Запуск миграций в online-режиме."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

