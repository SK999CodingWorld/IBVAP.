from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Environment & Host
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security & Tokens
    SECRET_KEY: str = "supersecretkey-change-in-production-ibvap-safe-dev-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    WEBHOOK_SECRET: str = "ibvap_default_webhook_secret_32bytes_min"
    
    # Database Configuration & Pool Sizing
    DATABASE_URL: str = "sqlite+aiosqlite:///./ibvap.db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 1800
    
    # Cache & Messaging
    REDIS_URL: str = "redis://localhost:6379"
    
    # CORS & Limits
    CORS_ORIGINS: List[str] = ["*"]
    RATE_LIMIT_PER_MINUTE: int = 120
    MAX_REQUEST_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    
    # Feature Flags & Demo Mode
    DEMO_MODE: bool = True
    DEMO_ADMIN_USERNAME: str = "admin"
    DEMO_ADMIN_PASSWORD: str = "admin123"
    ENABLE_KEY_HEALTH_CHECK: bool = False
    
    # Edge & AI
    AI_BACKEND: str = "mock"
    EDGE_NODE_ID: str = "EDGE-001"

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @model_validator(mode="after")
    def validate_production_readiness(self) -> "Settings":
        # Fail fast in production environment
        if self.ENVIRONMENT.lower() == "production":
            insecure_keys = {
                "supersecretkey-change-in-production",
                "supersecretkey-change-in-production-ibvap-safe-dev-key",
                "secret",
                "change-me",
                "admin123"
            }
            if not self.SECRET_KEY or self.SECRET_KEY in insecure_keys or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "FATAL: In production, SECRET_KEY must be a cryptographically strong secret "
                    "with at least 32 characters. Found default or insecure secret."
                )
            if not self.DATABASE_URL or self.DATABASE_URL.startswith("sqlite"):
                raise ValueError(
                    "FATAL: In production, DATABASE_URL must be configured with a PostgreSQL database "
                    "(e.g. postgresql+asyncpg://user:pass@host:port/dbname). SQLite is not permitted."
                )
        return self

settings = Settings()
