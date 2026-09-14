import bcrypt
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import get_db
from app.models.models import User

router = APIRouter()

ALGORITHM = "RS256"

# 1. Глобальный кэш для ключа.
# Ключ прочитается с диска всего 1 раз за все время работы сервера.
_PRIVATE_KEY_CACHE = None


def get_private_key() -> str:
    """Читает приватный ключ из файла (или из кэша) для подписания токена"""
    global _PRIVATE_KEY_CACHE

    if _PRIVATE_KEY_CACHE is None:
        try:
            with open(settings.SECRET_KEY_PRIVATE_FILE, "r") as f:
                _PRIVATE_KEY_CACHE = f.read()
        except FileNotFoundError:
            # Безопасное падение, если ключ забыли перенести на сервер
            raise HTTPException(
                status_code=500, detail="Приватный ключ не найден на сервере"
            )

    return _PRIVATE_KEY_CACHE


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
):
    # 1. Ищем пользователя по email (форма передает его в поле username)
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    # 2. Безопасная проверка пароля через bcrypt
    password_valid = False

    if user is not None and user.hashed_password is not None:
        try:
            password_valid = bcrypt.checkpw(
                form_data.password.encode("utf-8"), user.hashed_password.encode("utf-8")
            )
        except (ValueError, TypeError):
            password_valid = False

    # ИСПРАВЛЕНИЕ: Логика проверки теперь правильная
    if user is None or not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Генерируем JWT токен с помощью RS256 и приватного ключа
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode = {"sub": str(user.id), "exp": expire}

    private_key = get_private_key()
    access_token = jwt.encode(to_encode, private_key, algorithm=ALGORITHM)

    return {"access_token": access_token, "token_type": "bearer"}
