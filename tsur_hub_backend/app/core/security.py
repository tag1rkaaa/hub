from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.core.config import settings

# Поскольку у нас ключи .pem, используется алгоритм асимметричного шифрования RS256
ALGORITHM = "RS256"


def get_public_key() -> str:
    """Читает публичный ключ из файла"""
    with open(settings.SECRET_KEY_PUBLIC_FILE, "r") as f:
        return f.read()


def verify_token(token: str) -> dict:
    """Расшифровывает токен и возвращает его содержимое (payload)"""
    try:
        public_key = get_public_key()
        payload = jwt.decode(token, public_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не удалось проверить учетные данные токена",
            headers={"WWW-Authenticate": "Bearer"},
        )
