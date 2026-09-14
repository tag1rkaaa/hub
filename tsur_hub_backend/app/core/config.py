from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )
    # Integration
    INTEGRATION_SECRET: str = "change_me"

    # База данных
    DATABASE_URL: str = "postgresql+asyncpg://kba:kba@localhost:5432/kba"

    # JWT
    SECRET_KEY_PRIVATE_FILE: str = "secrets/private.pem"
    SECRET_KEY_PUBLIC_FILE: str = "secrets/public.pem"

    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "tsur_hub_media"


settings = Settings()
