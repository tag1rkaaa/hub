from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ДОБАВИЛИ integration В ИМПОРТ
from app.api.endpoints import profiles, auth, integration

app = FastAPI(title="ЦУР.Команда API")

# Оставили один чистый блок CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "*",
    ],  # Разрешаем фронтенд и любые другие источники (для разработки)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутер с префиксом /api/profiles
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])

# Подключаем роутер авторизации с префиксом /api/auth
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])

# ДОБАВЛЕНО: Подключаем роутер интеграции с префиксом /api/integration
app.include_router(integration.router, prefix="/api/integration", tags=["Integration"])


@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "API ЦУР.Команда работает и подключено к общей БД",
    }
