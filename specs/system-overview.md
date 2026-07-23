# Tempo 系统规格速查

Claude Code 在任何时候需要了解系统整体情况时，读这个文件。

---

## 系统边界

```
用户手机（微信）
    ↓ wx.login() → code
FocusLab 小程序
    ↓ POST /api/auth/login {code}
DayCraft 后端
    ↓ GET jscode2session
微信服务器 → openid
    ↓ 生成 JWT
FocusLab 存储 token
    ↓ 后续所有请求带 Authorization: Bearer {token}
DayCraft AuthInterceptor 验证
    ↓ userId 写入 UserContext（ThreadLocal）
Controller → Service → Mapper → MySQL
                              ↘ Redis（wx:access_token 缓存）

后台定时任务（每分钟）：
DayCraft RemindJob
    → 扫描 t_todo（remind_time 到期 & remind_sent=0）
    → 读 Redis access_token（不存在则刷新）
    → 调微信 subscribeMessage.send
    → 更新 remind_sent=1

后台定时任务（每周一/每月一日）：
DayCraft SummaryJob
    → 查全体用户
    → 统计 todo/focus/goal 数据
    → 生成文字总结
    → upsert t_summary
```

> **Web 端（FocusWeb）**：浏览器 → nginx（同源托管 SPA + 反代 `/api`）→ DayCraft。开发 `npm run dev`(:3000) 经 Vite 代理 `/api`→:8081。鉴权走 `POST /api/auth/web-mock-login`（dev，需 `WX_MOCK_OPENID`）或 `POST /api/auth/web-oauth/callback`（生产，微信网页扫码）；同一 openid 体系 → 与小程序同一用户、同一份数据。

---

## 数据流：一次完整的待办完成流程

```
前端：用户点击"完成"按钮，填写完成情况
    ↓
前端：PATCH /api/todos/{id}/finish
     Body: {status: 2, finishNote: "..."}
     Header: Authorization: Bearer xxx
    ↓
后端 AuthInterceptor：解析 JWT → userId=1 → UserContext.set(1)
    ↓
后端 TodoController.finish(id=5, dto)
    ↓
后端 TodoService.finish(userId=1, id=5, dto)
    → getById(5) 检查归属（userId 必须==1）
    → todo.status = 2
    → todo.finishNote = "..."
    → todo.finishTime = LocalDateTime.now()
    → updateById(todo)
    ↓
后端 AuthInterceptor afterCompletion：UserContext.clear()
    ↓
后端 返回 R.ok()  {"code":200,"msg":"操作成功"}
    ↓
前端：showToast("已完成 ✓") → 重新加载列表
```

---

## 模块依赖关系（后端）

```
Controller（无业务逻辑，只调 Service）
    ↓ 调用
Service（核心业务逻辑，事务控制）
    ↓ 调用
Mapper（数据访问，继承 BaseMapper）
    ↓ 操作
MySQL 数据库

跨切面：
  AuthInterceptor → UserContext → 所有 Service 可用 UserContext.get()
  GlobalExceptionHandler → 捕获所有 Controller 抛出的异常
  MetaObjectHandler → 自动填充 createdAt/updatedAt
```

---

## 所有 REST 端点总览

```
POST   /api/auth/login                  公开，微信登录
-------（以下都需要 Bearer Token）--------
GET    /api/todos/today                 今日待办
GET    /api/todos                       列表 (?status= &categoryId=)
POST   /api/todos                       创建
PUT    /api/todos/{id}                  编辑
PATCH  /api/todos/{id}/finish           完成/放弃
DELETE /api/todos/{id}                  删除
GET    /api/todos/statistics            统计 (?days=7)

GET    /api/goals                       列表 (?type= &status=)
POST   /api/goals                       创建
PUT    /api/goals/{id}                  编辑
PATCH  /api/goals/{id}/progress         更新进度
PATCH  /api/goals/{id}/finish           达成/未达成
DELETE /api/goals/{id}                  删除

POST   /api/focus/record                保存专注记录
GET    /api/focus/daily-stats           每日统计 (?days=7)

GET    /api/categories                  列表
POST   /api/categories                  创建
PUT    /api/categories/{id}             编辑
DELETE /api/categories/{id}             删除

GET    /api/summary/weekly              本周汇总
GET    /api/summary/monthly             本月汇总
POST   /api/summary/generate            手动触发 (?type=1)
-------（Actuator）-----------------------
GET    /actuator/health                 健康检查（公开）
```

---

## 前端页面-后端接口对应关系

| 前端页面 | 主要调用的 API |
|---------|--------------|
| pages/login | `auth.login()` |
| pages/index | `todo.today()` + `summary.weekly()` |
| pages/todo | `todo.*`（全部）+ `category.list()` |
| pages/focus | `focus.record()` + `focus.dailyStats()` + `todo.list(0)` |
| pages/goal | `goal.*`（全部） |
| pages/summary | `summary.weekly()` + `summary.monthly()` + `summary.generate()` |
| pages/category | `category.*`（全部） |

---

## 关键业务规则

1. **数据归属校验**：所有修改/删除操作必须校验 `record.userId == UserContext.get()`，不符合抛 `BusinessException(XXX_NOT_FOUND)`（用 NOT_FOUND 而非 FORBIDDEN，不暴露记录是否存在）

2. **待办今日列表逻辑**：`dueDate = today` OR `(dueDate < today AND status IN (0,1))` OR `status = 1`，按 priority asc, sortOrder asc 排序

3. **专注累计**：`t_user.focus_total` 在每次保存专注记录时 `+= durationMin`，无需聚合查询

4. **提醒幂等**：`remind_sent=1` 后不再推送，修改 `remind_time` 时重置为 0

5. **汇总 upsert**：`t_summary` 有 `UNIQUE KEY uk_user_period(user_id, type, period_start)`，buildAndSave 必须先查后写

6. **分类名唯一性**：同一用户下 `name` 不可重复，有 `UNIQUE KEY uk_user_name(user_id, name)`

7. **进度自动达成**：`goal.progress == 100` 时自动设 `goal.status = 1`

---

## 开发/生产环境差异

| 配置项 | dev | prod |
|--------|-----|------|
| 数据库 | localhost:3306/tempo_dev | ${DB_HOST}:${DB_PORT}/${DB_NAME} |
| 密码 | root123（示例） | 环境变量注入 |
| Redis | localhost:6379 | ${REDIS_HOST}:${REDIS_PORT} |
| wx.urlCheck | 关闭（开发工具设置） | 需配置合法域名 |
| JWT Secret | 内置默认值 | 环境变量必须设置 |
| 日志级别 | DEBUG 可选 | INFO |
