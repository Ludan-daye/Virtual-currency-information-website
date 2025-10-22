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
from app.db import get_config, list_users  # noqa: E402
from app.services.metrics import get_coins_with_metrics, get_coin_history  # noqa: E402
from app.services.policy_news import get_policy_news  # noqa: E402
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

    try:
        policy_news = get_policy_news()
    except Exception:
        policy_news = []

    lines.extend(
        [
            "",
            "金融政策热搜：",
        ]
    )
    if policy_news:
        lines.extend(render_policy_news_digest(policy_news))
    else:
        lines.append("- 暂无最新政策更新，可稍后再查看。")

    lines.extend(
        [
            "",
            "此邮件由 Crypto Health Intelligence 自动发送，感谢您的关注！",
        ]
    )

    return "\n".join(lines)


def render_policy_news_digest(policy_news: List[dict[str, object]]) -> List[str]:
    sections = {
        "全球动荡": [],
        "世界局势": [],
        "能源市场": [],
        "市场稳定度": [],
        "政策动向": [],
        "政策观察": [],
    }
    extra_sections: dict[str, List[dict[str, object]]] = {}

    for item in policy_news:
        themes = item.get("themes") or []
        themes_list = [str(theme).strip() for theme in themes if isinstance(theme, str) and str(theme).strip()]
        target_sections: List[str] = []
        for theme in themes_list:
            if theme in sections:
                target_sections.append(theme)
            else:
                target_sections.append(theme)
                extra_sections.setdefault(theme, []).append(item)
        if not target_sections:
            target_sections.append("政策观察")

        for theme in target_sections[:1]:
            sections.setdefault(theme, []).append(item)

    digest_lines: List[str] = []

    def append_section(header: str, items: List[dict[str, object]]):
        if not items:
            return
        digest_lines.append("")
        digest_lines.append(f"{header}:")
        for entry in items[:3]:
            digest_lines.extend(render_policy_item_line(entry))

    append_section("全球动荡观察", sections.get("全球动荡", []))
    append_section("世界局势脉络", sections.get("世界局势", []))
    append_section("能源市场焦点", sections.get("能源市场", []))
    append_section("市场稳定度速览", sections.get("市场稳定度", []))
    append_section("政策动向追踪", sections.get("政策动向", []))
    append_section("政策观察", sections.get("政策观察", []))

    for theme, items in extra_sections.items():
        append_section(theme, items)

    return digest_lines or ["- 暂无最新政策更新，可稍后再查看。"]


def render_policy_item_line(item: dict[str, object]) -> List[str]:
    title = str(item.get("title") or "").strip()
    if not title:
        return []
    url = str(item.get("url") or "").strip()
    summary = str(item.get("summary") or "").strip()
    region = str(item.get("region") or "Global")
    impact = str(item.get("impact") or "")
    themes = item.get("themes") or []
    theme_list = [str(theme) for theme in themes if isinstance(theme, str) and theme.strip()]
    meta_parts = [part for part in [impact, *theme_list[:2]] if part]
    meta_suffix = f"｜{'｜'.join(meta_parts)}" if meta_parts else ""

    lines = [f"- [{region}] {title} {meta_suffix}".rstrip()]
    if summary:
        lines.append(f"  摘要：{summary}")
    if url:
        lines.append(f"  链接：{url}")
    return lines


def load_email_settings() -> dict[str, object]:
    overrides = get_config(
        [
            "EMAIL_ENABLED",
            "SMTP_HOST",
            "SMTP_PORT",
            "SMTP_USERNAME",
            "SMTP_PASSWORD",
            "SMTP_FROM_EMAIL",
        ]
    )
    email_enabled = overrides.get("EMAIL_ENABLED")
    if isinstance(email_enabled, str):
        email_enabled_bool = email_enabled.lower() == "true"
    else:
        email_enabled_bool = settings.email_enabled

    smtp_port_value = overrides.get("SMTP_PORT")
    try:
        smtp_port = int(smtp_port_value) if smtp_port_value is not None else settings.smtp_port
    except ValueError:
        smtp_port = settings.smtp_port

    return {
        "email_enabled": email_enabled_bool,
        "smtp_host": overrides.get("SMTP_HOST") or settings.smtp_host,
        "smtp_port": smtp_port,
        "smtp_username": overrides.get("SMTP_USERNAME") or settings.smtp_username,
        "smtp_password": overrides.get("SMTP_PASSWORD") or settings.smtp_password,
        "smtp_from_email": overrides.get("SMTP_FROM_EMAIL") or settings.smtp_from_email,
    }


def send_email(config: dict[str, object], recipient: str, subject: str, body: str) -> tuple[bool, str]:
    smtp_host = config.get("smtp_host")
    smtp_port = config.get("smtp_port") or 587
    smtp_username = config.get("smtp_username")
    smtp_password = config.get("smtp_password")
    smtp_from_email = config.get("smtp_from_email") or smtp_username or "no-reply@example.com"

    if not smtp_host:
        return False, "未配置 SMTP_HOST"

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = smtp_from_email
    msg["To"] = recipient
    msg.set_content(body)

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            if smtp_username and smtp_password:
                server.login(str(smtp_username), str(smtp_password))
            server.send_message(msg)
        return True, "已发送"
    except Exception as exc:  # pragma: no cover
        return False, str(exc)


def run_once(verbose: bool = True) -> dict[str, object]:
    summary: dict[str, object] = {
        "email_enabled": False,
        "config": {},
        "results": [],
    }
    email_config = load_email_settings()
    summary["config"] = email_config
    if not email_config.get("email_enabled", False):
        if verbose:
            print("EMAIL_ENABLED 未开启，跳过通知发送。")
        return summary
    summary["email_enabled"] = True

    users = list_users()
    if not users:
        if verbose:
            print("没有订阅用户，跳过通知发送。")
        return summary

    for user in users:
        email = user["email"]
        coins = user.get("coins") or []
        if not coins:
            continue
        body = build_email_body(email, coins)
        success, message = send_email(
            email_config,
            email,
            "加密资产每日行情提醒",
            body,
        )
        summary["results"].append(
            {
                "email": email,
                "coins": coins,
                "success": success,
                "message": message,
            }
        )
        if verbose:
            outcome = "成功" if success else "失败"
            print(f"发送到 {email} {outcome}：{message}")

    return summary


if __name__ == "__main__":
    run_once(verbose=True)
