# Crypto Health Intelligence

Crypto Health Intelligence 是一个一体化的虚拟资产市场情报平台，整合币种基础数据、健康指标、政策新闻以及宏观就业数据，并支持按主题聚合的邮件推送。项目包含 Flask 后端、React + Vite 前端，以及一个可复用的启动脚本。

## 功能亮点

- **核心币种监控**：追踪主流币的价格、24h 涨跌、健康分、流动性分与动量分，并支持多种计价货币。
- **市场概览**：展示总市值、占比、资金流向、趋势热搜以及 NFP（美国非农就业）时间序列。
- **政策资讯中心**：按“全球动荡”“世界局势”“能源市场”“市场稳定度”“政策动向”“政策观察”等主题自动分段，来自 CryptoCompare 的实时新闻，在缺少某一主题新闻时会智能补齐。
- **邮件订阅系统**：用户可订阅感兴趣的币种；每日推送包含币种简报、健康度、预测变化以及上述各主题的政策新闻，支持链接直达原文。
- **后台配置**：管理员可登录配置 SMTP、查看订阅者、手动触发邮件推送。

## 目录结构

```
backend/        Flask 应用、服务逻辑与任务脚本
frontend/       React/Vite 前端
start.sh        本地一键启动脚本
docs/           原型图与设计素材
```

## 快速开始（开发环境）

### 先决条件

- Python 3.10+
- Node.js 20（推荐配合 nvm，`start.sh` 会尝试自动切换）
- `pip`, `npm`

### 一键启动

```bash
./start.sh
```

脚本会在 `backend/.venv` 创建虚拟环境、安装后端依赖，拉取前端依赖，并分别启动 Flask API（默认 14000 端口）和前端开发服务器（默认 15173 端口）。如需覆盖端口或命令，可在执行前设置环境变量：

```bash
BACKEND_PORT=15000 FRONTEND_PORT=16000 ./start.sh
```

### 手动启动

1. **后端**

   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   export PORT=14000  # 可选
   python run.py
   ```

   Flask 应用会监听 `http://127.0.0.1:${PORT}`。可通过 `python send_notifications.py` 手动预览邮件摘要输出。

2. **前端**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   默认访问 `http://127.0.0.1:15173`，并通过 `VITE_API_BASE_URL` 与后端交互。

## 部署指南

部署分为后端 API、定时任务与前端静态资源三部分，可独立或组合部署。

### 后端（Flask + Gunicorn）

1. 安装依赖并构建虚拟环境：

   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. 设置环境变量（可通过 `.env`）：

   | 变量 | 说明 | 默认值 |
   | --- | --- | --- |
   | `PORT` | Flask 监听端口 | 14000 |
   | `DEFAULT_COINS` | 允许订阅的币种列表（逗号分隔，client 也依赖该值） | `bitcoin,ethereum,...` |
   | `DEFAULT_VS_CURRENCY` | 默认报价货币 | `usd` |
   | `REQUEST_TIMEOUT_SECONDS` | 数据源请求超时 | `12` |
   | `COINGECKO_BASE_URL` | CoinGecko API 地址 | `https://api.coingecko.com/api/v3` |
   | `POLICY_NEWS_ENDPOINT` | 政策新闻数据源 | `https://min-api.cryptocompare.com/data/v2/news/` |
   | `POLICY_NEWS_CATEGORIES` | 新闻分类过滤 | `Regulation,General,Market,Energy,Forex` |
   | `POLICY_NEWS_CACHE_TTL` | 新闻缓存时间（秒） | `300` |
   | `POLICY_NEWS_MAX_ITEMS` | 最多保留的新闻条数 | `24` |
   | `EMAIL_ENABLED` | 是否启用邮件推送 | `false` |
   | `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` / `SMTP_FROM_EMAIL` | SMTP 配置 | — |
   | `ADMIN_PASSWORD` | 后台登录密码 | `admin123` |
   | `ADMIN_JWT_SECRET` | 后台 JWT 密钥 | `crypto-health-intel-secret` |

