# Task 03 — 后端基础设施

## 目标
实现后端的基础层：配置、鉴权、统一响应、工具类。这些是其他模块的依赖前提。

---

## 03-A：application.yml 配置

文件：`DayCraft/src/main/resources/application.yml`

要求：
- 顶部公共段：`spring.application.name=daycraft`，`spring.profiles.active=${SPRING_PROFILES_ACTIVE:dev}`，`spring.config.import=optional:classpath:application-custom.yml`
- `---` 分隔 dev 和 prod 两个 profile
- dev：连接 localhost:3306/tempo_dev，redis localhost:6379
- prod：所有连接参数从环境变量读取（`${DB_HOST:mysql}` 格式，有默认值）
- 末尾公共段：actuator 只暴露 health 和 info，日志级别 `com.tempo.daycraft: INFO`

文件：`DayCraft/src/main/resources/application-custom.yml`

```yaml
tempo:
  jwt:
    secret: ${JWT_SECRET:tempo-dev-secret-change-in-prod}
    expire: 604800        # 7天，秒
  wx:
    appid: ${WX_APPID:your_appid}
    secret: ${WX_SECRET:your_secret}
    subscribe-template-id: ${WX_TEMPLATE_ID:}
    jscode2session-url: https://api.weixin.qq.com/sns/jscode2session
  cors:
    allowed-origins:
      - http://localhost:3000
      - http://localhost:8081
  ai:
    enabled: ${AI_ENABLED:false}
    api-key: ${AI_API_KEY:}
    api-url: ${AI_API_URL:https://api.deepseek.com/v1/chat/completions}
    model: deepseek-chat
```

---

## 03-B：统一响应体

### `common/result/ResultCode.java`
枚举，包含：
```
SUCCESS(200, "操作成功")
ERROR(500, "系统繁忙，请稍后重试")
PARAM_ERROR(400, "请求参数有误")
UNAUTHORIZED(401, "未登录或登录已过期")
FORBIDDEN(403, "无权限访问")
NOT_FOUND(404, "资源不存在")
WX_LOGIN_FAIL(1001, "微信登录失败")
WX_PUSH_FAIL(1002, "消息推送失败")
TODO_NOT_FOUND(1100, "待办任务不存在")
GOAL_NOT_FOUND(1200, "目标计划不存在")
CATEGORY_DUPLICATE(1300, "分类名称已存在")
```

### `common/result/R.java`
泛型响应体 `R<T>`，字段：`int code`、`String msg`、`T data`。
方法：`R.ok()`、`R.ok(data)`、`R.ok(msg, data)`、`R.fail(msg)`、`R.fail(ResultCode)`、`R.fail(code, msg)`、`boolean isSuccess()`。
序列化：`@JsonInclude(NON_NULL)`，null 字段不序列化。

---

## 03-C：异常体系

### `common/exception/BusinessException.java`
- 继承 `RuntimeException`
- 字段：`int code`、`String msg`
- 构造器：`(ResultCode)`、`(int code, String msg)`、`(String msg)`

### `common/exception/UnauthorizedException.java`
- 继承 `RuntimeException`
- 默认消息："未登录或登录已过期"

### `common/exception/GlobalExceptionHandler.java`
- `@RestControllerAdvice`
- 处理：`BusinessException`→返回对应code/msg；`MethodArgumentNotValidException`→400；`ConstraintViolationException`→400；`BindException`→400；`UnauthorizedException`→401；`Exception`→500
- 所有异常处理方法返回 `R<Void>`

---

## 03-D：用户上下文

### `common/UserContext.java`
ThreadLocal 存储当前请求的 userId（Long 类型）。
方法：`set(Long)`、`get()`、`clear()`。

---

## 03-E：配置类

### `config/MybatisPlusConfig.java`
- 注册 `PaginationInnerInterceptor`（MySQL 方言）
- 注册 `MetaObjectHandler`：insert 时自动填充 `createdAt` 和 `updatedAt`，update 时填充 `updatedAt`

### `config/RedisConfig.java`
- 配置 `RedisTemplate<String, Object>`
- key 序列化：`StringRedisSerializer`
- value 序列化：`Jackson2JsonRedisSerializer`，ObjectMapper 开启 `DefaultTyping.NON_FINAL`，注册 `JavaTimeModule`，禁用 `WRITE_DATES_AS_TIMESTAMPS`

### `config/WebConfig.java`
- 实现 `WebMvcConfigurer`
- `addCorsMappings`：`/api/**` 允许跨域，允许的 origin 从 `${tempo.cors.allowed-origins}` 读取
- `addInterceptors`：`AuthInterceptor` 拦截 `/api/**`，放行 `/api/auth/login`

### `config/Knife4jConfig.java`
- 配置 OpenAPI Bean，title="DayCraft API"，version="1.0.0"
- 配置 Bearer JWT SecurityScheme

---

## 03-F：工具类

### `util/JwtUtil.java`
- `@Component`，从 `${tempo.jwt.secret}` 和 `${tempo.jwt.expire}` 读配置
- `@PostConstruct` 初始化 `SecretKey`（HMAC-SHA）
- `generateToken(Long userId)` → String
- `parseUserId(String token)` → Long，失败抛 `UnauthorizedException`

### `util/WxApiUtil.java`
- `@Component`
- `getOpenid(String code)` → String：调用微信 jscode2session，失败抛 `BusinessException(WX_LOGIN_FAIL)`
- `sendSubscribeMessage(String openid, String title, String remindMsg, String accessToken)` → void：调用微信订阅消息接口，失败只记 warn 日志，不抛异常

### `interceptor/AuthInterceptor.java`
- `preHandle`：从 `Authorization: Bearer {token}` 解析 userId 写入 `UserContext`
- `afterCompletion`：调用 `UserContext.clear()`
- 无 token 或解析失败抛 `UnauthorizedException`

### `DayCraftApplication.java`
- `@SpringBootApplication`
- `@MapperScan("com.tempo.daycraft.mapper")`
- `@EnableScheduling`

---

## 验收标准

- [ ] `mvn compile` 通过
- [ ] `R.ok("test")` 序列化后 JSON 包含 `{"code":200,"msg":"操作成功","data":"test"}`
- [ ] `JwtUtil` 生成的 token 能被同一实例解析出 userId
- [ ] `GlobalExceptionHandler` 能捕获 `BusinessException` 并返回正确的 code/msg

## ✅ 完成于 2026-04-15 00:00
