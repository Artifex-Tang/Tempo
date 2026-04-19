CREATE DATABASE IF NOT EXISTS tempo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tempo;

CREATE TABLE IF NOT EXISTS t_user (
    id          BIGINT      PRIMARY KEY AUTO_INCREMENT,
    openid      VARCHAR(64) NOT NULL,
    nickname    VARCHAR(50),
    avatar_url  VARCHAR(512),
    focus_total INT         DEFAULT 0 COMMENT '累计专注分钟（冗余字段，提升查询性能）',
    created_at  DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS t_category (
    id          BIGINT      PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    name        VARCHAR(50) NOT NULL,
    color       VARCHAR(20),
    icon        VARCHAR(50),
    sort_order  INT         DEFAULT 0,
    created_at  DATETIME    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_name (user_id, name),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS t_todo (
    id           BIGINT       PRIMARY KEY AUTO_INCREMENT,
    user_id      BIGINT       NOT NULL,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    category_id  BIGINT,
    priority     TINYINT      DEFAULT 2 COMMENT '1高 2中 3低',
    status       TINYINT      DEFAULT 0 COMMENT '0待办 1进行中 2已完成 3已放弃',
    remind_time  DATETIME,
    remind_sent  TINYINT      DEFAULT 0 COMMENT '0未发 1已发',
    due_date     DATE,
    finish_time  DATETIME,
    finish_note  TEXT,
    sort_order   INT          DEFAULT 0,
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_user_status (user_id, status),
    KEY idx_user_due (user_id, due_date),
    KEY idx_remind (remind_time, remind_sent),
    KEY idx_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS t_goal (
    id           BIGINT       PRIMARY KEY AUTO_INCREMENT,
    user_id      BIGINT       NOT NULL,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    type         TINYINT      DEFAULT 1 COMMENT '1日目标 2周目标 3月目标',
    target_date  DATE         NOT NULL,
    status       TINYINT      DEFAULT 0 COMMENT '0进行中 1已达成 2未达成',
    progress     TINYINT      DEFAULT 0,
    finish_note  TEXT,
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_user_date (user_id, target_date),
    KEY idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS t_focus_record (
    id           BIGINT   PRIMARY KEY AUTO_INCREMENT,
    user_id      BIGINT   NOT NULL,
    todo_id      BIGINT,
    goal_id      BIGINT,
    duration_min INT      NOT NULL,
    start_time   DATETIME NOT NULL,
    end_time     DATETIME NOT NULL,
    note         VARCHAR(255),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY idx_user_time (user_id, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS t_summary (
    id               BIGINT   PRIMARY KEY AUTO_INCREMENT,
    user_id          BIGINT   NOT NULL,
    type             TINYINT  NOT NULL COMMENT '1周报 2月报',
    period_start     DATE     NOT NULL,
    period_end       DATE     NOT NULL,
    todo_total       INT      DEFAULT 0,
    todo_done        INT      DEFAULT 0,
    focus_total_min  INT      DEFAULT 0,
    goal_total       INT      DEFAULT 0,
    goal_done        INT      DEFAULT 0,
    ai_summary       TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_period (user_id, type, period_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
