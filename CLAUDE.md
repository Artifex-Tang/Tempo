# Tempo Project — Claude Code 工作手册

## 项目概述

Tempo 是个人事务管理系统，分为两个独立仓库：
- **DayCraft**：后端服务，SpringBoot 3 + MyBatis-Plus + MySQL 8 + Redis 7
- **FocusLab**：前端微信小程序，原生 WXML，基于 Focus-clock 改造

## 仓库结构

```
Tempo/
├── DayCraft/           后端
├── FocusLab/           前端小程序
├── FocusWeb/           前端 Web（React+Vite+TS+AntD）
├── docs/               测试说明.md + 测试报告.md
├── docker-compose.yml  全栈编排
└── .env.example        环境变量模板
```

---

## 技术栈约束（必须遵守）

### 后端 DayCraft
- Java 17，SpringBoot **3.2.x**，绝对不用 2.x API
- ORM：MyBatis-Plus 3.5.x，禁止使用 JPA/Hibernate
- 数据库：MySQL 8.0，字符集 utf8mb4
- 缓存：Spring Data Redis + Jackson 序列化
- 鉴权：JWT（jjwt 0.12.x），无 Spring Security
- 定时：`@Scheduled` 注解，无需 Quartz XML 配置
- API 文档：Knife4j 4.x（OpenAPI 3）
- 包名：`com.tempo.daycraft`，模块分层严格按 controller/service/mapper/entity/dto/vo
- 统一响应体：`R<T>`，字段 code/msg/data
- 异常：业务异常统一用 `BusinessException`，全局 `GlobalExceptionHandler` 处理

### 前端 FocusLab
- 原生微信小程序，**不使用** uni-app、Taro、mpvue 等框架
- UI 库：WeUI（通过 app.json useExtendedLib 引入）
- 网络请求：统一走 `utils/request.js`，页面禁止直接调用 `wx.request`
- API 调用：统一走 `utils/api.js`，页面只 require 这个文件
- 样式：CSS 变量定义在 `app.wxss`，页面继承，不重复定义颜色值
- 登录：静默登录，`app.js` onLaunch 自动执行

---

## 代码规范

### 命名
- Java：类名 PascalCase，方法/变量 camelCase，常量 UPPER_SNAKE_CASE
- JS：变量/函数 camelCase，常量 UPPER_SNAKE_CASE
- 数据库表名：`t_` 前缀，字段名 snake_case

### 注释
- 每个 Controller 方法必须有 `@Operation(summary = "...")` Swagger 注解
- 关键业务逻辑必须有行内注释，说明"为什么"而不是"做什么"
- 复杂 SQL 必须有注释说明查询意图

### 错误处理
- 后端：所有 Service 方法用 try-catch 或抛 BusinessException，禁止吞掉异常
- 前端：所有 await 调用加 try-catch 或 .catch()，网络错误统一在 request.js 处理

### 前端网络请求规范（从 bug 中提炼）
- `request.js` GET 请求必须过滤 null/undefined 参数：`filterNulls()`；否则 WeChat 将 null 序列化为字符串 `"null"` 传给 Spring，导致 `Integer` 解析 400 失败
- `request.js BASE_URL` 当前为 `http://localhost:8081`（Docker 映射端口）
- PowerShell 发请求含中文必须用 `[System.Text.Encoding]::UTF8.GetBytes(body)` 编码，否则汉字存为 `??????`

---

## 数据库表清单

| 表名 | 说明 |
|------|------|
| t_user | 用户（openid 唯一索引） |
| t_category | 任务分类（user_id + name 联合唯一） |
| t_todo | 待办任务（remind_time + remind_sent 索引供定时任务查询） |
| t_goal | 目标计划 |
| t_focus_record | 专注记录 |
| t_summary | 周报/月报汇总 |

---

## 环境变量（运行时注入）

```
DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
REDIS_HOST / REDIS_PORT / REDIS_PASSWORD
WX_APPID / WX_SECRET / WX_TEMPLATE_ID
JWT_SECRET（≥32位随机字符串）
AI_ENABLED / AI_API_KEY / AI_API_URL
SPRING_PROFILES_ACTIVE（dev|prod）
WX_MOCK_OPENID（开发旁路，生产必须留空）
```

---

## 本地运行环境（已实测确认）

### 端口分配
| 服务 | 容器端口 | 宿主机映射 | 备注 |
|------|---------|-----------|------|
| DayCraft API | 8080 | **8081** | 8080 被 Docker Desktop 占用 |
| MySQL | 3306 | **3308** | 3306/3307 被其他项目占用 |
| Redis | 6379 | **6381** | 6379/6380 被其他项目占用 |
| Web (FocusWeb) | 80 | 80 | nginx 托管 SPA + 反代 /api |

