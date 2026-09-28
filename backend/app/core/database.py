from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.core.config import settings

def get_normalized_database_url(raw_url: str) -> str:
    """
    Normalizes PostgreSQL connection strings provided by Railway / Heroku / Supabase
    to use the asyncpg dialect required by SQLAlchemy async engine.
    """
    if not raw_url:
        return "sqlite+aiosqlite:///./ibvap.db"
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    if raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+"):
        return raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return raw_url

DATABASE_URL = get_normalized_database_url(settings.DATABASE_URL)

engine_kwargs = {
    "echo": False,
    "future": True,
    "pool_pre_ping": True,
}

# Only configure connection pooling arguments on PostgreSQL engines
if "postgresql" in DATABASE_URL:
    engine_kwargs.update({
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_recycle": settings.DB_POOL_RECYCLE,
    })

engine = create_async_engine(DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

async def ping_database() -> bool:
    """Checks database liveness without throwing unhandled exceptions."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False