3. 使用 Gunicorn（或其他 WSGI 服务器）部署：

   ```bash
   gunicorn --bind 0.0.0.0:${PORT:-14000} "app:create_app()"
   ```

   > `app:create_app` 在 `backend/app/__init__.py` 中定义。

4. 若需要 HTTPS 或反向代理，可在前面添加 Nginx/Traefik，并将 `VITE_API_BASE_URL` 指向外网地址。

### 邮件推送任务

`backend/send_notifications.py` 可直接运行，读取配置并发送订阅摘要。部署时建议：

- 在同一虚拟环境中执行：`python send_notifications.py`
- 结合 cron / systemd timer / Celery Beat 等调度机制，例如：

  ```cron
  0 8 * * * /path/to/backend/.venv/bin/python /path/to/backend/send_notifications.py >> /var/log/crypto-digest.log 2>&1
  ```

脚本会输出发送结果（成功/失败邮箱列表）以便排查。

### 前端（Vite 构建）

1. 安装依赖并构建：

   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. 输出内容位于 `frontend/dist`，可使用 Nginx/Netlify/Vercel 等任意静态托管。

3. 部署时需要设置 `VITE_API_BASE_URL` 指向后端公网地址：

   ```bash
   VITE_API_BASE_URL=https://api.example.com npm run build
   ```

4. 若使用容器部署，可将 `dist` 目录复制至静态站点镜像，或使用多阶段 Dockerfile（自行扩展）。

### 参考 Docker 化思路（可选）

项目暂未包含 Dockerfile，可按以下思路自行扩展：

- **后端镜像**：基于 `python:3.11-slim`，复制 `backend/`，安装 requirements，设置 Gunicorn Entrypoint。
- **前端镜像**：基于 `node:20-alpine` 构建，再复制至 `nginx:alpine` 作为静态资源。
- 使用 `docker-compose` 或 K8s 编排时，确保服务间通过环境变量共享 API 地址。

## 常用 API

| 方法 | 路径 | 功能 |
| --- | --- | --- |
| `GET /api/coins` | 获取选定币种的实时指标 |
| `GET /api/coins/<id>/history` | 指定币种的历史价格（支持 `timeframe`） |
| `GET /api/market/overview` | 市场概况、趋势热搜、占比等 |
| `GET /api/news/policies` | 按主题聚合后的政策新闻 |
| `GET /api/macro/nfp` | 美国非农就业指标时间序列 |
| `POST /api/users/subscriptions` | 创建/更新订阅（邮箱 + 币种数组） |
| `POST /api/admin/login` | 管理员登录，返回 JWT |
| `GET /api/admin/config` | 获取 SMTP/邮件配置（需要 Bearer Token） |
| `PUT /api/admin/config` | 更新配置 |
| `GET /api/admin/subscribers` | 订阅用户列表 |
| `POST /api/admin/notifications/send` | 手动触发邮件推送 |

## 邮件内容结构

- 订阅者问候语与提醒
- 每个订阅币种的：
  - 实时价格与 24h 涨跌
  - 综合健康分、流动性、动量分
  - 预测变化（如可计算）
- **政策热点摘要**：
  - “全球动荡观察”“世界局势脉络”“能源市场焦点”“市场稳定度速览”“政策动向追踪”“政策观察”等分区
  - 每条包含地区、标题、主题标签、摘要与原文链接
- 自动生成的结束语

## 贡献指南

1. Fork & Clone 项目
2. 创建虚拟环境和前端依赖
3. 提交前请运行必要的格式化 / lint（`npm run lint`）
4. 通过 Pull Request 提交，建议附带变更说明与截图（若涉及 UI）

## 数据来源

- [CoinGecko API](https://www.coingecko.com/en/api) — 市场数据与健康指标
  - 建议在部署前申请 API Key 并根据限制设置缓存
- [CryptoCompare News API](https://min-api.cryptocompare.com/) — 政策与市场新闻
- 美国劳工部公开数据 — NFP 指标（已通过服务封装）

## 许可证

本项目采用 [MIT License](./LICENSE)。
