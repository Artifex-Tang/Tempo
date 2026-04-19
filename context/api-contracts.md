# API 接口契约

前后端接口的完整约定。前端 api.js 和后端 Controller 必须严格对齐。

## 通用规则

### 请求
- Content-Type: `application/json`
- 鉴权 Header: `Authorization: Bearer {jwt_token}`
- 白名单（无需 token）: `POST /api/auth/login`

### 响应格式
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

### 错误码
| code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 参数有误（含字段校验失败，msg 中包含字段名） |
| 401 | 未登录或 token 过期 |
| 500 | 服务器内部错误 |
| 1001 | 微信登录失败 |
| 1100 | 待办不存在或无权限 |
| 1200 | 目标不存在或无权限 |
| 1300 | 分类名称已存在 |

---

## 认证模块

### POST /api/auth/login
**Request:**
```json
{
  "code": "wx.login()返回的code",  // 必填
  "nickname": "用户昵称",           // 可选
  "avatarUrl": "头像URL"            // 可选
}
```
**Response data:**
```json
{
  "token": "eyJhbGci...",
  "userId": 1,
  "nickname": "张三",
  "avatarUrl": "https://...",
  "focusTotal": 0,
  "isNew": true
}
```

---

## 待办模块

### GET /api/todos/today
**Response data:** `Todo[]`

### GET /api/todos
**Query:** `?status=0&categoryId=1`（均可选）
**Response data:** `Todo[]`

### POST /api/todos
**Request:**
```json
{
  "title": "任务标题",       // 必填，max 200
  "description": "详细说明", // 可选
  "priority": 2,             // 可选，1高2中3低，默认2
  "categoryId": 1,           // 可选
  "remindTime": "2026-04-15 09:00:00",  // 可选，格式 yyyy-MM-dd HH:mm:ss
  "dueDate": "2026-04-15",   // 可选，格式 yyyy-MM-dd
  "sortOrder": 0             // 可选
}
```
**Response data:** `Todo`

### PUT /api/todos/{id}
同 POST，Response data: `Todo`

### PATCH /api/todos/{id}/finish
**Request:**
```json
{
  "status": 2,               // 2=已完成 3=已放弃
  "finishNote": "完成情况说明" // 可选
}
```
**Response data:** null

### DELETE /api/todos/{id}
**Response data:** null

### GET /api/todos/statistics
**Query:** `?days=7`
**Response data:**
```json
{
  "total": 10,
  "done": 7
}
```

### Todo 对象结构
```json
{
  "id": 1,
  "userId": 1,
  "title": "任务标题",
  "description": "详细说明",
  "categoryId": 1,
  "priority": 2,
  "status": 0,
  "remindTime": "2026-04-15T09:00:00",
  "remindSent": 0,
  "dueDate": "2026-04-15",
  "finishTime": null,
  "finishNote": null,
  "sortOrder": 0,
  "createdAt": "2026-04-11T10:00:00",
  "updatedAt": "2026-04-11T10:00:00"
}
```

---

## 目标模块

### GET /api/goals
**Query:** `?type=2&status=0`（均可选）
**Response data:** `Goal[]`

### POST /api/goals
**Request:**
```json
{
  "title": "目标标题",  // 必填
  "description": "",   // 可选
  "type": 2,           // 必填，1日2周3月
  "targetDate": "2026-04-20"  // 必填，yyyy-MM-dd
}
```

### PATCH /api/goals/{id}/progress
**Request:** `{"progress": 60}`

### PATCH /api/goals/{id}/finish
**Request:** `{"status": 1, "finishNote": "总结文字"}`（status: 1达成 2未达成）

---

## 专注模块

### POST /api/focus/record
**Request:**
```json
{
  "durationMin": 25,   // 必填，≥1
  "todoId": 1,         // 可选
  "goalId": null,      // 可选
  "note": "备注"       // 可选
}
```

### GET /api/focus/daily-stats
**Query:** `?days=7`
**Response data:**
```json
[
  {"day": "2026-04-10", "totalMin": 50},
  {"day": "2026-04-11", "totalMin": 25}
]
```

---

## 分类模块

### GET /api/categories
**Response data:** `Category[]`

### POST /api/categories
**Request:**
```json
{
  "name": "工作",          // 必填，max 50
  "color": "#1A73E8",      // 可选
  "icon": "work",          // 可选
  "sortOrder": 1           // 可选
}
```

---

## 汇总模块

### GET /api/summary/weekly
### GET /api/summary/monthly
**Response data:**
```json
{
  "id": 1,
  "userId": 1,
  "type": 1,
  "periodStart": "2026-04-07",
  "periodEnd": "2026-04-13",
  "todoTotal": 10,
  "todoDone": 7,
  "focusTotalMin": 175,
  "goalTotal": 3,
  "goalDone": 2,
  "aiSummary": "本期共创建10个待办，完成7个（完成率70%）；累计专注2小时55分；目标达成2/3个。",
  "createdAt": "2026-04-14T01:00:00"
}
```

### POST /api/summary/generate
**Query:** `?type=1`（1周 2月）
**Response data:** null，msg="汇总已生成"
