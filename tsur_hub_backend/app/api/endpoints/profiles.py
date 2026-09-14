import bcrypt
import shutil
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    Header,
    HTTPException,
    Query,
    UploadFile,
)
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import String, and_, cast, extract, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.models import (
    Achievement,
    EmployeeLink,
    EmployeeProfile,
    Event,
    User,
)
from app.schemas.profile import (
    AchievementCreate,
    AchievementResponse,
    EventCreate,
    EventResponse,
    ProfileCreate,
    ProfileListResponse,
    ProfileResponse,
    ProfileUpdate,
)

router = APIRouter(tags=["Profiles"])

PROFILE_LOAD_OPTIONS = (
    selectinload(EmployeeProfile.user),
    selectinload(EmployeeProfile.links),
    selectinload(EmployeeProfile.achievements),
    selectinload(EmployeeProfile.events),
)


@router.get("/achievements/list", response_model=list[AchievementResponse])
async def get_all_achievements(
    db: AsyncSession = Depends(get_db),
):
    """Список всех достижений (для администратора и каталога)."""
    result = await db.execute(select(Achievement).order_by(Achievement.year.desc()))
    return result.scalars().all()


@router.get("/events/list", response_model=list[EventResponse])
async def get_all_events(
    db: AsyncSession = Depends(get_db),
):
    """Список всех событий."""
    result = await db.execute(select(Event).order_by(Event.event_date.asc()))
    return result.scalars().all()


@router.get("/widget/away", response_model=list[ProfileResponse], tags=["Widgets"])
async def get_away_employees(db: AsyncSession = Depends(get_db)):
    """Возвращает сотрудников, у которых прямо СЕГОДНЯ активно какое-либо событие."""
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    has_active_event = EmployeeProfile.events.any(
        or_(
            and_(
                cast(Event.event_date, String) <= today_str, Event.end_date >= today_str
            ),
            and_(
                or_(Event.end_date.is_(None), Event.end_date == ""),
                cast(Event.event_date, String) == today_str,
            ),
        )
    )

    result = await db.execute(
        select(EmployeeProfile).options(*PROFILE_LOAD_OPTIONS).where(has_active_event)
    )

    return result.scalars().all()


@router.get("/widget/birthdays", response_model=list[ProfileResponse], tags=["Widgets"])
async def get_upcoming_birthdays(db: AsyncSession = Depends(get_db)):
    """Возвращает сотрудников, у которых день рождения был недавно или будет в ближайшие 14 дней."""
    today = datetime.now(timezone.utc).date()

    this_month = today.month
    next_month = (today.month % 12) + 1

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(
            EmployeeProfile.birth_date.isnot(None),
            extract("month", EmployeeProfile.birth_date).in_([this_month, next_month]),
        )
    )
    profiles = result.scalars().all()

    upcoming = []
    for p in profiles:
        try:
            bday_this_year = date(today.year, p.birth_date.month, p.birth_date.day)
        except ValueError:
            bday_this_year = date(today.year, 2, 28)

        if (bday_this_year - today).days < -3:
            try:
                bday_next = date(today.year + 1, p.birth_date.month, p.birth_date.day)
            except ValueError:
                bday_next = date(today.year + 1, 2, 28)
            days_until = (bday_next - today).days
        else:
            days_until = (bday_this_year - today).days

        if -3 <= days_until <= 14:
            upcoming.append(p)

    return upcoming


@router.get("/widget/new-hires", response_model=list[ProfileResponse], tags=["Widgets"])
async def get_new_hires(db: AsyncSession = Depends(get_db)):
    """Возвращает сотрудников, которые присоединились за последние 30 дней."""
    thirty_days_ago = datetime.now(timezone.utc).date() - timedelta(days=30)

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.hire_date >= thirty_days_ago)
        .order_by(EmployeeProfile.hire_date.desc())
    )
    return result.scalars().all()


@router.get("/org-tree/all", response_model=list[ProfileResponse], tags=["Org Tree"])
async def get_all_for_org_tree(db: AsyncSession = Depends(get_db)):
    """Отдает список всех сотрудников для построения дерева на фронтенде."""
    result = await db.execute(select(EmployeeProfile).options(*PROFILE_LOAD_OPTIONS))
    return result.scalars().all()


class LinkCreate(BaseModel):
    title: str
    url: str
    icon: str | None = None


class PinSet(BaseModel):
    pin: str


class PinUnlock(BaseModel):
    pin: str


async def get_profile_or_create(db: AsyncSession, user: User) -> EmployeeProfile:
    """Находит профиль пользователя, создает с дефолтными ФИО при отсутствии."""
    result = await db.execute(
        select(EmployeeProfile).where(EmployeeProfile.user_id == user.id)
    )
    profile = result.scalars().first()

    if not profile:
        profile = EmployeeProfile(
            user_id=user.id, first_name="Имя", last_name="Фамилия"
        )
        db.add(profile)
        await db.commit()

    return profile


