from __future__ import annotations

import os
from datetime import datetime
from typing import Dict, List

import requests

from app.config import settings
from app.utils.cache import cache_wrap

NEWS_ENDPOINT = os.getenv("POLICY_NEWS_ENDPOINT", "https://min-api.cryptocompare.com/data/v2/news/")
NEWS_CATEGORIES = os.getenv("POLICY_NEWS_CATEGORIES", "Regulation,General,Market,Energy,Forex")
NEGATIVE_KEYWORDS = ["ban", "halt", "crackdown", "suspend", "banlist", "禁止", "暂停", "打击"]
POSITIVE_KEYWORDS = ["approve", "framework", "support", "licence", "license", "指引", "支持", "批准"]
WORLD_EVENT_KEYWORDS = [
    "geopolitic",
    "global",
    "world",
    "international",
    "summit",
    "alliance",
    "diplomatic",
    "tension",
    "联合国",
    "外交",
    "谈判",
    "局势",
    "全球",
    "国际",
]
TURMOIL_KEYWORDS = [
    "war",
    "conflict",
    "escalation",
    "sanction",
    "geopolitical risk",
    "ukraine",
    "middle east",
    "missile",
    "military",
    "strike",
    "attack",
    "assault",
    "clash",
    "frontline",
    "invasion",
    "crisis",
    "rupture",
    "以色列",
    "巴以",
    "中东",
    "制裁",
    "战争",
    "动荡",
    "冲突",
]
STABILITY_KEYWORDS = [
    "stability",
    "volatility",
    "downgrade",
    "upgrade",
    "fed",
    "interest rate",
    "inflation",
    "bond yield",
    "treasury",
    "credit rating",
    "default",
    "risk-off",
    "risk-on",
    "stimulus",
    "economic",
    "宏观",
    "通胀",
    "利率",
    "稳定",
    "风险",
]
ENERGY_KEYWORDS = [
    "oil",
    "brent",
    "wti",
    "opec",
    "能源",
    "石油",
    "原油",
    "gas",
    "天然气",
    "fuel",
    "diesel",
    "crude",
    "barrel",
    "gasoline",
    "petrol",
    "refinery",
    "opec+",
    "lng",
    "coal",
]
POLICY_KEYWORDS = [
    "policy",
    "regulation",
    "framework",
    "supervision",
    "legislation",
    "bill",
    "ordinance",
    "statute",
    "directive",
    "监管",
    "政策",
    "合规",
]
CACHE_TTL_SECONDS = int(os.getenv("POLICY_NEWS_CACHE_TTL", "300"))
DEFAULT_THEMES = ["政策观察"]
MAX_ITEMS = int(os.getenv("POLICY_NEWS_MAX_ITEMS", "24"))


def _guess_impact(title: str) -> str:
    lower = title.lower()
    if any(keyword in lower for keyword in NEGATIVE_KEYWORDS):
        return "短期偏空"
    if any(keyword in lower for keyword in POSITIVE_KEYWORDS):
        return "偏利好"
    return "政策观察"


def _extract_themes(title: str, summary: str) -> List[str]:
    combined = f"{title} {summary}".lower()
    themes: List[str] = []
    if any(keyword in combined for keyword in TURMOIL_KEYWORDS):
        themes.append("全球动荡")
    if any(keyword in combined for keyword in WORLD_EVENT_KEYWORDS):
        themes.append("世界局势")
    if any(keyword in combined for keyword in STABILITY_KEYWORDS):
        themes.append("市场稳定度")
    if any(keyword in combined for keyword in ENERGY_KEYWORDS):
        themes.append("能源市场")
    if any(keyword in combined for keyword in POLICY_KEYWORDS):
        themes.append("政策动向")
    return themes or DEFAULT_THEMES.copy()


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


def _fallback_news() -> List[Dict[str, object]]:
    now = datetime.utcnow().isoformat() + "Z"
    return [
        {
            "title": "全球动荡观察",
            "summary": "暂未获取到最新的地缘政治突发信息，我们将持续更新。",
            "source": "Policy Feed",
            "url": "",
            "region": "Global",
            "impact": "待确认",
            "publishedAt": now,
            "themes": ["全球动荡", "世界局势"],
        },
        {
            "title": "世界局势脉络",
            "summary": "暂无新的外交与国际合作报道，请稍后再试。",
            "source": "Policy Feed",
            "url": "",
            "region": "Global",
            "impact": "政策观察",
            "publishedAt": now,
            "themes": ["世界局势"],
        },
        {
            "title": "能源供需快讯",
            "summary": "暂无最新的原油与能源市场数据，一旦更新将立刻推送。",
            "source": "Policy Feed",
            "url": "",
            "region": "Global",
            "impact": "待确认",
            "publishedAt": now,
            "themes": ["能源市场"],
        },
        {
            "title": "市场稳定度跟踪",
            "summary": "暂无最新的波动率或评级调整资讯，稍后自动刷新。",
            "source": "Policy Feed",
            "url": "",
            "region": "Global",
            "impact": "政策观察",
            "publishedAt": now,
            "themes": ["市场稳定度"],
        },
        {
            "title": "监管政策追踪",
            "summary": "暂无新的监管法规或政策动态，我们会第一时间同步。",
            "source": "Policy Feed",
            "url": "",
            "region": "Global",
            "impact": "待确认",
            "publishedAt": now,
            "themes": ["政策动向"],
        },
        {
            "title": "政策观察",
            "summary": "暂无最新资讯，请关注后续更新。",
            "source": "Policy Feed",
            "url": "",
            "region": "Global",
            "impact": "政策观察",
            "publishedAt": now,
            "themes": DEFAULT_THEMES.copy(),
        },
    ]


def _fetch_policy_news() -> List[Dict[str, object]]:
    params = {
        "categories": NEWS_CATEGORIES,
        "lang": "EN",
        "excludeCategories": "Sponsored",
        "sortOrder": "latest",
        "limit": max(MAX_ITEMS * 2, 20),
        "extraParams": "crypto-health-intel",
    }
    response = requests.get(
        NEWS_ENDPOINT,
        params=params,
        timeout=settings.request_timeout_seconds,
        headers={"User-Agent": "crypto-health-intel/1.0"},
    )
    response.raise_for_status()
    payload = response.json()
    data = payload.get("Data", [])
    items: List[Dict[str, object]] = []
    seen: set[tuple[str, str]] = set()

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
        source_name = source_info.get("name") or "CryptoCompare"
        dedupe_key = (title.strip(), source_name)
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)

        sort_key = (
            float(published_on)
            if isinstance(published_on, (int, float))
            else datetime.utcnow().timestamp()
        )
        items.append(
            {
                "title": title,
                "summary": summary,
                "source": source_name,
                "url": item.get("url", ""),
                "region": _map_region(source_info.get("name")),
                "impact": _guess_impact(title + " " + summary),
                "themes": _extract_themes(title, summary),
                "publishedAt": published_at,
                "_sort": sort_key,
            }
        )
    if not items:
        return _fallback_news()

    items.sort(key=lambda entry: entry.get("_sort", 0), reverse=True)
    for item in items:
        item.pop("_sort", None)

    trimmed = items[:MAX_ITEMS] if MAX_ITEMS > 0 else items
    return trimmed


def get_policy_news() -> List[Dict[str, object]]:
    def _factory() -> List[Dict[str, object]]:
        try:
            return _fetch_policy_news()
        except requests.RequestException:
            return _fallback_news()

    return cache_wrap("policy_news", _factory, ttl=CACHE_TTL_SECONDS)
