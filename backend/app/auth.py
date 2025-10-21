from __future__ import annotations

import datetime
from functools import wraps
from typing import Callable, TypeVar

import jwt
from flask import Request, jsonify, request

from app.config import settings

T = TypeVar("T")


class AuthError(Exception):
    pass


def _get_admin_password() -> str:
    if not settings.admin_password:
        raise AuthError("ADMIN_PASSWORD 未配置，无法登录后台")
    return settings.admin_password


def generate_admin_token() -> str:
    secret = settings.admin_jwt_secret
    if not secret:
        raise AuthError("ADMIN_JWT_SECRET 未配置，无法签发令牌")

    payload = {
        "role": "admin",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def verify_admin_token(token: str) -> None:
    secret = settings.admin_jwt_secret
    if not secret:
        raise AuthError("ADMIN_JWT_SECRET 未配置")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        if payload.get("role") != "admin":
            raise AuthError("无效的角色")
    except jwt.ExpiredSignatureError as exc:
        raise AuthError("令牌已过期，请重新登录") from exc
    except jwt.PyJWTError as exc:
        raise AuthError("令牌校验失败") from exc


def require_admin(fn: Callable[..., T]) -> Callable[..., T]:
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"message": "缺少授权信息"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            verify_admin_token(token)
        except AuthError as exc:
            return jsonify({"message": str(exc)}), 401
        return fn(*args, **kwargs)

    return wrapper


def authenticate_admin(password: str) -> bool:
    expected = _get_admin_password()
    return password == expected
