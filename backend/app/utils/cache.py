from __future__ import annotations

from cachetools import TTLCache
from typing import Callable, TypeVar, Any

from app.config import settings

T = TypeVar("T")

cache = TTLCache(maxsize=256, ttl=settings.cache_ttl_seconds)


def cache_get(key: str) -> Any:
    return cache.get(key)


def cache_set(key: str, value: Any, ttl: int | None = None) -> None:
    # cachetools.TTLCache applies a global TTL; we ignore per-entry overrides for simplicity.
    cache[key] = value


def cache_wrap(key: str, factory: Callable[[], T], ttl: int | None = None) -> T:
    if key in cache:
        return cache[key]
    value = factory()
    cache_set(key, value, ttl)
    return value
