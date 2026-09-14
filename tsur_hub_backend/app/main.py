import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.endpoints import auth, integration, profiles

logger = logging.getLogger(__name__)


# --- 1. Lifespan для создания папок (с логированием) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Инициализация файловой системы Хаба...")
    os.makedirs("uploads/avatars", exist_ok=True)
    os.makedirs("uploads/covers", exist_ok=True)

    yield  # Здесь приложение работает

    logger.info("Сервер Хаба останавливается")


app = FastAPI(title="ЦУР.Команда API", lifespan=lifespan)

# Раздача статических файлов (картинок)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# --- 2. Динамический CORS (читаем из .env) ---
allowed_origins_str = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)
allowed_origins = [
    origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(integration.router, prefix="/api/integration", tags=["Integration"])


# --- 3. Глобальный перехватчик ошибок ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Ошибка в Хабе при запросе {request.method} {request.url.path}", exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Внутренняя ошибка Хаба. Команда уже разбирается.",
            "detail": str(exc),
        },
    )


@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "API ЦУР.Команда работает и подключено к общей БД",
    }
