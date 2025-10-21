from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Dict, List

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
        defaults = {
            "EMAIL_ENABLED": "false",
            "SMTP_HOST": settings.smtp_host or "",
            "SMTP_PORT": str(settings.smtp_port),
            "SMTP_USERNAME": settings.smtp_username or "",
            "SMTP_PASSWORD": settings.smtp_password or "",
            "SMTP_FROM_EMAIL": settings.smtp_from_email or "",
        }
        now = datetime.utcnow().isoformat() + "Z"
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
    now = datetime.utcnow().isoformat() + "Z"
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
