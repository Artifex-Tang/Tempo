# 数据库 Schema 速查

## 表关系图

```
t_user (1)
  ├── (n) t_category       user_id → t_user.id
  ├── (n) t_todo           user_id → t_user.id, category_id → t_category.id (nullable)
  ├── (n) t_goal           user_id → t_user.id
  ├── (n) t_focus_record   user_id → t_user.id, todo_id → t_todo.id (nullable)
  └── (n) t_summary        user_id → t_user.id
```

注：外键约束**不在数据库层面设置**（性能考量），由应用层保证一致性。

---

## 枚举值速查

### t_todo.priority
| 值 | 含义 | 前端颜色 |
|----|------|---------|
| 1 | 高 | #FF4D4F |
| 2 | 中（默认） | #FAAD14 |
| 3 | 低 | #52C41A |

### t_todo.status
| 值 | 含义 |
|----|------|
| 0 | 待办（默认） |
| 1 | 进行中 |
| 2 | 已完成 |
| 3 | 已放弃 |

### t_goal.type
| 值 | 含义 |
|----|------|
| 1 | 日目标 |
| 2 | 周目标（默认） |
| 3 | 月目标 |

### t_goal.status
| 值 | 含义 |
|----|------|
| 0 | 进行中（默认） |
| 1 | 已达成 |
| 2 | 未达成 |

### t_summary.type
| 值 | 含义 | 生成时机 |
|----|------|---------|
| 1 | 周报 | 每周一 01:00 |
| 2 | 月报 | 每月 1 日 01:30 |

---

## 关键索引说明

### t_todo 的提醒索引
```sql
KEY idx_remind (remind_time, remind_sent)
```
RemindJob 每分钟执行以下查询，此索引为其专门创建：
```sql
WHERE remind_time BETWEEN #{from} AND #{to}
  AND remind_sent = 0
  AND status IN (0, 1)
```

### t_summary 的唯一索引
```sql
UNIQUE KEY uk_user_period (user_id, type, period_start)
```
保证每个用户同一周期只有一条汇总记录，防止重复生成。

---

## Java 类型 ↔ 数据库类型 映射

| Java 类型 | MySQL 类型 | 说明 |
|-----------|-----------|------|
| Long | BIGINT | id 和 userId |
| String | VARCHAR / TEXT | 视长度选择 |
| Integer | INT / TINYINT | 状态、优先级用 TINYINT |
| LocalDateTime | DATETIME | 精确到秒 |
| LocalDate | DATE | 仅日期 |
| Boolean | 不使用 | 用 TINYINT(0/1) 替代 |
