# 设计决策记录（ADR）

Claude Code 在实现过程中遇到选择时，以此文件为准。

---

## ADR-001：鉴权方案选 JWT 而非 Session

**决策**：使用无状态 JWT + 自定义 AuthInterceptor，不使用 Spring Security。

**原因**：
- 小程序没有 Cookie，天然适合 Bearer Token
- Spring Security 配置复杂，对本项目过度
- 自定义拦截器 50 行代码即可完成鉴权

**Token 存储**：
- 后端：无状态，不存储
- 前端：`wx.setStorageSync('token', token)`

---

## ADR-002：用 MyBatis-Plus 而非 JPA

**决策**：ORM 层使用 MyBatis-Plus，禁止 JPA/Hibernate。

**原因**：
- 复杂 SQL（如提醒任务扫描、日期范围统计）用原生 SQL 更直观
- Java 后端团队更熟悉 MyBatis 生态
- MyBatis-Plus 的 LambdaQueryWrapper 简化了简单 CRUD

---

## ADR-003：定时任务用 @Scheduled 而非 Quartz

**决策**：用 `@Scheduled` 注解 + `@EnableScheduling`，不引入 Quartz。

**原因**：
- 只有 2 个定时任务，无需 Quartz 的持久化和集群支持
- `@Scheduled` 配置极简，维护成本低
- 未来若需要集群，可再迁移到 Quartz 或 XXL-Job

---

## ADR-004：前端不使用跨端框架

**决策**：FocusLab 使用原生微信小程序，不使用 uni-app/Taro。

**原因**：
- 项目只需要微信小程序一个平台
- 原生开发性能最佳，无框架封装层开销
- 基于 Focus-clock 改造，保持原有技术栈一致性

---

## ADR-005：Redis 用途

Redis 在本项目中只用于两个场景：
1. **微信 access_token 缓存**（key: `wx:access_token`，TTL: expires_in - 300s）
2. **预留**：未来可用于用户会话缓存、接口限流

不用于存储业务数据（业务数据全部在 MySQL）。

---

## ADR-006：Summary 表的 upsert 策略

**决策**：`buildAndSave` 方法先查后写，不使用数据库 upsert 语法。

**原因**：MyBatis-Plus 的 `saveOrUpdate` 基于主键，而本场景需要按 `(userId, type, periodStart)` 判重，用业务代码逻辑更清晰。

---

## ADR-007：focus_total 冗余字段

**决策**：`t_user.focus_total` 是冗余字段，记录用户累计专注分钟总数。

**更新时机**：每次 `FocusService.record()` 成功后，`UPDATE t_user SET focus_total = focus_total + durationMin`。

**原因**：首页展示用户总专注时长是高频操作，冗余存储避免每次都聚合 t_focus_record。

---

## ADR-008：前端 API 层分离

**决策**：`request.js` 只处理 HTTP 协议层（token、错误提示、401跳转），`api.js` 只处理业务语义（URL、参数封装）。页面代码只 require `api.js`。

**原因**：关注点分离，换接口地址只改 `request.js` 一处，换业务逻辑只改 `api.js`。

---

## 常见实现陷阱（Claude Code 特别注意）

### 陷阱 1：LocalDate 序列化
SpringBoot 3 中 `LocalDate` / `LocalDateTime` 默认序列化为数组格式 `[2026, 4, 11]`。
**必须在 Jackson 配置中注册 `JavaTimeModule` 并禁用 `WRITE_DATES_AS_TIMESTAMPS`**。

### 陷阱 2：MyBatis-Plus 自动填充不生效
Entity 的时间字段必须同时满足：
1. `@TableField(fill = FieldFill.INSERT)` 注解
2. `MetaObjectHandler` Bean 中使用 `strictInsertFill` 方法
3. 字段名与 fill 方法中的字符串名称完全一致（camelCase）

### 陷阱 3：微信小程序 wx.request 异步
所有 wx.request 回调是异步的，在 Page 的生命周期函数中必须用 Promise 封装后才能 async/await。

### 陷阱 4：前端跨页面数据刷新
从弹窗 / 子页面返回后，`onShow` 会被触发，通过在 `onShow` 中重新加载数据实现自动刷新，不需要全局事件总线。

### 陷阱 5：Docker 健康检查等待
`daycraft` 服务依赖 `mysql: service_healthy`，但 MySQL 启动后还需要约 10-20 秒初始化完成。
SpringBoot 应配置 `spring.datasource.hikari.connection-timeout` 适当延长，或 daycraft 的 `start_period` 设为 60s 以上。
