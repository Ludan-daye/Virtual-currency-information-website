from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Dict, List

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    port: int = int(os.getenv("PORT", "14000"))
    default_coins: List[str] = field(
        default_factory=lambda: os.getenv(
            "DEFAULT_COINS",
            "bitcoin,ethereum,solana,binancecoin,cardano,xrp,dogecoin,polkadot",
        ).split(",")
    )
    default_vs_currency: str = os.getenv("DEFAULT_VS_CURRENCY", "usd")
    cache_ttl_seconds: int = int(os.getenv("CACHE_TTL_SECONDS", "60"))
    api_cache_max_age_seconds: int = int(os.getenv("API_CACHE_MAX_AGE_SECONDS", str(7 * 24 * 3600)))
    max_coins_per_request: int = int(os.getenv("MAX_COINS_PER_REQUEST", "12"))
    request_timeout_seconds: int = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "12"))
    coingecko_base_url: str = os.getenv(
        "COINGECKO_BASE_URL", "https://api.coingecko.com/api/v3"
    )
    database_path: str = os.getenv(
        "DATABASE_PATH",
        os.path.join(os.path.dirname(__file__), "..", "data", "app.sqlite3"),
    )
    smtp_host: str | None = os.getenv("SMTP_HOST")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str | None = os.getenv("SMTP_USERNAME")
    smtp_password: str | None = os.getenv("SMTP_PASSWORD")
    smtp_from_email: str | None = os.getenv("SMTP_FROM_EMAIL")
    email_enabled: bool = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
    admin_password: str | None = os.getenv("ADMIN_PASSWORD", "admin123")
    admin_jwt_secret: str | None = os.getenv("ADMIN_JWT_SECRET", "crypto-health-intel-secret")
    supported_timeframes: Dict[str, int] = field(
        default_factory=lambda: {
            "1D": 1,
            "7D": 7,
            "30D": 30,
            "90D": 90,
            "1Y": 365,
        }
    )


settings = Settings()
