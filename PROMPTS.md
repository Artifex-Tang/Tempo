# Claude Code 启动提示词

本文件提供开箱即用的提示词，复制粘贴给 Claude Code 即可。

---

## 🚀 方式一：全自动执行（推荐首次使用）

将以下内容完整复制给 Claude Code：

```
你是 Tempo 项目的开发助手。

请先阅读项目根目录的 CLAUDE.md，完整理解项目架构、技术约束和任务顺序。
然后阅读 context/ 目录下的所有文件作为背景知识。
最后按照 tasks/ 目录下的文件顺序（01 → 09）逐个执行任务。

执行规则：
1. 每开始一个任务前，先输出"▶ 开始执行 Task XX: [任务名]"
2. 每完成一个任务后，在该任务文件末尾追加一行：## ✅ 完成于 [当前时间]
3. 执行过程中遇到技术选择时，以 context/design-decisions.md 为准
4. 遇到版本号不确定时，以 context/tech-stack.md 为准
5. 前后端接口有疑问时，以 context/api-contracts.md 为准
6. 每个任务完成后输出该任务的验收清单，逐项标注 ✅ 或 ❌

开始执行。
```

---

## 🔧 方式二：分步执行（推荐调试时使用）

每次只执行一个任务，便于检查中间结果。

### 初始化（首次运行）
```
请阅读 CLAUDE.md 和 context/ 下所有文件，记住项目约束。不要生成任何代码，只需确认你已理解并输出以下内容：
1. 项目包含哪两个子项目，各自的技术栈
2. 后端禁止使用哪些框架
3. 前端的网络请求规范
4. 任务执行顺序
```

### Task 01 - 项目骨架
```
请阅读 tasks/01-project-init.md 并严格按照其要求创建项目目录结构和配置文件。
完成后逐项检查验收标准，输出检查结果。
```

### Task 02 - 数据库
```
请阅读 tasks/02-database.md 和 context/db-schema.md，
然后编写 DayCraft/src/main/resources/init.sql。
注意：脚本必须幂等（可重复执行不报错）。
```

### Task 03 - 后端基础设施
```
请阅读 tasks/03-backend-core.md 和 context/design-decisions.md，
实现后端基础层：application.yml 配置、统一响应体、异常体系、JWT 工具、拦截器。
注意 context/design-decisions.md 中的"常见实现陷阱"，尤其是 LocalDate 序列化问题。
```

### Task 04 - 后端业务模块
```
请阅读 tasks/04-backend-modules.md 和 context/api-contracts.md，
按照 Entity → Mapper → DTO/VO → Service → Controller 的顺序实现所有业务模块。
接口的请求/响应格式以 context/api-contracts.md 为准。
```

### Task 05 - 定时任务
```
请阅读 tasks/05-backend-jobs.md，实现 RemindJob 和 SummaryJob。
注意：RemindJob 中 access_token 需要用 Redis 缓存，避免每分钟都请求微信接口。
```

### Task 06 - Docker
```
请阅读 tasks/06-docker.md，编写 DayCraft/Dockerfile（多阶段构建）
和根目录 docker-compose.yml（三服务编排：mysql + redis + daycraft）。
确保 daycraft 的 healthcheck 使用 /actuator/health 端点。
```

### Task 07 - 前端基础层
```
请阅读 tasks/07-frontend-base.md，实现 FocusLab 的全局配置和工具层：
app.js（静默登录）、app.json、app.wxss（CSS 变量）、
utils/request.js（统一请求）、utils/api.js（业务 API）、utils/util.js（工具函数）
和 pages/login/ 登录页。
```

### Task 08 - 前端业务页面
```
请阅读 tasks/08-frontend-pages.md，依次实现 6 个业务页面：
index（今日首页）、todo（待办管理）、focus（专注计时）、
goal（目标计划）、summary（汇总报告）、category（分类管理）。
每个页面包含 .js / .wxml / .wxss / .json 四个文件。
注意：专注页的圆环进度用 CSS conic-gradient 实现。
```

### Task 09 - 联调验证
```
请阅读 tasks/09-integration.md，执行联调验证步骤：
1. 检查后端是否能正常编译和启动
2. 执行文件中列出的 curl 测试命令
3. 列出所有验收标准并逐项标注通过/未通过
4. 如有失败项，分析原因并修复
```

---

## 🐛 问题排查提示词

### 编译错误
```
DayCraft 编译报错，错误信息如下：
[粘贴错误信息]

请检查以下几点：
1. 依赖版本是否符合 context/tech-stack.md 的要求
2. 是否有 import 遗漏
3. SpringBoot 3.x 的 jakarta 包是否正确（不是 javax）
然后修复错误。
```

### 接口 401
```
调用 [接口路径] 返回 401，Token 是从 /api/auth/login 正常获取的。
请检查：
1. WebConfig.java 中该接口是否在拦截路径内
2. AuthInterceptor 解析 token 的逻辑是否正确
3. UserContext.get() 是否在 Service 层能正确读取到 userId
```

### 前端网络请求失败
```
FocusLab 调用 [接口] 报"网络异常"，后端已正常启动。
请检查：
1. utils/request.js 中 BASE_URL 是否正确
2. 微信开发者工具是否已勾选"不校验合法域名"
3. 是否有 CORS 问题（后端 WebConfig.addCorsMappings 配置）
```

### Docker 服务不健康
```
docker compose ps 显示 daycraft 服务 unhealthy。
请检查：
1. docker compose logs daycraft 中的错误信息
2. MySQL 是否已完全启动（check docker compose logs mysql）
3. daycraft 的 depends_on 是否配置了 condition: service_healthy
4. application.yml prod profile 的环境变量是否都从 .env 正确读取
```

---

## 📋 进度检查提示词

```
请检查当前项目状态，输出以下内容：
1. tasks/ 目录下哪些文件已标记完成（末尾有 ✅）
2. DayCraft/ 目录下已存在的 Java 文件列表
3. FocusLab/ 目录下已存在的页面列表
4. 下一步应该执行哪个任务
```

---

## 💡 使用技巧

**批量创建文件时**，给 Claude Code 明确说：
```
请一次性创建所有文件，不要等我确认每一个。
```

**代码审查时**，说：
```
请检查 [文件路径] 是否符合 CLAUDE.md 中的代码规范要求，
特别关注：命名规范、注释完整性、异常处理。
```

**继续中断的任务**，说：
```
上次执行到 Task 04 的 Service 层，Controller 还没做。
请继续从 TodoController 开始实现剩余的 Controller 类。
```
