# Task 06 — Docker 配置

## 目标
编写 DayCraft Dockerfile 和 Tempo 根目录的 docker-compose.yml，实现一键部署。

---

## 06-A：DayCraft/Dockerfile

### 要求
- 多阶段构建：Stage 1 用 Maven 编译，Stage 2 用 JRE 运行
- Stage 1 基础镜像：`maven:3.9.6-eclipse-temurin-17`
- Stage 2 基础镜像：`eclipse-temurin:17-jre-alpine`
- 先 COPY pom.xml 跑 `dependency:go-offline`，再 COPY src（利用 Docker 缓存层）
- 创建非 root 用户 `tempo`，以该用户运行
- 设置时区 `Asia/Shanghai`（apk 安装 tzdata 后复制）
- JVM 参数通过 `ENV JAVA_OPTS` 设置：
  ```
  -XX:+UseContainerSupport
  -XX:MaxRAMPercentage=75.0
  -XX:+UseG1GC
  -Djava.security.egd=file:/dev/./urandom
  -Dfile.encoding=UTF-8
  -Duser.timezone=Asia/Shanghai
  ```
- EXPOSE 8080
- ENTRYPOINT：`["sh", "-c", "java $JAVA_OPTS -jar app.jar"]`

---

## 06-B：Tempo/docker-compose.yml

### 三个服务

#### mysql
```yaml
image: mysql:8.0
container_name: tempo-mysql
environment:
  MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root_secret}
  MYSQL_DATABASE: ${DB_NAME:-tempo}
  MYSQL_USER: ${DB_USER:-tempo}
  MYSQL_PASSWORD: ${DB_PASSWORD}   # 无默认值，必须在 .env 中设置
  TZ: Asia/Shanghai
volumes:
  - mysql_data:/var/lib/mysql
  - ./DayCraft/src/main/resources/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
healthcheck:
  test: mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD:-root_secret}
  interval: 10s / timeout: 5s / retries: 5
```

#### redis
```yaml
image: redis:7-alpine
container_name: tempo-redis
command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
volumes:
  - redis_data:/data
healthcheck:
  test: redis-cli ping
  interval: 10s / timeout: 3s / retries: 5
```

#### daycraft
```yaml
build:
  context: ./DayCraft
  dockerfile: Dockerfile
container_name: tempo-daycraft
depends_on:
  mysql: {condition: service_healthy}
  redis: {condition: service_healthy}
environment:
  SPRING_PROFILES_ACTIVE: prod
  DB_HOST: mysql
  DB_PORT: 3306
  DB_NAME: ${DB_NAME:-tempo}
  DB_USER: ${DB_USER:-tempo}
  DB_PASSWORD: ${DB_PASSWORD}
  REDIS_HOST: redis
  REDIS_PORT: 6379
  REDIS_PASSWORD: ${REDIS_PASSWORD:-}
  WX_APPID: ${WX_APPID}
  WX_SECRET: ${WX_SECRET}
  WX_TEMPLATE_ID: ${WX_TEMPLATE_ID:-}
  JWT_SECRET: ${JWT_SECRET}
  AI_ENABLED: ${AI_ENABLED:-false}
  AI_API_KEY: ${AI_API_KEY:-}
ports:
  - "8080:8080"
healthcheck:
  test: wget -qO- http://localhost:8080/actuator/health
  interval: 30s / timeout: 10s / retries: 3 / start_period: 60s
logging:
  driver: json-file
  options: {max-size: "50m", max-file: "5"}
```

### volumes
```yaml
volumes:
  mysql_data:
  redis_data:
```

### networks
```yaml
networks:
  tempo-net:
    driver: bridge
```
所有服务都加入 `tempo-net`。

---

## 06-C：Tempo/.env.example

包含所有环境变量的说明和示例值（不含真实密钥）：

```bash
# 数据库
MYSQL_ROOT_PASSWORD=root_change_me
DB_NAME=tempo
DB_USER=tempo
DB_PASSWORD=tempo_change_me        # 必填

# Redis（无密码留空）
REDIS_PASSWORD=

# 微信小程序
WX_APPID=your_wx_appid_here        # 必填
WX_SECRET=your_wx_secret_here      # 必填
WX_TEMPLATE_ID=                    # 订阅消息模板ID，不用提醒可留空

# JWT 签名密钥（生产环境必须改，建议 openssl rand -hex 32 生成）
JWT_SECRET=change-this-to-a-very-long-random-string

# AI 总结（可选）
AI_ENABLED=false
AI_API_KEY=
AI_API_URL=https://api.deepseek.com/v1/chat/completions
```

---

## 验收标准

- [ ] `docker build -t daycraft:test DayCraft/` 构建成功
- [ ] `docker compose up -d` 三个服务全部启动
- [ ] `docker compose ps` 三个服务状态均为 healthy（等待约 90 秒）
- [ ] `curl localhost:8080/actuator/health` 返回 `{"status":"UP"}`
- [ ] `docker compose down -v` 能干净停止并清除 volumes

## ✅ 完成于 2026-04-15 00:00
