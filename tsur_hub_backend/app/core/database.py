from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base  # <-- ДОБАВЛЕН ИМПОРТ

from app.core.config import settings

# --- ДОБАВЛЕНО: Создаем базовый класс для всех моделей ---
Base = declarative_base()

# Используем URL из наших настроек
engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with async_session_maker() as session:
        yield session
