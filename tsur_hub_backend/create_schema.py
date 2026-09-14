import asyncio
from sqlalchemy import text
from app.core.database import engine


async def main():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS hub;"))
    print("Ура! Схема 'hub' успешно создана!")


if __name__ == "__main__":
    asyncio.run(main())
