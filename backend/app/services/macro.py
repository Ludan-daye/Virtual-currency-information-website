from __future__ import annotations

from datetime import datetime
from typing import Dict, List

from app.utils.cache import cache_wrap

# 简化示例数据：真实场景可接入官方 API
MOCK_NFP_DATA: List[Dict[str, str | float]] = [
    {
        "month": "2024-10",
        "actual": 150.0,
        "forecast": 120.0,
        "previous": 170.0,
    },
    {
        "month": "2024-09",
        "actual": 170.0,
        "forecast": 160.0,
        "previous": 180.0,
    },
    {
        "month": "2024-08",
        "actual": 187.0,
        "forecast": 175.0,
        "previous": 157.0,
    },
    {
        "month": "2024-07",
        "actual": 157.0,
        "forecast": 180.0,
        "previous": 158.0,
    },
    {
        "month": "2024-06",
        "actual": 206.0,
        "forecast": 190.0,
        "previous": 218.0,
    },
]


def _with_timestamp(data: List[Dict[str, str | float]]) -> Dict[str, object]:
    return {
        "updatedAt": datetime.utcnow().isoformat() + "Z",
        "items": data,
    }


def get_nfp_series() -> Dict[str, object]:
    # 这里直接返回缓存的模拟数据，后续可接入真实数据源
    return cache_wrap("nfp_series", lambda: _with_timestamp(MOCK_NFP_DATA), ttl=3600)
