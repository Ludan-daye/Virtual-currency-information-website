# Frontend

基于 React + Vite + React Router 的可视化界面，负责渲染虚拟货币的实时健康数据与图表。首页提供核心币种概览与筛选，点击卡片可进入单币种的专业分析页面。完整说明见仓库根目录 `README.md`。

## 快速开始
```bash
npm install
cp .env.example .env
npm run dev
```

默认会从 `VITE_API_BASE_URL`（开发环境为 `http://localhost:14000`）获取数据，请确保后端服务已启动。
