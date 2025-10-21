from __future__ import annotations

import sqlite3
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List

from app.config import settings

_DB_PATH = Path(settings.database_path).resolve()
_DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = _get_connection()
    with conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                coins TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS api_cache (
                cache_key TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                fetched_at TEXT NOT NULL
            )
            """
        )
        defaults = {
            "EMAIL_ENABLED": "false",
            "SMTP_HOST": settings.smtp_host or "",
            "SMTP_PORT": str(settings.smtp_port),
            "SMTP_USERNAME": settings.smtp_username or "",
            "SMTP_PASSWORD": settings.smtp_password or "",
            "SMTP_FROM_EMAIL": settings.smtp_from_email or "",
        }
        now = datetime.now(timezone.utc).isoformat()
        conn.executemany(
            """
            INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO NOTHING
            """,
            [(key, value, now) for key, value in defaults.items()],
        )
    conn.close()


def upsert_user(email: str, coins: List[str]) -> None:
    normalized_email = email.strip().lower()
    coins = sorted(set([coin.strip().lower() for coin in coins if coin.strip()]))
    if not coins:
        raise ValueError("至少需要选择一个币种")
    now = datetime.now(timezone.utc).isoformat()
    coins_str = ",".join(coins)

    conn = _get_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO users (email, coins, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET coins=excluded.coins, updated_at=excluded.updated_at
            """,
            (normalized_email, coins_str, now, now),
        )
    conn.close()


def list_users() -> List[Dict[str, object]]:
    conn = _get_connection()
    with conn:
        rows = conn.execute("SELECT email, coins, created_at, updated_at FROM users").fetchall()
    conn.close()
    results: List[Dict[str, object]] = []
    for row in rows:
        data = dict(row)
        data["coins"] = data["coins"].split(",") if data.get("coins") else []
        results.append(data)
    return results


def get_user(email: str) -> Dict[str, object] | None:
    conn = _get_connection()
    with conn:
        row = conn.execute(
            "SELECT email, coins, created_at, updated_at FROM users WHERE email = ?",
            (email.strip().lower(),),
        ).fetchone()
    conn.close()
    if not row:
        return None
    data = dict(row)
    data["coins"] = data["coins"].split(",") if data.get("coins") else []
    return data


def upsert_config(entries: Dict[str, str]) -> None:
    if not entries:
        return
    now = datetime.utcnow().isoformat() + "Z"
    conn = _get_connection()
    with conn:
        conn.executemany(
            """
            INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
            """,
            [(key, value, now) for key, value in entries.items()],
        )
    conn.close()


def get_config(keys: List[str] | None = None) -> Dict[str, str]:
    conn = _get_connection()
    with conn:
        if keys:
            placeholder = ",".join(["?"] * len(keys))
            rows = conn.execute(
                f"SELECT key, value FROM settings WHERE key IN ({placeholder})",
                keys,
            ).fetchall()
        else:
            rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    return {row["key"]: row["value"] for row in rows}


def get_cached_json(cache_key: str, max_age_seconds: int) -> Any | None:
    conn = _get_connection()
    with conn:
        row = conn.execute(
            "SELECT data, fetched_at FROM api_cache WHERE cache_key = ?",
            (cache_key,),
        ).fetchone()
    conn.close()
    if not row:
        return None

    fetched_raw = row["fetched_at"]
    if fetched_raw.endswith("Z"):
        fetched_raw = fetched_raw.replace("Z", "+00:00")
    fetched_at = datetime.fromisoformat(fetched_raw)
    if datetime.now(timezone.utc) - fetched_at > timedelta(seconds=max_age_seconds):
        delete_cached(cache_key)
        return None

    try:
        return json.loads(row["data"])
    except json.JSONDecodeError:
        return None


def set_cached_json(cache_key: str, value: Any) -> None:
    payload = json.dumps(value)
    now = datetime.now(timezone.utc).isoformat()
    conn = _get_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO api_cache (cache_key, data, fetched_at)
            VALUES (?, ?, ?)
            ON CONFLICT(cache_key) DO UPDATE SET data=excluded.data, fetched_at=excluded.fetched_at
            """,
            (cache_key, payload, now),
        )
    conn.close()


def delete_cached(cache_key: str) -> None:
    conn = _get_connection()
    with conn:
        conn.execute("DELETE FROM api_cache WHERE cache_key = ?", (cache_key,))
    conn.close()


def purge_expired_cache(max_age_seconds: int) -> None:
    threshold = datetime.now(timezone.utc) - timedelta(seconds=max_age_seconds)
    conn = _get_connection()
    with conn:
        conn.execute(
            "DELETE FROM api_cache WHERE fetched_at < ?",
            (threshold.isoformat(),),
        )
    conn.close()
