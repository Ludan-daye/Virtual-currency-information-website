#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

BACKEND_PORT="${BACKEND_PORT:-14000}"
FRONTEND_PORT="${FRONTEND_PORT:-15173}"
API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:${BACKEND_PORT}}"

PYTHON_BIN="${PYTHON_BIN:-python3}"
NODE_BIN_DEFAULT="node"
NPM_BIN_DEFAULT="npm"

if [[ -z "${NVM_LOADED:-}" && -s "${HOME}/.nvm/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "${HOME}/.nvm/nvm.sh"
  NVM_LOADED=1
fi

if command -v nvm >/dev/null 2>&1; then
  if [[ -n "${NODE_VERSION_OVERRIDE:-}" ]]; then
    nvm use "${NODE_VERSION_OVERRIDE}" >/dev/null 2>&1 || true
  else
    nvm use --silent 20 >/dev/null 2>&1 || true
  fi
fi

NODE_BIN="${NODE_BIN:-${NODE_BIN_DEFAULT}}"
NPM_BIN="${NPM_BIN:-${NPM_BIN_DEFAULT}}"

function ensure_command() {
  local bin_name="$1"
  local friendly_name="$2"
  if ! command -v "${bin_name}" >/dev/null 2>&1; then
    echo "❌ 未找到 ${friendly_name} (${bin_name})，请先安装后重试。" >&2
    exit 1
  fi
}

ensure_command "${PYTHON_BIN}" "Python 3"
ensure_command "${NODE_BIN}" "Node.js"
ensure_command "${NPM_BIN}" "npm"

# 提醒 Node 版本
NODE_VERSION="$("${NODE_BIN}" -v || echo "unknown")"
REQUIRED_NODE_MAJOR=20
NODE_MAJOR="$(echo "${NODE_VERSION}" | sed -E 's/v([0-9]+).*/\1/')"
if [[ "${NODE_MAJOR}" =~ ^[0-9]+$ ]] && (( NODE_MAJOR < REQUIRED_NODE_MAJOR )); then
  echo "⚠️  当前 Node 版本为 ${NODE_VERSION}，建议切换到 >= v20 以保证 Vite 正常运行。" >&2
fi

# 准备 backend 虚拟环境
if [[ ! -d "${BACKEND_DIR}/.venv" ]]; then
  echo "⚙️  创建 Python 虚拟环境..."
  "${PYTHON_BIN}" -m venv "${BACKEND_DIR}/.venv"
fi

source "${BACKEND_DIR}/.venv/bin/activate"
pip install -r "${BACKEND_DIR}/requirements.txt" >/tmp/backend_pip_install.log 2>&1 || {
  echo "❌ 安装后端依赖失败，详情见 /tmp/backend_pip_install.log" >&2
  deactivate
  exit 1
}

if [[ ! -f "${BACKEND_DIR}/.env" ]]; then
  cp "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env"
fi

echo "🚀 启动 Flask 后端 (端口 ${BACKEND_PORT})..."
PORT="${BACKEND_PORT}" python "${BACKEND_DIR}/run.py" >/tmp/backend_run.log 2>&1 &
BACKEND_PID=$!

deactivate

function cleanup() {
  echo
  echo "🛑 停止服务..."
  if ps -p "${BACKEND_PID}" >/dev/null 2>&1; then
    kill "${BACKEND_PID}" >/dev/null 2>&1 || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]] && ps -p "${FRONTEND_PID}" >/dev/null 2>&1; then
    kill "${FRONTEND_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

sleep 2

if ! ps -p "${BACKEND_PID}" >/dev/null 2>&1; then
  echo "❌ 后端启动失败，日志位于 /tmp/backend_run.log" >&2
  exit 1
fi

echo "✅ 后端就绪：${API_BASE_URL}/healthz"

# 准备前端依赖
cd "${FRONTEND_DIR}"
if [[ ! -f ".env" ]]; then
  cp ".env.example" ".env"
fi

echo "⚙️  安装前端依赖..."
"${NPM_BIN}" install >/tmp/frontend_npm_install.log 2>&1 || {
  echo "❌ 安装前端依赖失败，详情见 /tmp/frontend_npm_install.log" >&2
  exit 1
}

echo "🚀 启动 Vite 前端 (端口 ${FRONTEND_PORT})..."
VITE_API_BASE_URL="${API_BASE_URL}" "${NPM_BIN}" run dev -- --host 127.0.0.1 --port "${FRONTEND_PORT}" >/tmp/frontend_run.log 2>&1 &
FRONTEND_PID=$!

sleep 2

if ! ps -p "${FRONTEND_PID}" >/dev/null 2>&1; then
  echo "❌ 前端启动失败，日志位于 /tmp/frontend_run.log" >&2
  exit 1
fi

echo
echo "✨ 服务已经就绪："
echo "  • 后端 API:    ${API_BASE_URL}"
echo "  • 前端页面:    http://127.0.0.1:${FRONTEND_PORT}"
echo
echo "按 Ctrl+C 可同时停止前后端服务。"

wait "${FRONTEND_PID}"
