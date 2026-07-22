# FocusWeb 设计文档

- **日期**：2026-07-23
- **状态**：已批准，待出实现计划
- **目标**：为 Tempo 新增 Web 端，复刻 FocusLab 小程序的全部功能，数据与小程序互通，桌面端做生产力增强。

---

## 1. 背景

Tempo 当前两端：
- **DayCraft**：SpringBoot 3.2 + MyBatis-Plus + MySQL 8 + Redis 7 后端，JWT 鉴权。
- **FocusLab**：原生微信小程序，7 页面，底部 TabBar。

用户希望增加 Web 版。Web 版与小程序**同一份数据、同一个用户**，桌面端利用大屏 + 键盘做生产力增强。

核心矛盾：小程序鉴权走 `wx.login()` → code → 后端换 openid。**Web 没有 `wx.login`**，必须另开鉴权路径。

---

## 2. 已定决策（brainstorming 结论）

| 决策点 | 选定 | 备选（未选） |
|--------|------|-------------|
| 整体形态 | **C 响应式**：桌面侧边栏 / 窄屏底部 Tab | A 纯桌面仪表盘、B 复刻手机 |
| 账号体系 | **数据互通**，目标微信网页扫码 OAuth | 独立账号、账密绑定 |
| 前端栈 | **React + Vite + TypeScript + Ant Design** | Vue 3 + Element Plus、原生 |
| 功能范围 | **7 页全对齐 + 3 桌面增强** | 只对齐、砍页 |
| 部署 | **独立 `FocusWeb/` + Nginx 反代**，生产同源 | 塞进 DayCraft static、独立仓库 |

**桌面 3 增强**：汇总页 AntD 图表、待办/目标批量操作、键盘快捷键（N 新建 / 空格完成 / / 搜索）。

---

## 3. 架构

```
Tempo/
├── DayCraft/          后端（不变 + 2 个 web 鉴权端点）
├── FocusLab/          小程序（不变）
├── FocusWeb/          ★ 新：React + Vite + TS + AntD
└── docker-compose.yml  新增 web(nginx) 服务
```

### 请求流
- **开发**：浏览器 → Vite dev server `:3000` → `vite.config.ts` 代理 `/api` → daycraft `:8081`
- **生产**：浏览器 → nginx `:80` → 静态资源；`/api/*` 反代 → `daycraft:8080`。**同源，零 CORS**

### 同源好处
生产 nginx 既托管前端静态、又反代 `/api`，前端与后端同源，免除 CORS 预检与跨域 cookie 问题。开发期靠 Vite proxy 模拟同源。

---

## 4. FocusWeb 目录结构

```
FocusWeb/
├── index.html
├── vite.config.ts          # proxy /api → http://localhost:8081
├── tsconfig.json
├── package.json
├── nginx.conf              # 生产：托管静态 + 反代 /api
├── Dockerfile              # 多阶段：node build → nginx serve
└── src/
    ├── main.tsx
    ├── App.tsx             # 路由 + 全局错误边界
    ├── api/
    │   ├── client.ts       # fetch 封装（= FocusLab utils/request.js 语义）
    │   └── index.ts        # auth/todo/goal/focus/category/summary（= utils/api.js）
    ├── store/
    │   └── auth.ts         # token/userInfo → localStorage（= wx.getStorageSync）
    ├── hooks/              # useTodos/useGoals/useFocus… + useKeyboardShortcuts
    ├── components/         # StatCard / TodoItem / GoalCard / CountdownTimer / Charts
    ├── layouts/
    │   └── AppLayout.tsx   # ProLayout：桌面侧边栏 ↔ 窄屏底部 Tab
    ├── pages/
    │   ├── login/          # 扫码（prod）/ 一键 mock（dev）
    │   ├── today/          # 今日：统计卡 + 双栏列表
    │   ├── todo/           # 待办：ProTable + 批量
    │   ├── goal/           # 目标：进度 + 批量
    │   ├── focus/          # 专注：番茄钟
    │   ├── summary/        # 汇总：AntD Charts（增强）
    │   └── category/       # 分类：表格内联编辑
    ├── types/              # 对齐后端 DTO/VO
    └── utils/              # filterNulls 等
tests/
├── unit/                   # Vitest
└── e2e/                    # Playwright
```

