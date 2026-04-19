# Task 05 — 定时任务

## 目标
实现两个定时任务：提醒推送（每分钟）和汇总生成（周/月）。

---

## 05-A：RemindJob.java

位置：`job/RemindJob.java`

### 执行时机
`@Scheduled(cron = "0 * * * * *")` — 每分钟整点

### 执行逻辑

```
1. 查询 TodoMapper.selectPendingReminders(now, now+1min)
2. 若列表为空，直接返回
3. 获取 access_token（从 Redis 缓存读，缓存 key="wx:access_token"）
   a. 缓存命中 → 直接用
   b. 缓存未命中 → 调微信接口获取，写入 Redis，TTL = expires_in - 300 秒
   c. 获取失败 → 记 warn 日志，本次跳过推送（不抛异常）
4. 遍历每条 todo：
   a. 查对应 user 的 openid
   b. 调 WxApiUtil.sendSubscribeMessage(openid, todo.title, 格式化提醒时间, accessToken)
   c. 调 TodoMapper.markRemindSent(todo.id)
   d. 任何异常只记 error 日志，不中断循环
```

### access_token 获取 URL
```
GET https://api.weixin.qq.com/cgi-bin/token
    ?grant_type=client_credential
    &appid={WX_APPID}
    &secret={WX_SECRET}
```

### 提醒时间格式化
`remindTime.format(DateTimeFormatter.ofPattern("MM-dd HH:mm")) + " 提醒"`

---

## 05-B：SummaryJob.java

位置：`job/SummaryJob.java`

### 执行时机
- 周报：`@Scheduled(cron = "0 0 1 * * MON")` — 每周一凌晨 1:00
- 月报：`@Scheduled(cron = "0 30 1 1 * *")` — 每月 1 日凌晨 1:30

### 执行逻辑

```
1. SELECT * FROM t_user （全量查，个人项目用户量小）
2. 遍历每个 user，调 SummaryService.generateWeekly/generateMonthly
3. 统计 success/fail 数，最终 log.info("完成: success={} fail={}")
4. 单个用户失败只记 error 日志，不中断整体循环
```

---

## 注意事项

- 两个 Job 类都要加 `@Component`
- 不需要 Quartz 的 JobDetail / Trigger 配置，直接用 `@Scheduled`
- `@EnableScheduling` 已在主启动类声明，这里无需重复

---

## 验收标准

- [ ] 启动日志中能看到 Quartz/Scheduling 初始化信息
- [ ] 将某条 todo 的 remind_time 设为下一分钟，等待 RemindJob 执行后 remind_sent 变为 1
- [ ] SummaryJob 在 cron 触发时不报错（即使没有用户数据）

## ✅ 完成于 2026-04-15 00:00
