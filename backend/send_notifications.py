#!/usr/bin/env python3
from __future__ import annotations

import os
import smtplib
import sys
from email.message import EmailMessage
from pathlib import Path
from typing import List

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.config import settings  # noqa: E402
from app.db import list_users  # noqa: E402
from app.services.metrics import get_coins_with_metrics, get_coin_history  # noqa: E402
from app.utils.errors import HttpError  # noqa: E402

load_dotenv(BASE_DIR / ".env")


def forecast_change_percentage(history: List[dict]) -> float | None:
    if not history or len(history) < 2:
        return None
    ordered = sorted(history, key=lambda item: item["timestamp"])
    last = ordered[-1]["price"]
    prev = ordered[-2]["price"]
    if not prev:
        return None
    try:
        return ((last - prev) / prev) * 100
    except ZeroDivisionError:
        return None


def build_email_body(email: str, coins: List[str]) -> str:
    lines = [
        f"您好 {email},",
        "",
        "以下是您订阅的币种最新行情摘要：",
        "",
    ]

    try:
        metrics = get_coins_with_metrics(ids=coins, include_details=True)
    except HttpError as exc:
        lines.append(f"- 数据获取失败: {exc}")
        return "\n".join(lines)

    for item in metrics:
        coin = item["coin"]
        meta = item["metrics"]
        history = get_coin_history(coin["id"], "7D")
        forecast = forecast_change_percentage(history)
        change24h = coin.get("price_change_percentage_24h", 0) or 0
        direction = "上涨" if change24h >= 0 else "下跌"
        lines.extend(
            [
                f"• {coin['name']} ({coin['symbol'].upper()})",
                f"  现价：{coin['current_price']:.2f} {settings.default_vs_currency.upper()} （24h {direction} {change24h:.2f}%）",
                f"  健康评分：综合 {meta['healthScore']:.0f}｜流动性 {meta['liquidityScore']:.0f}｜动量 {meta['momentumScore']:.0f}",
                f"  今日预测：{forecast:+.2f}%" if forecast is not None else "  今日预测：暂无数据",
                "",
            ]
        )

    lines.append("此邮件由 Crypto Health Intelligence 自动发送，感谢您的关注！")
    return "\n".join(lines)


def send_email(recipient: str, subject: str, body: str) -> None:
    if not settings.smtp_host:
        print(f"跳过发送到 {recipient}，未配置 SMTP_HOST")
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email or settings.smtp_username or "no-reply@example.com"
    msg["To"] = recipient
    msg.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        if settings.smtp_username and settings.smtp_password:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(msg)


def main() -> None:
    if not settings.email_enabled:
        print("EMAIL_ENABLED 未开启，跳过通知发送。")
        return

    users = list_users()
    if not users:
        print("没有订阅用户，跳过通知发送。")
        return

    for user in users:
        email = user["email"]
        coins = user.get("coins") or []
        if not coins:
            continue
        body = build_email_body(email, coins)
        send_email(email, "加密资产每日行情提醒", body)
        print(f"已发送邮件给 {email}")


if __name__ == "__main__":
    main()
