import bcrypt
import uuid
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from jose import jwt
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# Инструмент для жадной загрузки связей в асинхронном режиме
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.models import User, EmployeeProfile, EmployeeLink
from app.schemas.profile import ProfileResponse, ProfileListResponse, ProfileCreate

router = APIRouter(tags=["Profiles"])


class ProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    position: str | None = None
    status: str | None = None
    avatar_url: str | None = None


class LinkCreate(BaseModel):
    title: str
    url: str
    icon: str | None = None


class PinSet(BaseModel):
    pin: str


class PinUnlock(BaseModel):
    pin: str


@router.post("/", response_model=ProfileResponse)
async def create_employee_profile(
    profile_data: ProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Защита маршрута: только администраторы могут добавлять сотрудников
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(
            status_code=403, detail="Только администраторы могут добавлять сотрудников"
        )

    # 2. Создаем технического пользователя (User)
    temp_email = f"new_{uuid.uuid4().hex[:6]}@tsur.local"

    new_user = User(
        email=temp_email,
        hashed_password="not_set",  # Заглушка, пока пользователь сам не установит пароль
        is_admin=False,
    )
    db.add(new_user)
    await db.flush()  # Сохраняем юзера в базу и получаем ID до финального коммита

    # 3. Создаем сам профиль сотрудника
    new_profile = EmployeeProfile(
        user_id=new_user.id,
        first_name=profile_data.first_name,
        last_name=profile_data.last_name,
        position=profile_data.position,
        status=profile_data.status,
    )
    db.add(new_profile)
    await db.commit()

    # 4. Подгружаем связанные таблицы (user и links)
    result = await db.execute(
        select(EmployeeProfile)
        .options(
            selectinload(EmployeeProfile.user), selectinload(EmployeeProfile.links)
        )
        .where(EmployeeProfile.id == new_profile.id)
    )

    return result.scalars().first()


@router.get("/", response_model=List[ProfileListResponse])
async def get_profiles(
    search: str | None = Query(None, description="Поиск по ФИО или должности"),
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
    result = await db.execute(
        select(EmployeeProfile)
        .options(
            selectinload(EmployeeProfile.user), selectinload(EmployeeProfile.links)
        )
        .where(EmployeeProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if not profile:
        profile = EmployeeProfile(
            user_id=current_user.id, first_name="Имя", last_name="Фамилия"
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile


@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EmployeeProfile)
        .options(
            selectinload(EmployeeProfile.user), selectinload(EmployeeProfile.links)
        )
        .where(EmployeeProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if not profile:
        profile = EmployeeProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in data.dict(exclude_unset=True).items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile_by_id(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EmployeeProfile)
        .options(
            selectinload(EmployeeProfile.user), selectinload(EmployeeProfile.links)
        )
        .where(EmployeeProfile.id == profile_id)
    )
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")

    return profile


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
    prof_res = await db.execute(
        select(EmployeeProfile).where(EmployeeProfile.user_id == current_user.id)
    )
    profile = prof_res.scalars().first()

    if not profile:
        profile = EmployeeProfile(user_id=current_user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

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
    result = await db.execute(
        select(EmployeeProfile).where(EmployeeProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if not profile:
        profile = EmployeeProfile(user_id=current_user.id)
        db.add(profile)

    salt = bcrypt.gensalt()
    hashed_pin = bcrypt.hashpw(data.pin.encode("utf-8"), salt).decode("utf-8")

    profile.access_pin_hash = hashed_pin
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

    if not profile or not profile.access_pin_hash:
        raise HTTPException(
            status_code=400, detail="PIN-код не установлен для этого профиля"
        )

    if not bcrypt.checkpw(
        data.pin.encode("utf-8"), profile.access_pin_hash.encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Неверный PIN-код")

    expire = datetime.utcnow() + timedelta(hours=1)
    to_encode = {"unlocked_profile_id": profile.id, "exp": expire}

    with open(settings.SECRET_KEY_PRIVATE_FILE, "r") as f:
        private_key = f.read()

    unlock_token = jwt.encode(to_encode, private_key, algorithm="RS256")

    return {"unlock_token": unlock_token}


@router.get("/{profile_id}/links")
async def get_profile_links(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    authorization: str = Header(None),
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

    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            with open(settings.SECRET_KEY_PRIVATE_FILE, "r") as f:
                pub_key = f.read()
            payload = jwt.decode(token, pub_key, algorithms=["RS256"])

            if payload.get("unlocked_profile_id") == profile_id:
                links_res = await db.execute(
                    select(EmployeeLink).where(EmployeeLink.profile_id == profile_id)
                )
                return links_res.scalars().all()
        except:
            pass

    raise HTTPException(
        status_code=403, detail="Доступ к ссылкам ограничен. Введите PIN."
    )
