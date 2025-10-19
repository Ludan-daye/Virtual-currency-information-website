from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.services.metrics import (
    get_coin_history,
    get_coins_with_metrics,
    get_market_overview,
)
from app.services.policy_news import get_policy_news
from app.services.macro import get_nfp_series
from app.utils.errors import HttpError

api = Blueprint("api", __name__)


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
