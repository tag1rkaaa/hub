from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import profiles, auth  # <--- Добавили auth в импорт
# Или если у тебя auth лежит в другом месте, например: from app.api.endpoints import profiles, auth

app = FastAPI(title="ЦУР.Команда API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Разрешаем запросы с вашего фронтенда
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все методы (GET, POST и т.д.)
    allow_headers=["*"],  # Разрешаем все заголовки
)

# Подключаем роутер с префиксом /api/profiles
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])

# Подключаем роутер авторизации с префиксом /api/auth <--- ВОТ ЭТОЙ СТРОКИ НЕ ХВАТАЛО
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])


@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "API ЦУР.Команда работает и подключено к общей БД",
    }
