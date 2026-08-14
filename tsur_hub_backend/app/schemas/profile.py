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


# --- Схемы для профилей (EmployeeProfile) ---
class ProfileBase(BaseModel):
    first_name: str
    last_name: str
    middle_name: str | None = None
    position: str | None = None
    status: str | None = None
    avatar_url: str | None = None
    cover_url: str | None = None


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
    access_pin: str | None = None


class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    links: list[LinkResponse] = []

    # ДОБАВЛЕНО: Флаг администратора для фронтенда
    is_admin: bool = False

    model_config = ConfigDict(from_attributes=True)


class ProfileListResponse(ProfileBase):
    id: int
    user_id: int

    # ДОБАВЛЕНО: Флаг администратора
    is_admin: bool = False

    model_config = ConfigDict(from_attributes=True)
