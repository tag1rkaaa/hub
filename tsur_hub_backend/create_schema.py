import asyncio
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy import pool


async def main():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS hub;"))
    print("Ура! Схема 'hub' успешно создана!")


if __name__ == "__main__":
    asyncio.run(main())
