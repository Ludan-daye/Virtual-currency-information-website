from __future__ import annotations

import os
from datetime import datetime
from typing import Dict, List

import requests

from app.config import settings
from app.utils.cache import cache_wrap

NEWS_ENDPOINT = os.getenv("POLICY_NEWS_ENDPOINT", "https://min-api.cryptocompare.com/data/v2/news/")
NEGATIVE_KEYWORDS = ["ban", "halt", "crackdown", "suspend", "banlist", "禁止", "暂停", "打击"]
POSITIVE_KEYWORDS = ["approve", "framework", "support", "licence", "license", "指引", "支持", "批准"]


def _guess_impact(title: str) -> str:
    lower = title.lower()
    if any(keyword in lower for keyword in NEGATIVE_KEYWORDS):
        return "短期偏空"
    if any(keyword in lower for keyword in POSITIVE_KEYWORDS):
        return "偏利好"
    return "政策观察"


def _map_region(source_name: str | None) -> str:
    if not source_name:
        return "Global"
    mapping = {
        "asia": "Asia",
        "china": "China",
        "japan": "Japan",
        "us": "US",
        "uk": "UK",
        "europe": "EU",
        "hk": "Hong Kong",
        "singapore": "Singapore",
    }
    lowered = source_name.lower()
    for key, region in mapping.items():
        if key in lowered:
            return region
    return source_name


def _fallback_news() -> List[Dict[str, str]]:
    now = datetime.utcnow().isoformat() + "Z"
    return [
        {
            "title": "暂无实时数据",
            "summary": "暂未获取到最新的政策/监管新闻，稍后会自动刷新。",
            "source": "Policy Feed",
            "url": "",
            "region": "Global",
            "impact": "政策观察",
            "publishedAt": now,
        }
    ]


def _fetch_policy_news() -> List[Dict[str, str]]:
    params = {
        "categories": "Regulation",
        "lang": "EN",
    }
    response = requests.get(NEWS_ENDPOINT, params=params, timeout=settings.request_timeout_seconds)
    response.raise_for_status()
    payload = response.json()
    data = payload.get("Data", [])
    items: List[Dict[str, str]] = []

    for item in data:
        title = item.get("title")
        if not title:
            continue
        published_on = item.get("published_on")
        published_at = (
            datetime.utcfromtimestamp(published_on).isoformat() + "Z"
            if isinstance(published_on, (int, float))
            else datetime.utcnow().isoformat() + "Z"
        )
        summary = item.get("body", "")[:240]
        source_info = item.get("source_info") or {}
        items.append(
            {
                "title": title,
                "summary": summary,
                "source": source_info.get("name") or "CryptoCompare",
                "url": item.get("url", ""),
                "region": _map_region(source_info.get("name")),
                "impact": _guess_impact(title + " " + summary),
                "publishedAt": published_at,
            }
        )
    return (items[:6]) or _fallback_news()


def get_policy_news() -> List[Dict[str, str]]:
    def _factory() -> List[Dict[str, str]]:
        try:
            return _fetch_policy_news()
        except requests.RequestException:
            return _fallback_news()

    return cache_wrap("policy_news", _factory, ttl=600)