---

## 5. 页面与 API 映射

复用 DayCraft 全部 REST API，**业务逻辑零改动**（仅鉴权加端点）。

| 页面 | 路由 | 数据源 API | 桌面增强 |
|------|------|-----------|---------|
| 登录 | `/login` | `POST /api/auth/web-mock-login`（dev）/ `POST /api/auth/web-oauth/callback`（prod） | — |
| 今日 | `/today` | `GET /api/todos/today`、`GET /api/todos/statistics` | 统计卡、待办/已完成双栏、快捷键 `N` 新建 |
| 待办 | `/todos` | `GET/POST/PUT/PATCH/DELETE /api/todos`、`/finish`、`/statistics` | ProTable 多选 → 批量完成/删除/改分类 |
| 目标 | `/goals` | `GET/POST/PUT/PATCH/DELETE /api/goals`、`/progress`、`/finish` | 多选批量、进度条 |
| 专注 | `/focus` | `POST /api/focus/record`、`GET /api/focus/daily-stats` | 番茄钟计时器（桌面亦可用） |
| 汇总 | `/summary` | `GET /api/summary/weekly`、`/monthly`、`POST /generate` | **AntD 趋势线 / 专注时长分布图** |
| 分类 | `/categories` | `GET/POST/PUT/DELETE /api/categories` | 表格内联编辑 |

### 统一响应处理
后端返回 `R<T>`（`{code, msg, data}`）。`client.ts` 解包：
- `code === 200` → resolve `data`
- `code === 401` → 清 localStorage → 跳 `/login`（等价小程序 `reLaunch('/pages/login/login')`）
- 其他 → AntD `message.error(msg)` → reject

---

## 6. 鉴权设计

### 开发期（mock）
1. 登录页展示「一键 mock 登录」按钮。
2. `POST /api/auth/web-mock-login`（无 body）。
3. 后端仅当 `WX_MOCK_OPENID` 非空时可用：按该 openid 查/建 `t_user`，`JwtUtil.generateToken(userId)` 发 JWT。
4. 前端存 token + userInfo 到 localStorage，跳 `/today`。

> 复用现有 `WX_MOCK_OPENID` 开发旁路机制（见 CLAUDE.md AD-07），与小程序 dev 同一套 mock 用户，数据互通可见。

### 生产期（微信网页 OAuth）
1. 登录页引导微信扫码（微信开放平台「网页授权」OAuth2）。
2. 微信回调带 `code` 到前端 `/login?code=xxx`。
3. 前端 `POST /api/auth/web-oauth/callback` `{ code }`。
4. 后端 `WxApiUtil` 新增方法：用 code 调微信 `oauth2/access_token` → 拿 **openid**。
5. 复用 `AuthService.login` 核心逻辑：按 openid 查/建 `t_user`，发 JWT。
6. 前端存 token，跳 `/today`。

> 生产要求：微信开放平台/公众号网页授权资质 + 备案域名 + `WX_APPID`/`WX_SECRET`。与小程序同 openid 体系 → **同一用户、同一份数据**。

### 请求注入
所有受保护请求 `client.ts` 自动加 `Authorization: Bearer <token>`。

---

## 7. 后端改动（DayCraft）

| 文件 | 改动 |
|------|------|
| `AuthController` | +`POST /api/auth/web-mock-login`、+`POST /api/auth/web-oauth/callback` |
| `AuthService` / `AuthServiceImpl` | 抽出「按 openid 查/建 user + 发 token」为可复用方法，供 web 两端点调用 |
| `WxApiUtil` | +网页 OAuth `code → openid` 方法（调 `oauth2/access_token`） |
| `WebConfig` | `excludePathPatterns` 追加 `/api/auth/web-mock-login`、`/api/auth/web-oauth/callback` |
| `WebConfig` CORS | 默认值追加 `http://localhost:3000`（dev；生产同源免 CORS） |
| DTO/VO | 复用现有 `LoginVO`；新增轻量请求 DTO（如 `WebOAuthDTO{code}`） |

