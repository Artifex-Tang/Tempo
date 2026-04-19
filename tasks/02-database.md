# Task 02 — 数据库脚本

## 目标
编写 `DayCraft/src/main/resources/init.sql`，创建全部 6 张表。

---

## 执行要求

文件路径：`DayCraft/src/main/resources/init.sql`

脚本必须满足：
1. 首行 `CREATE DATABASE IF NOT EXISTS tempo ...`
2. `USE tempo;`
3. 所有表使用 `CREATE TABLE IF NOT EXISTS`，可重复执行
4. 引擎：InnoDB，字符集：utf8mb4，排序规则：utf8mb4_unicode_ci
5. 所有 datetime 字段使用 `DEFAULT CURRENT_TIMESTAMP`

---

## 表结构规范

### t_user
```sql
id          BIGINT PK AUTO_INCREMENT
openid      VARCHAR(64) NOT NULL UNIQUE   -- 微信 openid
nickname    VARCHAR(50)
avatar_url  VARCHAR(512)
focus_total INT DEFAULT 0                  -- 累计专注分钟（冗余字段，提升查询性能）
created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

索引：uk_openid(openid)
```

### t_category
```sql
id          BIGINT PK AUTO_INCREMENT
user_id     BIGINT NOT NULL
name        VARCHAR(50) NOT NULL
color       VARCHAR(20)                   -- hex 颜色如 #FF6B6B
icon        VARCHAR(50)
sort_order  INT DEFAULT 0
created_at  DATETIME DEFAULT CURRENT_TIMESTAMP

索引：uk_user_name(user_id, name)，idx_user_id(user_id)
```

### t_todo
```sql
id           BIGINT PK AUTO_INCREMENT
user_id      BIGINT NOT NULL
title        VARCHAR(200) NOT NULL
description  TEXT
category_id  BIGINT                        -- 允许为空
priority     TINYINT DEFAULT 2             -- 1高 2中 3低
status       TINYINT DEFAULT 0             -- 0待办 1进行中 2已完成 3已放弃
remind_time  DATETIME                      -- 提醒时间
remind_sent  TINYINT DEFAULT 0             -- 0未发 1已发（定时任务查询条件）
due_date     DATE
finish_time  DATETIME
finish_note  TEXT                          -- 完成情况填写
sort_order   INT DEFAULT 0
created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

索引：
  idx_user_status(user_id, status)
  idx_user_due(user_id, due_date)
  idx_remind(remind_time, remind_sent)     -- 定时任务扫描专用
  idx_created(user_id, created_at)         -- 统计查询用
```

### t_goal
```sql
id           BIGINT PK AUTO_INCREMENT
user_id      BIGINT NOT NULL
title        VARCHAR(200) NOT NULL
description  TEXT
type         TINYINT DEFAULT 1             -- 1日目标 2周目标 3月目标
target_date  DATE NOT NULL
status       TINYINT DEFAULT 0             -- 0进行中 1已达成 2未达成
progress     TINYINT DEFAULT 0            -- 0-100
finish_note  TEXT
created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

索引：idx_user_date(user_id, target_date)，idx_user_status(user_id, status)
```

### t_focus_record
```sql
id           BIGINT PK AUTO_INCREMENT
user_id      BIGINT NOT NULL
todo_id      BIGINT                        -- 关联待办，可为空
goal_id      BIGINT                        -- 关联目标，可为空
duration_min INT NOT NULL                  -- 专注分钟数
start_time   DATETIME NOT NULL
end_time     DATETIME NOT NULL
note         VARCHAR(255)
created_at   DATETIME DEFAULT CURRENT_TIMESTAMP

索引：idx_user_time(user_id, start_time)
```

### t_summary
```sql
id               BIGINT PK AUTO_INCREMENT
user_id          BIGINT NOT NULL
type             TINYINT NOT NULL           -- 1周报 2月报
period_start     DATE NOT NULL
period_end       DATE NOT NULL
todo_total       INT DEFAULT 0
todo_done        INT DEFAULT 0
focus_total_min  INT DEFAULT 0
goal_total       INT DEFAULT 0
goal_done        INT DEFAULT 0
ai_summary       TEXT                       -- AI 或规则生成的文字总结
created_at       DATETIME DEFAULT CURRENT_TIMESTAMP

索引：uk_user_period(user_id, type, period_start) -- 唯一索引，防重复生成
```

---

## 验收标准

- [ ] `mysql -u root -p < init.sql` 执行成功，零报错
- [ ] `SHOW TABLES;` 能看到全部 6 张表
- [ ] 所有唯一索引和普通索引都已创建
- [ ] 脚本幂等：重复执行不报错

## ✅ 完成于 2026-04-15 00:00
