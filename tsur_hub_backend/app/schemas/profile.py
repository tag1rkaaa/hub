from datetime import date

from pydantic import BaseModel, ConfigDict


# --- Схемы для ссылок (EmployeeLink) ---
class LinkBase(BaseModel):
    title: str
    url: str
    icon: str | None = None


class LinkCreate(LinkBase):
    pass


class LinkResponse(LinkBase):
    id: int
    profile_id: int

    model_config = ConfigDict(from_attributes=True)


# --- Схемы для достижений (Achievement) ---
class AchievementBase(BaseModel):
    title: str
    year: int | None = None
    color_theme: str | None = None


class AchievementResponse(AchievementBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# --- Схемы для событий (Event) ---
class EventBase(BaseModel):
    title: str
    event_date: date
    event_time: str | None = None
    format: str | None = None


class EventResponse(EventBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

    # --- СХЕМЫ ДЛЯ СОЗДАНИЯ (АДМИНКА) ---


class AchievementCreate(BaseModel):
    title: str
    year: int | None = None
    color_theme: str | None = "blue"  # По умолчанию бейдж будет синим


class EventCreate(BaseModel):
    title: str
    event_date: date
    event_time: str | None = None
    format: str | None = None
    end_date: str | None = None


# --- Схемы для профилей (EmployeeProfile) ---
class ProfileBase(BaseModel):
    first_name: str
    last_name: str
    middle_name: str | None = None
    position: str | None = None
    status: str | None = None
    avatar_url: str | None = None
    cover_url: str | None = None
    department: str | None = None
    hire_date: date | None = None
    birth_date: date | None = None
    employment_type: str | None = None
    city: str | None = None

    # --- ДОБАВЛЕНЫ НОВЫЕ ПОЛЯ ---
    desk: str | None = None
    organization: str | None = None


class ProfileCreate(ProfileBase):
    # PIN-код при создании передается отдельно
    access_pin: str | None = None


class ProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    middle_name: str | None = None
    position: str | None = None
    status: str | None = None
    avatar_url: str | None = None
    cover_url: str | None = None
    department: str | None = None
    hire_date: date | None = None
    birth_date: date | None = None
    employment_type: str | None = None
    city: str | None = None
    access_pin: str | None = None

    # --- ДОБАВЛЕНЫ НОВЫЕ ПОЛЯ ---
    desk: str | None = None
    organization: str | None = None


class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    manager_id: int | None = None
    links: list[LinkResponse] = []
    achievements: list[AchievementResponse] = []
    events: list[EventResponse] = []

    # ДОБАВЛЕНО: Флаг администратора для фронтенда
    is_admin: bool = False

    model_config = ConfigDict(from_attributes=True)


class ProfileListResponse(ProfileBase):
    id: int
    user_id: int

    # ДОБАВЛЕНО: Флаг администратора
    is_admin: bool = False

    model_config = ConfigDict(from_attributes=True)
