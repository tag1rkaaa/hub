import os
import pytest
from dotenv import load_dotenv

# Принудительно загружаем .env
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

from fastapi.testclient import TestClient
from app.main import app


# Создаем "фикстуру" — она запустит приложение ОДИН раз для всех тестов
@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_get_events_list(client):
    """Проверяем, что список событий отдается успешно"""
    response = client.get("/api/profiles/events/list")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_login_wrong_credentials(client):
    """Проверяем систему безопасности (ошибка 401)"""
    response = client.post(
        "/api/auth/login",
        data={"username": "fake@tsur.ru", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Неверный email или пароль"


def test_unauthorized_access_to_my_profile(client):
    """Проверяем защиту профиля без токена"""
    response = client.get("/api/profiles/me")
    assert response.status_code == 401
