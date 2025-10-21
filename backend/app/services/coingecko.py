from __future__ import annotations

import time
from typing import Any, Dict, List

import requests

from app.config import settings
from app.utils.cache import cache_wrap
from app.utils.errors import HttpError


def _request(endpoint: str, params: Dict[str, Any] | None = None) -> Any:
    url = f"{settings.coingecko_base_url}{endpoint}"
    backoff_seconds = [0, 1, 3]

    for attempt, delay in enumerate(backoff_seconds, start=1):
        if delay:
            time.sleep(delay)
        try:
            response = requests.get(
                url,
                params=params,
                timeout=settings.request_timeout_seconds,
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            return response.json()
        except requests.HTTPError as exc:
            status = exc.response.status_code if exc.response is not None else 500
            if status == 429 and attempt < len(backoff_seconds):
                # Hit API rate limit, retry after backoff
                continue
            message = exc.response.reason if exc.response is not None else str(exc)
            raise HttpError(status, f"CoinGecko API error ({status}): {message}") from exc
        except requests.RequestException as exc:  # network or timeout
            if attempt < len(backoff_seconds):
                continue
            raise HttpError(502, f"CoinGecko request failed: {exc}") from exc


def fetch_market_data(ids: List[str], vs_currency: str, include_sparkline: bool = True) -> Any:
    cache_key = (
        f"markets:{vs_currency}:{','.join(sorted(ids))}:sparkline:{include_sparkline}"
    )

    def _factory() -> Any:
        return _request(
            "/coins/markets",
            params={
                "vs_currency": vs_currency,
                "ids": ",".join(ids),
                "sparkline": str(include_sparkline).lower(),
                "price_change_percentage": "1h,24h,7d,30d,1y",
                "precision": 6,
            },
        )

    return cache_wrap(cache_key, _factory)


def fetch_market_chart(coin_id: str, vs_currency: str, days: int) -> Any:
    cache_key = f"market-chart:{coin_id}:{vs_currency}:{days}"

    def _factory() -> Any:
        return _request(
            f"/coins/{coin_id}/market_chart",
            params={
                "vs_currency": vs_currency,
                "days": days,
                "interval": "hourly" if days <= 1 else "daily",
            },
        )

    return cache_wrap(cache_key, _factory)


def fetch_global_data() -> Any:
    return cache_wrap("global", lambda: _request("/global"))


def fetch_trending() -> Any:
    return cache_wrap("trending", lambda: _request("/search/trending"))


def fetch_coin_details(coin_id: str) -> Any:
    cache_key = f"coin-details:{coin_id}"

    def _factory() -> Any:
        return _request(
            f"/coins/{coin_id}",
            params={
                "localization": "false",
                "tickers": "false",
                "market_data": "true",
                "community_data": "true",
                "developer_data": "true",
                "sparkline": "false",
            },
        )

    return cache_wrap(cache_key, _factory, ttl=600)
