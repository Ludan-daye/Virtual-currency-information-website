from __future__ import annotations

import re
from flask import Blueprint, jsonify, request

from app.services.metrics import (
    get_coin_history,
    get_coins_with_metrics,
    get_market_overview,
)
from app.services.policy_news import get_policy_news
from app.services.macro import get_nfp_series
from app.utils.errors import HttpError
from app.db import upsert_user, get_user, list_users, upsert_config, get_config
from app.config import settings
from send_notifications import run_once as run_email_digest
from app.auth import (
    authenticate_admin,
    generate_admin_token,
    require_admin,
    AuthError,
)

api = Blueprint("api", __name__)

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@api.route("/coins", methods=["GET"])
def coins() -> tuple:
    ids_param = request.args.get("ids")
    ids = ids_param.split(",") if ids_param else None
    vs_currency = request.args.get("vs_currency")
    include_details = request.args.get("include_details", "true").lower() != "false"

    try:
        data = get_coins_with_metrics(ids=ids, vs_currency=vs_currency, include_details=include_details)
    except HttpError as exc:
        return jsonify({"message": str(exc)}), exc.status_code
    return jsonify(data)


@api.route("/coins/<string:coin_id>/history", methods=["GET"])
def coin_history(coin_id: str) -> tuple:
    timeframe = request.args.get("timeframe", "30D")
    vs_currency = request.args.get("vs_currency")

    try:
        history = get_coin_history(coin_id, timeframe, vs_currency=vs_currency)
    except HttpError as exc:
        return jsonify({"message": str(exc)}), exc.status_code
    return jsonify(history)


@api.route("/market/overview", methods=["GET"])
def market_overview() -> tuple:
    vs_currency = request.args.get("vs_currency")
    try:
        overview = get_market_overview(vs_currency)
    except HttpError as exc:
        return jsonify({"message": str(exc)}), exc.status_code
    return jsonify(overview)


@api.route("/news/policies", methods=["GET"])
def policy_news() -> tuple:
    news = get_policy_news()
    return jsonify(news)


@api.route("/macro/nfp", methods=["GET"])
def macro_nfp() -> tuple:
    return jsonify(get_nfp_series())


def _normalize_coins(coins) -> list[str]:
    if coins is None:
        return []
    if isinstance(coins, str):
        coins_list = coins.split(",")
    else:
        coins_list = list(coins)
    return [coin.strip().lower() for coin in coins_list if coin and coin.strip()]


@api.route("/users/subscriptions", methods=["POST"])
def create_subscription() -> tuple:
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    coins = _normalize_coins(payload.get("coins"))

    if not email or not EMAIL_PATTERN.match(email):
        return jsonify({"message": "无效的邮箱地址"}), 400
    if not coins:
        return jsonify({"message": "请至少选择一个币种"}), 400

    allowed = set(settings.default_coins)
    invalid = [coin for coin in coins if coin not in allowed]
    if invalid:
        return jsonify({"message": f"不支持的币种: {', '.join(invalid)}"}), 400

    try:
        upsert_user(email, coins)
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400

    return jsonify({"email": email, "coins": coins}), 200


@api.route("/admin/subscribers", methods=["GET"])
@require_admin
def list_subscriptions() -> tuple:
    data = list_users()
    return jsonify(data)


@api.route("/users/subscriptions/<path:email>", methods=["GET"])
def get_subscription(email: str) -> tuple:
    user = get_user(email)
    if not user:
        return jsonify({"message": "订阅不存在"}), 404
    return jsonify(user)
CONFIG_KEYS = [
    "EMAIL_ENABLED",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USERNAME",
    "SMTP_PASSWORD",
    "SMTP_FROM_EMAIL",
]


@api.route("/admin/login", methods=["POST"])
def admin_login() -> tuple:
    data = request.get_json(silent=True) or {}
    password = str(data.get("password") or "")
    try:
        if not authenticate_admin(password):
            return jsonify({"message": "密码错误"}), 401
        token = generate_admin_token()
        return jsonify({"token": token})
    except AuthError as exc:
        return jsonify({"message": str(exc)}), 400


@api.route("/admin/config", methods=["GET"])
@require_admin
def admin_get_config() -> tuple:
    data = get_config(CONFIG_KEYS)
    response = {key: data.get(key) for key in CONFIG_KEYS}
    return jsonify(response)


@api.route("/admin/config", methods=["PUT"])
@require_admin
def admin_update_config() -> tuple:
    payload = request.get_json(silent=True) or {}
    entries: dict[str, str] = {}
    for key in CONFIG_KEYS:
        if key in payload:
            value = payload[key]
            if isinstance(value, bool):
                entries[key] = "true" if value else "false"
            else:
                entries[key] = str(value)
    if entries:
        upsert_config(entries)
    data = get_config(CONFIG_KEYS)
    response = {key: data.get(key) for key in CONFIG_KEYS}
    return jsonify(response)


@api.route("/admin/notifications/send", methods=["POST"])
@require_admin
def admin_send_notifications() -> tuple:
    summary = run_email_digest(verbose=False)
    return jsonify(summary)