### 启动命令
```bash
# 构建并启动全栈
cd DayCraft && mvn clean package "-DskipTests=true" -q
cd .. && docker compose build && docker compose up -d

# 健康检查
curl http://localhost:8081/actuator/health

# 重启单个服务（代码变更后）
docker compose build daycraft && docker compose up -d daycraft

# 直连数据库（本地 mysql 客户端或 Workbench）
# host=127.0.0.1  port=3308  user=tempo  pass=tempo_local_2024  db=tempo
# host=127.0.0.1  port=6381  （Redis，无密码）
```

### Knife4j 文档
`http://localhost:8081/doc.html`

---

## 架构决策记录

### AD-01：Dockerfile 改为单阶段（预编译 JAR）
**原因**：多阶段构建的 Maven stage 在容器内无法访问 Maven Central（网络限制），`dependency:go-offline` 超时失败。  
**方案**：本地先 `mvn package`，Dockerfile 只 COPY `target/*.jar`，单阶段运行。  
**影响**：每次代码变更需先本地构建再 `docker compose build`。

### AD-02：JDBC 字符集 `UTF-8` 而非 `utf8mb4`
**原因**：MySQL Connector/J 不识别 `utf8mb4` 作为 Java charset 名，连接时抛 `UnsupportedEncodingException`，中文数据全部存为 `??????`。  
**方案**：JDBC URL 使用 `characterEncoding=UTF-8`；数据库和表仍为 utf8mb4，驱动自动处理。

### AD-03：CORS `@Value` 不能注入 YAML 序列
**原因**：`@Value("${tempo.cors.allowed-origins}")` 无法绑定 YAML 列表格式。  
**方案**：`application-custom.yml` 改用逗号分隔字符串 `"http://localhost:3000,http://localhost:8081"`，`@Value` 加默认值兜底。

### AD-04：微信小程序 E2E 测试连接方式
**原因**：`miniprogram-automator.launch()` 在 Windows 上用 `child_process.spawn` 运行 `.bat` 文件，Node.js 不自动 shell 化，进程立即退出，WebSocket 永远不打开。  
**方案**：
1. 通过 `cli.bat islogin` 解析输出获取当前 DevTools HTTP 端口（每次启动动态变化）
2. 调用 `GET /v2/auto?project=<path>&port=9090` 开启自动化 WebSocket
3. 用 `automator.connect({ wsEndpoint: 'ws://127.0.0.1:9090' })` 连接（而非 `launch()`）

### AD-05：navigateTo/switchTab 参数传字符串而非对象
**原因**：automator 的 `changeRoute()` 内部已将参数包装为 `{ url: e }`，若传入 `{ url: 'path' }` 会变成 `{ url: { url: 'path' } }`，DevTools 2.x 报 `"parameter.url should be String not Object"`。  
**方案**：直接传路径字符串并加 `/` 前缀：`navigateTo('/pages/todo/todo')`、`switchTab('/pages/index/index')`。

### AD-06：E2E 测试异步等待策略
**原因**：`page.callMethod()` 对 async 页面方法只触发，不 await 内部 Promise。数据加载完成时间不确定。  
**方案**：提交操作后不依赖 `callMethod('_loadData')`，改为导航离开再回来（触发 `onShow → _loadData()`）验证数据。`sleep()` 用 `ms => new Promise(r => setTimeout(r, ms))`（automator.connect 模式无 `waitFor`）。

### AD-07：RemindJob dev 调试端点
**方案**：`AdminController.triggerRemind()` 在触发 job 前先向 Redis 写入 `"dev-mock-token"` 作为 `wx:access_token`，绕过微信 access_token 拉取（mock appid 无法拉取真实 token，会导致 job 提前 return，`remind_sent` 永远不翻转）。  
**仅在 `WX_MOCK_OPENID` 非空时可用**，生产无法调用。

---

## 已知 Bug 与修复

| # | Bug | 修复位置 | 修复方式 |
|---|-----|---------|---------|
| 1 | 中文数据存为 `??????` | `application.yml` JDBC URL | `characterEncoding=utf8mb4` → `UTF-8` |
| 2 | 启动报 `Could not resolve placeholder 'tempo.cors.allowed-origins'` | `WebConfig.java` + `application-custom.yml` | YAML list → 逗号字符串，加 @Value 默认值 |
| 3 | `application-custom.yml` 缺失导致所有自定义配置无效 | `DayCraft/src/main/resources/` | 补充创建（已加 `-f` 强制 git 追踪）|
| 4 | Docker build 失败：`dependency:go-offline` 超时 | `DayCraft/Dockerfile` | 改单阶段 COPY 本地 JAR |
| 5 | Docker build 失败：JAR 找不到 | `DayCraft/.dockerignore` | 移除 `target/`，改为只排除中间产物 |
| 6 | 8080 端口冲突 | `docker-compose.yml` | 8081:8080 |
| 7 | 小程序所有请求失败 | `FocusLab/utils/request.js` | BASE_URL `8080` → `8081` |
| 8 | list API 返回空（GET null 参数问题） | `FocusLab/utils/request.js` | 添加 `filterNulls()` 过滤 GET 参数 |
| 9 | touristappid 导致 wx.login 受限 | `FocusLab/project.config.json` | 改用微信测试号（使用测试号导入项目）|
| 10 | RemindJob 因 access_token 拉取失败提前 return | `AdminController` + `RemindJob` | dev 触发前先注入 mock token 到 Redis |

