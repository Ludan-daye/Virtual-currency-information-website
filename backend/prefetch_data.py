#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path
from typing import Iterable, List

try:
    from dotenv import load_dotenv
except ImportError:
    print("python-dotenv 未安装，请先进入 backend 虚拟环境并运行 'pip install -r requirements.txt'。")
    sys.exit(1)

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.config import settings  # noqa: E402
from app.services.metrics import (  # noqa: E402
    get_coin_history,
    get_coins_with_metrics,
    get_market_overview,
)
from app.utils.errors import HttpError  # noqa: E402

load_dotenv(BASE_DIR / ".env")

DEFAULT_TIMEFRAMES = ["1D", "7D", "30D"]


def safe_call(func, *args, **kwargs):
    retries = 3
    for attempt in range(1, retries + 1):
        try:
            return func(*args, **kwargs)
        except HttpError as exc:
            if attempt == retries:
                raise
            if "429" in str(exc):
                time.sleep(2 * attempt)
            else:
                time.sleep(1)


def prefetch(coins: List[str], vs_currency: str, timeframes: Iterable[str], sleep_interval: float) -> None:
    print(f"[prefetch] coins={coins}, vs={vs_currency}")
    safe_call(get_coins_with_metrics, ids=coins, vs_currency=vs_currency, include_details=True)
    time.sleep(sleep_interval)

    for coin in coins:
        for tf in timeframes:
            print(f"[prefetch] history {coin} {tf}")
            safe_call(get_coin_history, coin, tf, vs_currency)
            time.sleep(sleep_interval)

    print("[prefetch] market overview")
    safe_call(get_market_overview, vs_currency)
    time.sleep(sleep_interval)


def main():
    parser = argparse.ArgumentParser(description="Prefetch CoinGecko data into local cache")
    parser.add_argument("--coins", type=str, default=",".join(settings.default_coins), help="Comma-separated coin ids")
    parser.add_argument("--vs", type=str, default=settings.default_vs_currency, help="Quote currency (default: usd)")
    parser.add_argument("--timeframes", type=str, default=",".join(DEFAULT_TIMEFRAMES), help="Comma-separated timeframes to prefetch")
    parser.add_argument("--sleep", type=float, default=2.0, help="Seconds to sleep between API calls (default: 2s)")
    args = parser.parse_args()

    coins = [coin.strip().lower() for coin in args.coins.split(",") if coin.strip()]
    timeframes = [tf.strip().upper() for tf in args.timeframes.split(",") if tf.strip()]

    if not coins:
        print("No coins specified.")
        return

    prefetch(coins, args.vs.lower(), timeframes, args.sleep)
    print("Prefetch completed. Data stored in local cache.")


if __name__ == "__main__":
    main()
