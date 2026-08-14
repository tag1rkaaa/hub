from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import bcrypt
from jose import jwt

from app.core.database import get_db
from app.core.config import settings
from app.models.models import User

router = APIRouter()

ALGORITHM = "RS256"


def get_private_key() -> str:
    """Читает приватный ключ из файла для подписания токена"""
    with open(settings.SECRET_KEY_PRIVATE_FILE, "r") as f:
        return f.read()


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
):
    # 1. Ищем пользователя по email (форма передает его в поле username)
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    # 2. Безопасная проверка пароля через bcrypt
    password_valid = False
    if user and user.password_hash:
        try:
            password_valid = bcrypt.checkpw(
                form_data.password.encode("utf-8"), user.password_hash.encode("utf-8")
            )
        except Exception:
            password_valid = False

    if not user or not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Генерируем JWT токен с помощью RS256 и приватного ключа
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode = {"sub": str(user.id), "exp": expire}

    private_key = get_private_key()
    access_token = jwt.encode(to_encode, private_key, algorithm=ALGORITHM)

    return {"access_token": access_token, "token_type": "bearer"}
