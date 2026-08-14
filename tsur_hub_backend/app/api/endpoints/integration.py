from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.models import User, EmployeeProfile

router = APIRouter(tags=["Integration"])


# Схема того, что нам будет присылать База Знаний
class SyncUserRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str


# Секретный токен для защиты (чтобы никто, кроме Базы Знаний, не мог создавать аккаунты)
# В будущем его лучше вынести в файл .env
INTEGRATION_SECRET_TOKEN = "super-secret-kba-token-2026"


@router.post("/sync-user")
async def sync_user_from_kba(
    data: SyncUserRequest,
    x_integration_token: str = Header(
        ..., description="Секретный токен от Базы Знаний"
    ),
    db: AsyncSession = Depends(get_db),
):
    # 1. Проверяем, что запрос действительно пришел от нашей Базы Знаний
    if x_integration_token != INTEGRATION_SECRET_TOKEN:
        raise HTTPException(status_code=403, detail="Неверный токен интеграции")

    # 2. Проверяем, нет ли уже такого пользователя в Хабе
    result = await db.execute(select(User).where(User.email == data.email))
    existing_user = result.scalars().first()

    if existing_user:
        return {
            "status": "skipped",
            "message": "Пользователь с таким email уже существует в Хабе",
        }

    # 3. Создаем технический аккаунт (пароль человек восстановит или задаст при первом входе,
    # либо будет входить через единый SSO, если вы его настроите)
    new_user = User(
        email=data.email,
        hashed_password="synced_from_kba",  # Заглушка
        is_admin=False,
    )
    db.add(new_user)
    await db.flush()  # Получаем ID нового пользователя, но еще не сохраняем намертво

    # 4. Создаем связанный профиль сотрудника
    new_profile = EmployeeProfile(
        user_id=new_user.id,
        first_name=data.first_name,
        last_name=data.last_name,
        # Остальные поля (отдел, стаж, город) останутся пустыми (NULL),
        # сотрудник заполнит их сам, когда зайдет в профиль.
    )
    db.add(new_profile)
    await db.commit()

    return {
        "status": "success",
        "message": f"Профиль для {data.first_name} {data.last_name} успешно создан в Хабе",
        "user_id": new_user.id,
    }
