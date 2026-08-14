from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Table
from sqlalchemy.orm import relationship
from app.core.database import (
    Base,
)  # Убедитесь, что импорт Base соответствует вашему проекту

# --- ТАБЛИЦЫ-СВЯЗКИ (Многие ко многим) ---

profile_achievements = Table(
    "profile_achievements",
    Base.metadata,
    Column(
        "profile_id",
        Integer,
        ForeignKey("hub.employee_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "achievement_id",
        Integer,
        ForeignKey("hub.achievements.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    schema="hub",  # Указываем схему
)

profile_events = Table(
    "profile_events",
    Base.metadata,
    Column(
        "profile_id",
        Integer,
        ForeignKey("hub.employee_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "event_id",
        Integer,
        ForeignKey("hub.events.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    schema="hub",
)

# --- ОСНОВНЫЕ МОДЕЛИ ---


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "hub"}  # Помещаем таблицу в схему hub

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)

    profile = relationship("EmployeeProfile", back_populates="user", uselist=False)


class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"
    __table_args__ = {"schema": "hub"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("hub.users.id", ondelete="CASCADE"), unique=True
    )
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    middle_name = Column(String, nullable=True)
    position = Column(String, nullable=True)
    status = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    access_pin_hash = Column(String, nullable=True)

    # НОВЫЕ ПОЛЯ ИЗ ТЗ (Этап 4)
    manager_id = Column(
        Integer,
        ForeignKey("hub.employee_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    department = Column(String, nullable=True)
    hire_date = Column(Date, nullable=True)
    birth_date = Column(Date, nullable=True)
    employment_type = Column(String, nullable=True)
    city = Column(String, nullable=True)

    # СВЯЗИ
    user = relationship("User", back_populates="profile")
    links = relationship(
        "EmployeeLink", back_populates="profile", cascade="all, delete-orphan"
    )

    # Связь с руководителем (ссылается на эту же таблицу)
    manager = relationship("EmployeeProfile", remote_side=[id], backref="subordinates")

    # Связи для бейджей и событий
    achievements = relationship(
        "Achievement", secondary=profile_achievements, back_populates="profiles"
    )
    events = relationship("Event", secondary=profile_events, back_populates="profiles")

    @property
    def is_admin(self) -> bool:
        return self.user.is_admin if self.user else False


class EmployeeLink(Base):
    __tablename__ = "employee_links"
    __table_args__ = {"schema": "hub"}

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(
        Integer, ForeignKey("hub.employee_profiles.id", ondelete="CASCADE")
    )
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    icon = Column(String, nullable=True)

    profile = relationship("EmployeeProfile", back_populates="links")


# --- НОВЫЕ СУЩНОСТИ ---


class Achievement(Base):
    __tablename__ = "achievements"
    __table_args__ = {"schema": "hub"}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)  # Например, "Проект года"
    year = Column(Integer, nullable=True)  # Например, 2025
    color_theme = Column(String, nullable=True)  # Например, "yellow", "blue", "purple"

    profiles = relationship(
        "EmployeeProfile", secondary=profile_achievements, back_populates="achievements"
    )


class Event(Base):
    __tablename__ = "events"
    __table_args__ = {"schema": "hub"}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)  # "Демо новой версии"
    event_date = Column(Date, nullable=False)
    event_time = Column(String, nullable=True)  # "10:00"
    format = Column(String, nullable=True)  # "Онлайн"

    profiles = relationship(
        "EmployeeProfile", secondary=profile_events, back_populates="events"
    )
