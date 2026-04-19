# Task 04 — 后端业务模块

## 目标
实现所有 Entity、Mapper、DTO/VO、Service、Controller。按模块顺序实现，每个模块包含完整的 CRUD。

---

## 04-A：Entity 层

所有 Entity 遵守以下规范：
- `@TableName("t_xxx")`
- `@TableId(type = IdType.AUTO)`
- 时间字段：`@TableField(fill = FieldFill.INSERT)` 或 `INSERT_UPDATE`
- 使用 `LocalDateTime` / `LocalDate`，不使用 `Date`
- Lombok `@Data`

### User.java
字段：id, openid, nickname, avatarUrl, focusTotal(Integer), createdAt, updatedAt

### Category.java
字段：id, userId, name, color, icon, sortOrder, createdAt

### Todo.java
字段：id, userId, title, description, categoryId, priority(Integer), status(Integer), remindTime(LocalDateTime), remindSent(Integer), dueDate(LocalDate), finishTime(LocalDateTime), finishNote, sortOrder, createdAt, updatedAt

### Goal.java
字段：id, userId, title, description, type(Integer), targetDate(LocalDate), status(Integer), progress(Integer), finishNote, createdAt, updatedAt

### FocusRecord.java
字段：id, userId, todoId, goalId, durationMin, startTime(LocalDateTime), endTime(LocalDateTime), note, createdAt

### Summary.java
字段：id, userId, type(Integer), periodStart(LocalDate), periodEnd(LocalDate), todoTotal, todoDone, focusTotalMin, goalTotal, goalDone, aiSummary, createdAt

---

## 04-B：Mapper 层

所有 Mapper 继承 `BaseMapper<T>`，加 `@Mapper` 注解。

以下 Mapper 需要额外的自定义方法（用 `@Select` 注解实现，不写 XML）：

### TodoMapper 额外方法

```java
// 查询待推送提醒：remind_time 在 [from,to] 范围内，未发送，状态为待办或进行中
List<Todo> selectPendingReminders(
    @Param("from") LocalDateTime from, 
    @Param("to") LocalDateTime to
);

// 标记提醒已发送
@Update("UPDATE t_todo SET remind_sent = 1 WHERE id = #{id}")
void markRemindSent(@Param("id") Long id);

// 日期范围内任务统计，返回 Map 含 total 和 done 两个 key
Map<String, Object> statsByDateRange(
    @Param("userId") Long userId,
    @Param("startDate") String startDate,
    @Param("endDate") String endDate
);
```

### FocusRecordMapper 额外方法

```java
// 按天聚合专注时长，返回 List<Map>，每项含 day(String) 和 totalMin(Long)
List<Map<String, Object>> dailyStats(
    @Param("userId") Long userId, 
    @Param("days") int days
);

// 日期范围内累计专注分钟，无记录时返回 0
Integer sumMinByDateRange(
    @Param("userId") Long userId,
    @Param("startDate") String startDate,
    @Param("endDate") String endDate
);
```

---

## 04-C：DTO / VO

### LoginDTO
```java
@NotBlank String code;          // wx.login() 的 code，必填
String nickname;                // 可选
String avatarUrl;               // 可选
```

### LoginVO（@Builder）
```java
String token;
Long userId;
String nickname;
String avatarUrl;
Integer focusTotal;
boolean isNew;                  // true=首次登录
```

### TodoDTO
```java
@NotBlank @Size(max=200) String title;
String description;
Long categoryId;
Integer priority;               // 默认2，1高2中3低
@JsonFormat(pattern="yyyy-MM-dd HH:mm:ss") LocalDateTime remindTime;
@JsonFormat(pattern="yyyy-MM-dd") LocalDate dueDate;
Integer sortOrder;
```

### TodoFinishDTO
```java
Integer status;                 // 2=完成 3=放弃
String finishNote;
```

### GoalDTO
```java
@NotBlank String title;
String description;
@NotNull Integer type;          // 1日 2周 3月
@NotNull @JsonFormat(pattern="yyyy-MM-dd") LocalDate targetDate;
```

### FocusStartDTO
```java
@NotNull @Min(1) Integer durationMin;
Long todoId;                    // 可选
Long goalId;                    // 可选
String note;                    // 可选
```

### CategoryDTO
```java
@NotBlank @Size(max=50) String name;
String color;
String icon;
Integer sortOrder;
```

---

## 04-D：Service 层

### AuthService / AuthServiceImpl
`login(LoginDTO dto) → LoginVO`：
1. 调用 `WxApiUtil.getOpenid(dto.getCode())`
2. 按 openid 查 t_user，不存在则 insert（isNew=true）
3. 如 dto 有 nickname/avatarUrl 则更新
4. `JwtUtil.generateToken(userId)` 生成 token
5. 返回 LoginVO

