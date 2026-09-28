import time
import json
import asyncio
from typing import Any, Optional, Dict, Tuple
from app.core.config import settings

class CacheManager:
    """
    High-Performance Unified Async Cache with Redis client & in-memory fallback.
    """
    def __init__(self):
        self._memory_cache: Dict[str, Tuple[float, Any]] = {}
        self._memory_lock = asyncio.Lock()
        self._redis_client = None
        self._redis_available: Optional[bool] = None

    async def _get_redis(self):
        if self._redis_available is False:
            return None
        if self._redis_client is not None:
            return self._redis_client
        try:
            import redis.asyncio as aioredis
            client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=1.0,
                socket_connect_timeout=1.0
            )
            await client.ping()
            self._redis_client = client
            self._redis_available = True
            return self._redis_client
        except Exception:
            self._redis_available = False
            return None

    async def get(self, key: str) -> Optional[Any]:
        # Try Redis first
        client = await self._get_redis()
        if client:
            try:
                val = await client.get(key)
                if val is not None:
                    try:
                        return json.loads(val)
                    except Exception:
                        return val
            except Exception:
                self._redis_available = False

        # In-memory fallback
        async with self._memory_lock:
            entry = self._memory_cache.get(key)
            if entry is not None:
                exp, val = entry
                if exp > time.time():
                    return val
                else:
                    self._memory_cache.pop(key, None)
        return None

    async def set(self, key: str, value: Any, ttl: int = 60) -> bool:
        client = await self._get_redis()
        serialized = json.dumps(value) if not isinstance(value, str) else value
        if client:
            try:
                await client.set(key, serialized, ex=ttl)
                return True
            except Exception:
                self._redis_available = False

        # In-memory fallback
        async with self._memory_lock:
            exp = time.time() + ttl
            self._memory_cache[key] = (exp, value)
            # Evict expired entries if memory cache grows large
            if len(self._memory_cache) > 1000:
                now = time.time()
                self._memory_cache = {k: v for k, v in self._memory_cache.items() if v[0] > now}
        return True

    async def delete(self, key: str) -> bool:
        client = await self._get_redis()
        if client:
            try:
                await client.delete(key)
            except Exception:
                pass
        async with self._memory_lock:
            self._memory_cache.pop(key, None)
        return True

    async def ping(self) -> Dict[str, Any]:
        client = await self._get_redis()
        if client:
            try:
                await client.ping()
                return {"backend": "redis", "status": "online"}
            except Exception:
                pass
        return {"backend": "memory", "status": "online", "items_count": len(self._memory_cache)}

    async def close(self):
        if self._redis_client:
            try:
                await self._redis_client.close()
            except Exception:
                pass

cache = CacheManager()