---

## 微信小程序 E2E 测试说明

### 前提条件
1. 微信开发者工具 v2.x 已安装并登录
2. FocusLab 项目以**测试号**（非 touristappid）方式导入（AppID `wx5fb24a398538562a`）
3. 开发者工具 **设置 → 安全设置 → 服务端口** 已开启
4. DayCraft 已在 `localhost:8081` 运行（含 `WX_MOCK_OPENID`）
5. 本地设置勾选"不校验合法域名"

### 运行
```bash
cd FocusLab
npm run test:e2e      # 37 个 E2E 用例
npm test              # 60 个单元测试（utils 层）
```

### DevTools 端口发现
DevTools 每次启动端口随机。测试框架通过 `cli.bat islogin` 输出解析当前端口，无需手动配置。

### 重要约束
- `callMethod` 对 async 方法不等待 Promise → 提交后需 navigate-away + back 验证数据
- `navigateTo`/`switchTab` 传路径字符串（含 `/` 前缀），不传对象
- `miniProgram.waitFor` 在 connect 模式不存在，用 `sleep()`

---

## FocusWeb（Web 端）

技术栈：React 18 + Vite 5 + TypeScript + AntD 5 + recharts。响应式布局（桌面端侧边栏 / 移动端底部 Tab），与小程序通过同一 openid 体系共享数据（生产走微信网页 OAuth 扫码，开发走 mock 登录旁路，需后端 `WX_MOCK_OPENID` 非空）。

- 开发运行：`cd FocusWeb && npm run dev` → `http://localhost:3000`，Vite 代理 `/api` → `localhost:8081`（CORS 已放行 :3000/:8081）
- 生产部署：docker compose 的 `web` 服务，nginx 同源托管 SPA 并反代 `/api` 到 daycraft（端口 80）
- 测试：`npm test`（Vitest 单元，覆盖 client/filterNulls）、`npm run test:e2e`（Playwright，登录→新建待办→导航往返验证）；E2E 默认自动拉起 dev server，或设 `E2E_BASE_URL` 指向已运行实例
- 设计文档：`docs/superpowers/specs/2026-07-23-focusweb-design.md`；实施计划：`docs/superpowers/plans/2026-07-23-focusweb.md`

---

## 任务执行顺序（已全部完成）

| 文件 | 状态 |
|------|------|
| `tasks/01-project-init.md` | ✅ 完成于 2026-04-15 |
| `tasks/02-database.md` | ✅ 完成于 2026-04-15 |
| `tasks/03-backend-core.md` | ✅ 完成于 2026-04-15 |
| `tasks/04-backend-modules.md` | ✅ 完成于 2026-04-15 |
| `tasks/05-backend-jobs.md` | ✅ 完成于 2026-04-15 |
| `tasks/06-docker.md` | ✅ 完成于 2026-04-15 |
| `tasks/07-frontend-base.md` | ✅ 完成于 2026-04-15 |
| `tasks/08-frontend-pages.md` | ✅ 完成于 2026-04-15 |
| `tasks/09-integration.md` | ✅ 完成于 2026-04-15 |

---

## 待办事项

| 优先级 | 项目 | 说明 |
|--------|------|------|
| P1 | 替换 TabBar 占位图 | `FocusLab/images/` 当前为程序生成的几何线条图，需换成设计稿图标 |
| P1 | 生产密钥配置 | `.env` 中 `WX_APPID`/`WX_SECRET`/`JWT_SECRET` 换真实值；`WX_MOCK_OPENID` 必须留空 |
| P2 | 微信订阅消息模板 | 在微信公众平台申请模板 ID，填入 `WX_TEMPLATE_ID`，测试 RemindJob 完整推送链路 |
| P2 | AI 汇总接入 | 设置 `AI_ENABLED=true`/`AI_API_KEY`，将 aiSummary 替换为 DeepSeek 生成内容 |
| P3 | 用户在前端同意订阅 | 需在适当时机调用 `wx.requestSubscribeMessage`，否则推送无权限 |

---

## 验收标准

```bash
# 后端
mvn clean package "-DskipTests=true"    # 零错误编译
docker compose up -d                     # 三服务 healthy
curl http://localhost:8081/actuator/health   # {"status":"UP"}

# 前端单元测试
cd FocusLab && npm test                  # 60/60 pass

# E2E 仿真
npm run test:e2e                         # 37/37 pass

# 微信开发者工具编译零错误，能进入首页
```