@router.post("/", response_model=ProfileResponse)
async def create_employee_profile(
    profile_data: ProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(
            status_code=403, detail="Только администраторы могут добавлять сотрудников"
        )

    temp_email = f"new_{uuid.uuid4().hex[:6]}@tsur.local"

    new_user = User(
        email=temp_email,
        hashed_password="not_set",
        is_admin=False,
    )
    db.add(new_user)
    await db.flush()

    new_profile = EmployeeProfile(
        user_id=new_user.id,
        first_name=profile_data.first_name,
        last_name=profile_data.last_name,
        position=profile_data.position,
        status=profile_data.status,
    )
    db.add(new_profile)
    await db.commit()

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == new_profile.id)
    )
    return result.scalars().first()


@router.get("/", response_model=list[ProfileListResponse])
async def get_profiles(
    search: str | None = Query(None, description="Общий поиск..."),
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(EmployeeProfile).options(selectinload(EmployeeProfile.user)).join(User)
    )

    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                EmployeeProfile.first_name.ilike(search_filter),
                EmployeeProfile.last_name.ilike(search_filter),
                EmployeeProfile.position.ilike(search_filter),
            )
        )

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    profiles = result.scalars().all()

    return profiles


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    profile = await get_profile_or_create(db, current_user)

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == profile.id)
    )
    return result.scalars().first()


@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EmployeeProfile).where(EmployeeProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if not profile:
        profile = EmployeeProfile(
            user_id=current_user.id, first_name="Имя", last_name="Фамилия"
        )
        db.add(profile)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    await db.commit()

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == profile.id)
    )
    return result.scalars().first()


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile_by_id(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == profile_id)
    )
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")

    return profile


