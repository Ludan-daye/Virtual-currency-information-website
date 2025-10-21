from __future__ import annotations

from typing import Any, Dict, List

from app.config import settings
from app.services.coingecko import (
    fetch_coin_details,
    fetch_global_data,
    fetch_market_chart,
    fetch_market_data,
    fetch_trending,
)
from app.utils.errors import HttpError
from app.db import get_cached_json, set_cached_json


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def scale(value: float, min_value: float, max_value: float) -> float:
    if max_value - min_value == 0:
        return 0.0
    return clamp((value - min_value) / (max_value - min_value), 0.0, 1.0)


def safe_ratio(numerator: float, denominator: float) -> float:
    if not denominator:
        return 0.0
    return numerator / denominator


def compute_metrics(coin: Dict[str, Any], details: Dict[str, Any] | None) -> Dict[str, float]:
    high = coin.get("high_24h")
    low = coin.get("low_24h")
    current_price = coin.get("current_price", 0) or 0
    price_change_24h_pct = coin.get("price_change_percentage_24h") or 0

    if high and low and current_price:
        price_volatility_ratio = (high - low) / current_price
    else:
        price_volatility_ratio = abs(price_change_24h_pct) / 100

    volatility_score = clamp(100 - scale(price_volatility_ratio, 0, 0.25) * 100, 0, 100)

    liquidity_ratio = safe_ratio(coin.get("total_volume", 0) or 0, coin.get("market_cap", 0) or 0)
    liquidity_score = clamp(scale(liquidity_ratio, 0, 1) * 100, 0, 100)

    sparkline = (coin.get("sparkline_in_7d") or {}).get("price")
    change_7d = 0.0
    if isinstance(sparkline, list) and sparkline:
        base = sparkline[0]
        if base:
            change_7d = ((current_price - base) / base) * 100
    elif details:
        change_7d = (
            (details.get("market_data") or {}).get("price_change_percentage_7d")
            or 0
        )

    change_30d = (
        (details or {})
        .get("market_data", {})
        .get("price_change_percentage_30d")
    )
    if change_30d is None:
        change_30d = price_change_24h_pct * 1.6

    momentum_composite = (
        price_change_24h_pct * 0.35 + change_7d * 0.4 + change_30d * 0.25
    ) / 3
    momentum_score = clamp(scale(momentum_composite, -20, 20) * 100, 0, 100)

    developer_data = (details or {}).get("developer_data") or {}
    community_data = (details or {}).get("community_data") or {}

    development_score = clamp(
        scale(
            (developer_data.get("stars") or 0) * 0.2
            + (developer_data.get("forks") or 0) * 0.2
            + (developer_data.get("commit_count_4_weeks") or 0) * 0.4
            + (developer_data.get("pull_requests_merged") or 0) * 0.2,
            0,
            500,
        )
        * 100,
        0,
        100,
    ) if developer_data else 50

    community_score = clamp(
        scale(
            (community_data.get("twitter_followers") or 0) * 0.00002
            + (community_data.get("reddit_subscribers") or 0) * 0.00004,
            0,
            30,
        )
        * 100,
        0,
        100,
    ) if community_data else 40

    health_score = clamp(
        volatility_score * 0.2
        + liquidity_score * 0.3
        + momentum_score * 0.25
        + development_score * 0.15
        + community_score * 0.1,
        0,
        100,
    )

    return {
        "healthScore": health_score,
        "volatilityScore": volatility_score,
        "liquidityScore": liquidity_score,
        "momentumScore": momentum_score,
        "developmentScore": clamp(
            (development_score + community_score * 0.4) / 1.4, 0, 100
        ),
    }


