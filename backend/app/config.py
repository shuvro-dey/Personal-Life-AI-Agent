from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Personal Life AI Agent"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Database
    DATABASE_URL: str = "sqlite:///./app.db"

    # Authentication
    JWT_SECRET: str = "development_super_secret_jwt_key_change_in_production_32chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # AI Configuration (Google GenAI)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"

    # Timezone
    DEFAULT_TIMEZONE: str = "Asia/Dhaka"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