### CategoryService / CategoryServiceImpl
继承 `IService<Category>`
- `create(userId, dto)`：检查同用户下名称不重复（抛 CATEGORY_DUPLICATE），insert
- `update(userId, id, dto)`：校验归属后 update
- `listByUser(userId)`：按 sortOrder asc 查询
- `remove(userId, id)`：校验归属后 delete

### TodoService / TodoServiceImpl
继承 `IService<Todo>`
- `create(userId, dto)`：status=0, remindSent=0，insert
- `update(userId, id, dto)`：校验归属；若 remindTime 有变化则 remindSent 重置为 0
- `finish(userId, id, dto)`：更新 status/finishNote，status=2 时记录 finishTime
- `todayList(userId)`：今日截止 OR 超期未完成 OR 进行中，按 priority asc/sortOrder asc 排序
- `list(userId, status, categoryId)`：条件查询
- `statistics(userId, days)`：调用 `TodoMapper.statsByDateRange`
- `remove(userId, id)`：校验归属后 delete
- 所有"校验归属"方法：getById 后检查 userId，不符合抛 `BusinessException(TODO_NOT_FOUND)`

### GoalService / GoalServiceImpl
继承 `IService<Goal>`
- `create / update / remove`：基础 CRUD，带归属校验
- `updateProgress(userId, id, progress)`：progress 截断到 [0,100]，若 progress==100 自动设 status=1
- `finish(userId, id, status, finishNote)`：status=1 时 progress 设 100
- `list(userId, type, status)`：条件查询，按 targetDate asc

### FocusService / FocusServiceImpl
继承 `IService<FocusRecord>`
- `record(userId, dto)`：startTime=now-durationMin，endTime=now，insert；同时 `UPDATE t_user SET focus_total = focus_total + durationMin`
- `dailyStats(userId, days)`：调用 `FocusRecordMapper.dailyStats`

### SummaryService / SummaryServiceImpl
继承 `IService<Summary>`
- `getWeekly(userId)`：取本周 Mon-Sun，查已有 summary；不存在则立即 buildAndSave 后返回
- `getMonthly(userId)`：取本月，逻辑同上
- `generateWeekly(userId)`：生成**上一周**（给定时任务调用）
- `generateMonthly(userId)`：生成**上个月**（给定时任务调用）
- 私有 `buildAndSave(userId, type, start, end)`：
  - 调 TodoMapper.statsByDateRange 得到 todoTotal/todoDone
  - 调 FocusRecordMapper.sumMinByDateRange 得到 focusTotalMin
  - 查 t_goal 的 target_date BETWEEN start AND end，统计 goalTotal/goalDone
  - 生成规则文字总结（格式："本期共创建X个待办，完成X个（完成率X%）；累计专注X；目标达成X/X个。"）
  - upsert（有则 updateById，无则 save）

---

## 04-E：Controller 层

所有 Controller：
- `@RestController`、`@RequestMapping("/api/xxx")`、`@RequiredArgsConstructor`
- `@Tag(name="模块名")` Swagger 标签
- 从 `UserContext.get()` 获取当前 userId，不从 Header 手动解析
- 返回值统一用 `R<T>`

### AuthController — `/api/auth`
```
POST /login    public，不经过拦截器
```

### TodoController — `/api/todos`
```
GET    /today              今日待办列表
GET    /                   列表（?status=&categoryId=）
POST   /                   创建
PUT    /{id}               编辑
PATCH  /{id}/finish        完成/放弃
DELETE /{id}               删除
GET    /statistics         近N天统计（?days=7）
```

### GoalController — `/api/goals`
```
GET    /                   列表（?type=&status=）
POST   /                   创建
PUT    /{id}               编辑
PATCH  /{id}/progress      更新进度（body: {progress: int}）
PATCH  /{id}/finish        达成/未达成（body: {status: int, finishNote: string}）
DELETE /{id}               删除
```

### FocusController — `/api/focus`
```
POST   /record             保存专注记录
GET    /daily-stats        每日专注趋势（?days=7）
```

### CategoryController — `/api/categories`
```
GET    /                   列表
POST   /                   创建
PUT    /{id}               编辑
DELETE /{id}               删除
```

### SummaryController — `/api/summary`
```
GET    /weekly             本周汇总
GET    /monthly            本月汇总
POST   /generate           手动触发（?type=1 周/2 月）
```

---

## 验收标准

- [ ] `mvn clean package -DskipTests` 零错误
- [ ] 启动后访问 `http://localhost:8080/doc.html` 能看到所有 API
- [ ] `POST /api/auth/login` 不报 401（因为在白名单）
- [ ] `GET /api/todos/today` 带有效 token 返回 200
- [ ] `GET /api/todos/today` 不带 token 返回 401

## ✅ 完成于 2026-04-15 00:00