def get_coins_with_metrics(
    ids: List[str] | None = None,
    vs_currency: str | None = None,
    include_details: bool = True,
) -> List[Dict[str, Any]]:
    ids = ids or settings.default_coins
    vs_currency = (vs_currency or settings.default_vs_currency).lower()
    cache_key = "coins:{0}:{1}:{2}".format(
        vs_currency,
        ",".join(sorted(ids)),
        int(include_details),
    )

    cached = get_cached_json(cache_key, settings.api_cache_max_age_seconds)
    if cached:
        return cached

    if not ids:
        raise HttpError(400, "At least one coin id is required")
    if len(ids) > settings.max_coins_per_request:
        raise HttpError(
            400,
            f"A maximum of {settings.max_coins_per_request} coins can be requested at once",
        )

    market_data = fetch_market_data(ids, vs_currency)
    details_list: List[Dict[str, Any] | None] = []
    if include_details:
        for coin in market_data:
            try:
                details_list.append(fetch_coin_details(coin["id"]))
            except HttpError:
                details_list.append(None)
    else:
        details_list = [None] * len(market_data)

    result = [
        {
            "coin": coin,
            "metrics": compute_metrics(coin, details_list[idx]),
        }
        for idx, coin in enumerate(market_data)
    ]
    set_cached_json(cache_key, result)
    return result


def get_coin_history(coin_id: str, timeframe_key: str, vs_currency: str | None = None) -> List[Dict[str, Any]]:
    vs_currency = (vs_currency or settings.default_vs_currency).lower()
    if timeframe_key not in settings.supported_timeframes:
        raise HttpError(
            400,
            f"Invalid timeframe '{timeframe_key}'. Supported: {', '.join(settings.supported_timeframes.keys())}",
        )

    days = settings.supported_timeframes[timeframe_key]
    cache_key = f"history:{coin_id}:{vs_currency}:{timeframe_key}"
    cached = get_cached_json(cache_key, settings.api_cache_max_age_seconds)
    if cached:
        return cached

    data = fetch_market_chart(coin_id, vs_currency, days)

    prices = data.get("prices") or []
    market_caps = data.get("market_caps") or []
    volumes = data.get("total_volumes") or []

    history: List[Dict[str, Any]] = []
    for idx, price_point in enumerate(prices):
        if not isinstance(price_point, list) or len(price_point) < 2:
            continue
        timestamp = int(price_point[0])
        price = float(price_point[1] or 0)
        market_cap_point = market_caps[idx] if idx < len(market_caps) else None
        market_cap = float(market_cap_point[1]) if market_cap_point and len(market_cap_point) > 1 else 0
        volume_point = volumes[idx] if idx < len(volumes) else None
        volume = float(volume_point[1]) if volume_point and len(volume_point) > 1 else 0
        history.append(
            {
                "timestamp": timestamp,
                "price": price,
                "marketCap": market_cap,
                "volume": volume,
            }
        )

    set_cached_json(cache_key, history)
    return history


def get_market_overview(vs_currency: str | None = None) -> Dict[str, Any]:
    vs_currency = (vs_currency or settings.default_vs_currency).lower()
    cache_key = f"market-overview:{vs_currency}"
    cached = get_cached_json(cache_key, settings.api_cache_max_age_seconds)
    if cached:
        return cached

    global_data, trending_data = fetch_global_data(), fetch_trending()

    total_market_cap = (global_data.get("data", {}).get("total_market_cap") or {}).get(vs_currency, 0)
    total_volume = (global_data.get("data", {}).get("total_volume") or {}).get(vs_currency, 0)
    market_cap_change = global_data.get("data", {}).get("market_cap_change_percentage_24h_usd", 0)
    dominance = global_data.get("data", {}).get("market_cap_percentage", {})

    trending_coins = []
    for coin in trending_data.get("coins", []):
        item = coin.get("item") or {}
        trending_coins.append(
            {
                "id": item.get("id"),
                "symbol": item.get("symbol"),
                "score": item.get("score"),
            }
        )

    result = {
        "totalMarketCap": total_market_cap,
        "totalVolume": total_volume,
        "marketCapChange24h": market_cap_change,
        "dominance": dominance,
        "trending": trending_coins,
    }
    set_cached_json(cache_key, result)
    return result