@router.delete("/{profile_id}", tags=["Admin"])
async def delete_profile(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(
            status_code=403, detail="Только администраторы могут удалять профили"
        )

    result = await db.execute(
        select(EmployeeProfile).where(EmployeeProfile.id == profile_id)
    )
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")

    user_id_to_delete = profile.user_id

    await db.delete(profile)

    user_result = await db.execute(select(User).where(User.id == user_id_to_delete))
    user_to_delete = user_result.scalars().first()
    if user_to_delete:
        await db.delete(user_to_delete)

    await db.commit()

    return {"status": "success", "message": "Профиль и аккаунт успешно удалены"}


@router.get("/me/links")
async def get_my_links(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    prof_res = await db.execute(
        select(EmployeeProfile).where(EmployeeProfile.user_id == current_user.id)
    )
    profile = prof_res.scalars().first()
    if not profile:
        return []

    result = await db.execute(
        select(EmployeeLink).where(EmployeeLink.profile_id == profile.id)
    )
    return result.scalars().all()


@router.post("/me/links")
async def add_link(
    link_data: LinkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await get_profile_or_create(db, current_user)

    new_link = EmployeeLink(
        profile_id=profile.id,
        title=link_data.title,
        url=link_data.url,
        icon=link_data.icon,
    )
    db.add(new_link)
    await db.commit()
    await db.refresh(new_link)
    return new_link


@router.delete("/me/links/{link_id}")
async def delete_link(
    link_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prof_res = await db.execute(
        select(EmployeeProfile).where(EmployeeProfile.user_id == current_user.id)
    )
    profile = prof_res.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")

    result = await db.execute(
        select(EmployeeLink).where(
            EmployeeLink.id == link_id, EmployeeLink.profile_id == profile.id
        )
    )
    link = result.scalars().first()

    if not link:
        raise HTTPException(status_code=404, detail="Ссылка не найдена")

    await db.delete(link)
    await db.commit()
    return {"status": "success", "message": "Ссылка удалена"}


@router.post("/me/pin")
async def set_my_pin(
    data: PinSet,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await get_profile_or_create(db, current_user)

    salt = bcrypt.gensalt()
    hashed_pin = bcrypt.hashpw(data.pin.encode("utf-8"), salt).decode("utf-8")

    profile.access_pin_hash = hashed_pin  # type: ignore
    await db.commit()

    return {"status": "success", "message": "PIN-код успешно установлен"}


@router.post("/{profile_id}/unlock")
async def unlock_profile(
    profile_id: int,
    data: PinUnlock,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmployeeProfile).where(EmployeeProfile.id == profile_id)
    )
    profile = result.scalars().first()

    if not profile or profile.access_pin_hash is None:
        raise HTTPException(
            status_code=400, detail="PIN-код не установлен для этого профиля"
        )

    if not bcrypt.checkpw(
        data.pin.encode("utf-8"), profile.access_pin_hash.encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Неверный PIN-код")

    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    to_encode = {"unlocked_profile_id": profile.id, "exp": expire}

    try:
        with open(settings.SECRET_KEY_PRIVATE_FILE, "r") as f:
            private_key = f.read()
    except FileNotFoundError:
        raise HTTPException(
            status_code=500, detail="Приватный ключ не найден на сервере"
        )

    unlock_token = jwt.encode(to_encode, private_key, algorithm="RS256")

    return {"unlock_token": unlock_token}


@router.get("/{profile_id}/links")
async def get_profile_links(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_unlock_token: str | None = Header(None, alias="X-Unlock-Token"),
):
    result = await db.execute(
        select(EmployeeProfile).where(
            EmployeeProfile.id == profile_id, EmployeeProfile.user_id == current_user.id
        )
    )
    if result.scalars().first():
        links_res = await db.execute(
            select(EmployeeLink).where(EmployeeLink.profile_id == profile_id)
        )
        return links_res.scalars().all()

    if x_unlock_token:
        try:
            with open(settings.SECRET_KEY_PRIVATE_FILE, "r") as f:
                pub_key = f.read()
            payload = jwt.decode(x_unlock_token, pub_key, algorithms=["RS256"])

            if payload.get("unlocked_profile_id") == profile_id:
                links_res = await db.execute(
                    select(EmployeeLink).where(EmployeeLink.profile_id == profile_id)
                )
                return links_res.scalars().all()
        except JWTError:
            pass

    raise HTTPException(
        status_code=403, detail="Доступ к ссылкам ограничен. Введите PIN."
    )


# --- АДМИН-ПАНЕЛЬ: СТАТИЧЕСКИЕ / DIRECT МАРШРУТЫ (ДОЛЖНЫ БЫТЬ ВЫШЕ ДИНАМИЧЕСКИХ) ---


class DirectAchievementRequest(BaseModel):
    title: str
    year: Any = None
    color_theme: Any = "yellow"


@router.post("/{profile_id}/achievements/direct", tags=["Admin"])
async def create_direct_achievement(
    profile_id: int,
    data: DirectAchievementRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Только администраторы")

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == profile_id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")

    theme = "yellow"
    if data.color_theme:
        val = str(data.color_theme).lower()
        if "желтый" in val or "золото" in val:
            theme = "yellow"
        elif "син" in val:
            theme = "blue"
        elif "зелен" in val:
            theme = "emerald"
        elif "красн" in val:
            theme = "red"
        else:
            theme = val

    try:
        achievement_year = int(data.year)
    except (ValueError, TypeError):
        achievement_year = 2026

    new_achievement = Achievement(
        title=data.title,
        year=achievement_year,
        color_theme=theme,
    )
    profile.achievements.append(new_achievement)
    db.add(new_achievement)
    await db.commit()

    return {"status": "success", "message": "Достижение успешно добавлено!"}


@router.post("/{profile_id}/events/direct", tags=["Admin"])
async def create_direct_event(
    profile_id: int,
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Только администраторы")

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == profile_id)
    )
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")

    new_event = Event(
        title=data.title,
        event_date=data.event_date,
        event_time=data.event_time,
        format=data.format,
    )
    profile.events.append(new_event)
    db.add(new_event)
    await db.commit()

    return {"status": "success", "message": "Событие успешно добавлено!"}


# --- Общие достижения (Achievements) ---


@router.post("/achievements", response_model=AchievementResponse)
async def create_achievement(
    data: AchievementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Только администраторы")

    achievement = Achievement(
        title=data.title, year=data.year, color_theme=data.color_theme
    )
    db.add(achievement)
    await db.commit()
    await db.refresh(achievement)
    return achievement


@router.delete("/achievements/{achievement_id}")
async def delete_achievement(
    achievement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Только администраторы")

    result = await db.execute(
        select(Achievement).where(Achievement.id == achievement_id)
    )
    achievement = result.scalars().first()
    if not achievement:
        raise HTTPException(status_code=404, detail="Достижение не найдено")

    await db.delete(achievement)
    await db.commit()
    return {"status": "success", "message": "Достижение удалено"}


@router.post(
    "/{profile_id}/achievements/{achievement_id}", response_model=ProfileResponse
)
async def add_achievement_to_profile(
    profile_id: int,
    achievement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Только администраторы")

    profile = await db.get(EmployeeProfile, profile_id)
    achievement = await db.get(Achievement, achievement_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    if not achievement:
        raise HTTPException(status_code=404, detail="Достижение не найдено")

    if achievement not in profile.achievements:
        profile.achievements.append(achievement)
        await db.commit()

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == profile_id)
    )
    return result.scalars().first()


@router.delete(
    "/{profile_id}/achievements/{achievement_id}", response_model=ProfileResponse
)
async def remove_achievement_from_profile(
    profile_id: int,
    achievement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Только администраторы")

    profile = await db.get(EmployeeProfile, profile_id)
    achievement = await db.get(Achievement, achievement_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    if not achievement:
        raise HTTPException(status_code=404, detail="Достижение не найдено")

    if achievement in profile.achievements:
        profile.achievements.remove(achievement)
        await db.commit()

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == profile_id)
    )
    return result.scalars().first()


# --- События (Events) ---


@router.post("/me/events", response_model=ProfileResponse, tags=["My Profile"])
async def add_my_event(
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Позволяет любому сотруднику добавить событие в свой профиль."""
    base_profile = await get_profile_or_create(db, current_user)

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == base_profile.id)
    )
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")

    new_event = Event(
        title=data.title,
        event_date=data.event_date,
        end_date=data.end_date,
        event_time=data.event_time,
        format=data.format,
    )

    profile.events.append(new_event)
    db.add(new_event)
    await db.commit()

    return profile


@router.delete(
    "/me/events/{event_id}", response_model=ProfileResponse, tags=["My Profile"]
)
async def delete_my_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Позволяет сотруднику удалить событие из своего профиля."""
    base_profile = await get_profile_or_create(db, current_user)
    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == base_profile.id)
    )
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")

    event_to_delete = None
    for evt in profile.events:
        if evt.id == event_id:
            event_to_delete = evt
            break

    if not event_to_delete:
        raise HTTPException(
            status_code=404, detail="Событие не найдено или оно вам не принадлежит"
        )

    profile.events.remove(event_to_delete)
    await db.delete(event_to_delete)
    await db.commit()

    return profile


@router.post("/events", response_model=EventResponse)
async def create_event(
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Только администраторы")

    event = Event(
        title=data.title,
        event_date=data.event_date,
        event_time=data.event_time,
        format=data.format,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/events/{event_id}")
async def delete_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Только администраторы")

    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")

    await db.delete(event)
    await db.commit()
    return {"status": "success", "message": "Событие удалено"}


@router.post("/{profile_id}/events/{event_id}", response_model=ProfileResponse)
async def add_event_to_profile(
    profile_id: int,
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Только администраторы")

    profile = await db.get(EmployeeProfile, profile_id)
    event = await db.get(Event, event_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")

    if event not in profile.events:
        profile.events.append(event)
        await db.commit()

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == profile_id)
    )
    return result.scalars().first()


@router.delete("/{profile_id}/events/{event_id}", response_model=ProfileResponse)
async def remove_event_from_profile(
    profile_id: int,
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Только администраторы")

    profile = await db.get(EmployeeProfile, profile_id)
    event = await db.get(Event, event_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")

    if event in profile.events:
        profile.events.remove(event)
        await db.commit()

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == profile_id)
    )
    return result.scalars().first()


# --- ЗАГРУЗКА ФОТОГРАФИЙ (АВАТАР И ОБЛОЖКА) ---

UPLOAD_DIR = Path("uploads")


MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 Мегабайт
ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]


@router.post("/me/avatar", response_model=ProfileResponse, tags=["Media"])
async def upload_my_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400, detail="Формат не поддерживается. Только JPG, PNG, WEBP."
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Размер файла превышает 5 МБ.")

    profile = await get_profile_or_create(db, current_user)

    safe_filename = file.filename or ""
    ext = safe_filename.split(".")[-1] if "." in safe_filename else "jpg"
    filename = f"avatar_{profile.id}_{uuid.uuid4().hex[:6]}.{ext}"

    avatar_dir = UPLOAD_DIR / "avatars"
    avatar_dir.mkdir(parents=True, exist_ok=True)

    with open(avatar_dir / filename, "wb") as buffer:
        buffer.write(content)

    profile.avatar_url = f"/uploads/avatars/{filename}"  # type: ignore
    await db.commit()

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == profile.id)
    )
    return result.scalars().first()


@router.post("/me/cover", response_model=ProfileResponse, tags=["Media"])
async def upload_my_cover(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400, detail="Формат не поддерживается. Только JPG, PNG, WEBP."
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Размер файла превышает 5 МБ.")

    profile = await get_profile_or_create(db, current_user)

    safe_filename = file.filename or ""
    ext = safe_filename.split(".")[-1] if "." in safe_filename else "jpg"
    filename = f"cover_{profile.id}_{uuid.uuid4().hex[:6]}.{ext}"

    cover_dir = UPLOAD_DIR / "covers"
    cover_dir.mkdir(parents=True, exist_ok=True)

    filepath = cover_dir / filename

    with open(filepath, "wb") as buffer:
        buffer.write(content)

    profile.cover_url = f"/uploads/covers/{filename}"  # type: ignore
    await db.commit()

    result = await db.execute(
        select(EmployeeProfile)
        .options(*PROFILE_LOAD_OPTIONS)
        .where(EmployeeProfile.id == profile.id)
    )
    return result.scalars().first()
