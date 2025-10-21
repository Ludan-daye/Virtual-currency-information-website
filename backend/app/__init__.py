from __future__ import annotations

import time
from flask import Flask, jsonify
from flask_cors import CORS

from app.config import settings
from app.routes import api
from app.db import init_db, purge_expired_cache
from app.utils.errors import HttpError


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"*": {"origins": "*"}})

    init_db()
    purge_expired_cache(settings.api_cache_max_age_seconds)

    start_time = time.time()

    @app.get("/healthz")
    def healthcheck():
        uptime = time.time() - start_time
        return jsonify({"status": "ok", "uptime": uptime})

    app.register_blueprint(api, url_prefix="/api")

    @app.errorhandler(HttpError)
    def handle_http_error(error: HttpError):
        return jsonify({"message": str(error)}), error.status_code

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        return jsonify({"message": str(error)}), 500

    return app


app = create_app()
