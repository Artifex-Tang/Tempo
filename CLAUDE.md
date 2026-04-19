# Tempo Project — Claude Code 工作手册

## 项目概述

Tempo 是个人事务管理系统，分为两个独立仓库：
- **DayCraft**：后端服务，SpringBoot 3 + MyBatis-Plus + MySQL 8 + Redis 7
- **FocusLab**：前端微信小程序，原生 WXML，基于 Focus-clock 改造

## 仓库结构

```
Tempo/
├── DayCraft/           后端（本 CLAUDE.md 所在目录的子目录）
├── FocusLab/           前端小程序
├── docker-compose.yml  全栈编排
└── .env.example        环境变量模板
```

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

## 数据库表清单

| 表名 | 说明 |
|------|------|
| t_user | 用户（openid 唯一索引） |
| t_category | 任务分类（user_id + name 联合唯一） |
| t_todo | 待办任务（remind_time + remind_sent 索引供定时任务查询） |
| t_goal | 目标计划 |
| t_focus_record | 专注记录 |
| t_summary | 周报/月报汇总 |

## 环境变量（运行时注入）

```
DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
REDIS_HOST / REDIS_PORT / REDIS_PASSWORD
WX_APPID / WX_SECRET / WX_TEMPLATE_ID
JWT_SECRET（≥32位随机字符串）
AI_ENABLED / AI_API_KEY / AI_API_URL
SPRING_PROFILES_ACTIVE（dev|prod）
```

## 任务执行顺序

请按以下顺序处理 tasks/ 目录下的任务文件：

1. `tasks/01-project-init.md`      初始化项目骨架
2. `tasks/02-database.md`          数据库脚本
3. `tasks/03-backend-core.md`      后端基础设施
4. `tasks/04-backend-modules.md`   后端业务模块
5. `tasks/05-backend-jobs.md`      定时任务
6. `tasks/06-docker.md`            Docker 配置
7. `tasks/07-frontend-base.md`     前端基础层
8. `tasks/08-frontend-pages.md`    前端页面
9. `tasks/09-integration.md`       联调验证

每完成一个任务文件，在该文件末尾追加 `## ✅ 完成于 YYYY-MM-DD HH:mm`。

## 验收标准

- `mvn clean package -DskipTests` 零错误编译通过
- `docker compose up -d` 三个服务全部 healthy
- `curl localhost:8080/actuator/health` 返回 `{"status":"UP"}`
- 微信开发者工具编译零错误，能进入首页
