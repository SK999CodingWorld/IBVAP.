import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app as fastapi_app
from app.core.database import engine, Base, AsyncSessionLocal
from app import models
from app.services.seed import seed_db

app = fastapi_app

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.fixture(autouse=True)
async def init_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        await seed_db(session)
    yield

@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def admin_token(client: AsyncClient):
    response = await client.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    data = response.json()
    return data.get("access_token")

@pytest.fixture
async def auth_headers(admin_token: str):
    return {"Authorization": f"Bearer {admin_token}"}