**约束**：`web-mock-login` 端点必须在 `WX_MOCK_OPENID` 为空时直接拒绝（抛 `BusinessException`），生产留空即自动禁用。

---

## 8. 错误处理

- **网络层**（`client.ts`）：fetch reject / 超时 → `message.error('网络异常，请重试')`。
- **业务层**：`R.code !== 200` → `message.error(R.msg)`。
- **鉴权失效**：`R.code === 401` → 清 storage → 跳 `/login`。
- **页面层**：每个数据加载 `try/catch` + AntD `Skeleton`/`Spin` loading 态，失败展示 `Result` 错误态 + 重试。
- **全局**：`App.tsx` React Error Boundary 兜底渲染异常。

---

## 9. 测试策略

| 层 | 工具 | 覆盖 |
|----|------|------|
| 前端单测 | Vitest + jsdom | `api/client.ts`（mock fetch，验证 R 解包/401 跳转/Bearer 注入）、`hooks`、`utils/filterNulls`、键盘快捷键 |
| 前端 E2E | Playwright | 登录 → 今日 → 新建待办 → 完成 → 汇总查看，覆盖关键流（对齐小程序 E2E 精神） |
| 后端单测 | MockMvc | `web-mock-login`（mock 开关）、`web-oauth/callback`（mock `WxApiUtil`） |

不强制 80% 覆盖率门槛用于首版脚手架，但 `client.ts` 与 `filterNulls` 必须有测试（历史 bug 源头）。

---

## 10. 部署

### docker-compose 新增 `web` 服务
```yaml
web:
  build:
    context: ./FocusWeb
  ports:
    - "80:80"          # 宿主 80 → 容器 80
  depends_on:
    - daycraft
  restart: unless-stopped
```

### FocusWeb/Dockerfile（多阶段）
```dockerfile
# stage 1: build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build      # → dist/

# stage 2: serve
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
```

### FocusWeb/nginx.conf
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # API 反代到后端（同源）
    location /api/ {
        proxy_pass http://daycraft:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA history fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 启动
```bash
cd FocusWeb && npm install && npm run build     # 本地构建验证
cd .. && docker compose build web && docker compose up -d web
curl http://localhost/                          # 200 + index.html
curl http://localhost/api/actuator/health       # 透传 {"status":"UP"}
```

> 端口：复用 CLAUDE.md 端口表。web 占宿主 80（若冲突可改 8082:80）。

---

## 11. 不做（YAGNI）

- SSR / Next.js（SPA 够用）
- i18n（与小程序一致，纯中文）
- PWA / 离线缓存
- 修改 FocusLab 小程序（互不干扰）
- 账号密码体系（已选 OAuth 路线）
- 微信开放平台资质申请（属运维/商务，不在代码范围；prod OAuth 端点先实现，资质就绪即可用）

---

## 12. 验收标准

- `cd FocusWeb && npm run build` 零错误
- `npm test`（Vitest）全绿，`client.ts`/`filterNulls` 有用例
- `npx playwright test` E2E 关键流通过
- `docker compose up -d` 四服务 healthy（mysql/redis/daycraft/web）
- `curl http://localhost/` 返回前端；`/api/actuator/health` 透传 UP
- dev mock 登录 → 今日页 → 新建待办，刷新仍可见（数据互通）
- 后端 `mvn clean package -DskipTests` 零错误

---

## 13. 风险与对策

| 风险 | 对策 |
|------|------|
| 微信网页 OAuth 需资质 + 备案 | dev 用 mock 端点跑通全流程；prod 端点先就绪，资质到位即切换 |
| 宿主 80 端口被占 | docker-compose 映射可改 `8082:80`，文档注明 |
| GET 参数 null 序列化（小程序历史 bug） | `client.ts` 沿用 `filterNulls`，单测覆盖 |
| 桌面/窄屏布局断裂 | ProLayout 响应式 + Playwright 多视口截图测试 |
