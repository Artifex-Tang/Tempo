# Task 09 — 联调验证

## 目标
端到端验证整个系统正常工作，修复联调中发现的问题。

---

## 09-A：后端启动验证

### 步骤 1：本地启动

```bash
cd DayCraft

# 先确保 MySQL 和 Redis 在运行
# 修改 application.yml dev 段的数据库密码为本地实际密码

mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### 步骤 2：验证基础接口

```bash
# 健康检查
curl -s http://localhost:8080/actuator/health | python3 -m json.tool

# 登录（用 test code，实际要用微信真实 code）
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code"}' | python3 -m json.tool

# 用返回的 token 测试鉴权
TOKEN="从上面拿到的token"
curl -s http://localhost:8080/api/todos/today \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### 检查清单
- [ ] 启动日志无 ERROR 级别异常
- [ ] `/actuator/health` 返回 `{"status":"UP"}`
- [ ] 访问 `http://localhost:8080/doc.html` 能看到 Knife4j 文档
- [ ] 文档中有 6 个 Tag：认证、待办任务、目标计划、专注记录、任务分类、完成情况汇总

---

## 09-B：核心流程验证

### 待办完整流程

```bash
# 1. 创建待办
curl -s -X POST http://localhost:8080/api/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"联调测试任务","priority":1,"dueDate":"2026-12-31"}' \
  | python3 -m json.tool

# 记录返回的 id，如 ID=1

# 2. 查看今日待办（应该包含刚创建的）
curl -s http://localhost:8080/api/todos/today \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 3. 完成任务，填写情况
curl -s -X PATCH http://localhost:8080/api/todos/$ID/finish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":2,"finishNote":"联调测试完成，一切正常"}' \
  | python3 -m json.tool

# 4. 查看统计
curl -s "http://localhost:8080/api/todos/statistics?days=7" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### 专注记录流程

```bash
# 保存一次专注记录
curl -s -X POST http://localhost:8080/api/focus/record \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"durationMin":25,"note":"联调测试专注"}' \
  | python3 -m json.tool

# 查看每日统计
curl -s "http://localhost:8080/api/focus/daily-stats?days=7" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### 手动触发汇总

```bash
# 触发本周汇总生成
curl -s -X POST "http://localhost:8080/api/summary/generate?type=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 查看周汇总
curl -s http://localhost:8080/api/summary/weekly \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## 09-C：前端联调配置

### 修改 BASE_URL

```javascript
// FocusLab/utils/request.js
// 开发时改为本机 IP（手机真机调试需要局域网 IP）
const BASE_URL = 'http://192.168.x.x:8080'
// 或者直接用本地端口（开发工具模拟器可以用 localhost）
const BASE_URL = 'http://localhost:8080'
```

### 微信开发者工具设置

在"详情 → 本地设置"中勾选：
- ✅ 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书
- ✅ 不校验 request 合法域名

### 前端验证步骤

1. 打开微信开发者工具，导入 `FocusLab/` 目录
2. 编译，确认控制台无红色错误
3. 进入登录页，点击"微信一键登录"
4. 成功后应跳转到今日首页
5. 验证以下操作链路：
   - [ ] 首页正常加载（有 loading → 显示列表或空状态）
   - [ ] 点击"待办"标签，能进入待办页
   - [ ] 创建一个待办（标题必填），刷新后出现在列表
   - [ ] 点击"完成"，填写完成情况，提交后状态变更
   - [ ] 进入"专注"tab，选择 25 分钟，点击开始，倒计时正常运转
   - [ ] 结束专注，填写备注，保存后"今日专注"数据更新
   - [ ] 进入"目标"tab，创建一个周目标
   - [ ] 进入"汇总"tab，点击"重新生成汇总"，数据刷新

---

## 09-D：常见问题排查

### 后端启动报错：数据库连接失败
- 确认 MySQL 正在运行：`mysql -u root -p`
- 确认数据库已创建：`SHOW DATABASES LIKE 'tempo%'`
- 确认 application.yml 中 dev profile 的密码正确

### 后端启动报错：MyBatis mapper 未找到
- 确认 `@MapperScan("com.tempo.daycraft.mapper")` 在启动类上
- 确认 mapper 包路径与 MapperScan 一致

### 前端提示"网络异常"
- 确认后端已启动
- 确认 BASE_URL 正确（模拟器用 localhost，真机用局域网 IP）
- 确认已勾选"不校验合法域名"

### 前端登录后立即跳回登录页
- 检查后端 `/api/auth/login` 是否正常返回 token
- 检查 `wx.setStorageSync('token', ...)` 是否成功执行
- 在微信开发者工具"Storage"面板确认 token 是否存入

### 定时任务不触发提醒
- 确认已在微信公众平台申请订阅消息模板
- 确认 `application-custom.yml` 中 `wx.subscribe-template-id` 已填写
- 确认用户在前端已点击"同意订阅"（`wx.requestSubscribeMessage`）
- 检查 Redis 中 `wx:access_token` 是否存入

---

## 09-E：Docker Compose 完整验证

```bash
cd Tempo

# 1. 复制并填写环境变量
cp .env.example .env
# 编辑 .env，至少填写：DB_PASSWORD、WX_APPID、WX_SECRET、JWT_SECRET

# 2. 构建并启动
docker compose up -d --build

# 3. 等待服务健康（约 60-90 秒）
docker compose ps

# 4. 验证
curl -s http://localhost:8080/actuator/health

# 5. 查看日志
docker compose logs daycraft --tail=50

# 6. 清理
docker compose down  # 保留 volumes
docker compose down -v  # 含 volumes 全清
```

---

## 最终验收标准

### 后端
- [ ] `mvn clean package -DskipTests` 零错误
- [ ] 所有 9 个核心 API curl 测试通过
- [ ] `docker compose up -d` 三服务 healthy
- [ ] 定时任务在日志中有记录

### 前端
- [ ] 微信开发者工具编译零错误
- [ ] 登录 → 首页 → 待办增删改完成 → 专注计时保存 → 汇总查看，全链路通畅

### 文档
- [ ] `DayCraft/README.md` 包含启动说明
- [ ] `FocusLab/README.md` 包含配置说明
- [ ] `Tempo/README.md` 包含完整架构和快速启动
- [ ] `.env.example` 所有变量都有说明注释

## ✅ 完成于 2026-04-15 00:00
