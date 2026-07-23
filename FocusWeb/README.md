# FocusWeb

Tempo 项目的 Web 端 —— React + Vite + TypeScript + Ant Design 单页应用，与 [FocusLab](../FocusLab) 小程序共享同一后端（[DayCraft](../DayCraft)）和同一份数据（同 openid = 同用户）。

## 技术栈

- React 18 + Vite 5 + TypeScript 5
- Ant Design 5（响应式布局：桌面侧边栏 / 窄屏底部 Tab）
- react-router-dom 6、recharts 2（汇总页图表）
- Vitest（单元）+ Playwright（E2E）

## 页面

今日 / 待办 / 目标 / 专注（番茄钟）/ 汇总（统计卡 + 近 7 天专注柱状图 + AI 汇总）/ 分类 / 登录。桌面端增强：批量操作、键盘快捷键（`N` 跳今日新建）。

## 开发

```bash
cd FocusWeb
npm install
npm run dev      # http://localhost:3000，Vite 代理 /api → localhost:8081
npm test         # Vitest 单元测试
npm run test:e2e # Playwright（需后端 :8081 运行且启用 WX_MOCK_OPENID）
npm run build    # 生产构建 → dist/
```

开发模式登录走「一键 Mock 登录」旁路（需后端 `WX_MOCK_OPENID` 非空）。

## 生产部署

docker compose 的 `web` 服务：多阶段构建（node 构建产物 → nginx 托管），nginx 同源托管 SPA 并反代 `/api` 到 `daycraft` 容器（零 CORS）。

```bash
cd .. && docker compose up -d web   # 连同 mysql/redis/daycraft 一起
```

微信网页扫码登录（生产）需在 `FocusWeb/.env` 设置 `VITE_WX_APPID` / `VITE_WX_REDIRECT_URI`（见 `.env.example`），并在后端配置真实 `WX_APPID`/`WX_SECRET` + 开放平台网页授权资质。

## 文档

- 设计：`docs/superpowers/specs/2026-07-23-focusweb-design.md`
- 实施计划：`docs/superpowers/plans/2026-07-23-focusweb.md`
- 项目手册：根目录 `CLAUDE.md` 的「FocusWeb（Web 端）」章节
