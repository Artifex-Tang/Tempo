# Task 01 — 项目骨架初始化

## 目标
创建 DayCraft 和 FocusLab 两个完整的项目目录骨架，包含所有必要的空文件占位和配置文件。

---

## DayCraft 目录结构

执行以下操作，创建完整的 Maven 标准目录：

```
DayCraft/
├── pom.xml
├── Dockerfile
├── .gitignore
├── .dockerignore
├── README.md
└── src/
    ├── main/
    │   ├── java/com/tempo/daycraft/
    │   │   ├── DayCraftApplication.java
    │   │   ├── common/
    │   │   │   ├── UserContext.java
    │   │   │   ├── result/
    │   │   │   │   ├── R.java
    │   │   │   │   └── ResultCode.java
    │   │   │   └── exception/
    │   │   │       ├── BusinessException.java
    │   │   │       ├── UnauthorizedException.java
    │   │   │       └── GlobalExceptionHandler.java
    │   │   ├── config/
    │   │   │   ├── WebConfig.java
    │   │   │   ├── MybatisPlusConfig.java
    │   │   │   ├── RedisConfig.java
    │   │   │   └── Knife4jConfig.java
    │   │   ├── interceptor/
    │   │   │   └── AuthInterceptor.java
    │   │   ├── entity/
    │   │   │   ├── User.java
    │   │   │   ├── Category.java
    │   │   │   ├── Todo.java
    │   │   │   ├── Goal.java
    │   │   │   ├── FocusRecord.java
    │   │   │   └── Summary.java
    │   │   ├── mapper/
    │   │   │   ├── UserMapper.java
    │   │   │   ├── CategoryMapper.java
    │   │   │   ├── TodoMapper.java
    │   │   │   ├── GoalMapper.java
    │   │   │   ├── FocusRecordMapper.java
    │   │   │   └── SummaryMapper.java
    │   │   ├── dto/
    │   │   │   ├── LoginDTO.java
    │   │   │   ├── TodoDTO.java
    │   │   │   ├── TodoFinishDTO.java
    │   │   │   ├── GoalDTO.java
    │   │   │   ├── FocusStartDTO.java
    │   │   │   └── CategoryDTO.java
    │   │   ├── vo/
    │   │   │   └── LoginVO.java
    │   │   ├── service/
    │   │   │   ├── AuthService.java
    │   │   │   ├── TodoService.java
    │   │   │   ├── GoalService.java
    │   │   │   ├── FocusService.java
    │   │   │   ├── CategoryService.java
    │   │   │   ├── SummaryService.java
    │   │   │   └── impl/
    │   │   │       ├── AuthServiceImpl.java
    │   │   │       ├── TodoServiceImpl.java
    │   │   │       ├── GoalServiceImpl.java
    │   │   │       ├── FocusServiceImpl.java
    │   │   │       ├── CategoryServiceImpl.java
    │   │   │       └── SummaryServiceImpl.java
    │   │   ├── controller/
    │   │   │   ├── AuthController.java
    │   │   │   ├── TodoController.java
    │   │   │   ├── GoalController.java
    │   │   │   ├── FocusController.java
    │   │   │   ├── CategoryController.java
    │   │   │   └── SummaryController.java
    │   │   ├── job/
    │   │   │   ├── RemindJob.java
    │   │   │   └── SummaryJob.java
    │   │   └── util/
    │   │       ├── JwtUtil.java
    │   │       └── WxApiUtil.java
    │   └── resources/
    │       ├── application.yml
    │       ├── application-custom.yml
    │       └── init.sql
    └── test/
        └── java/com/tempo/daycraft/
            └── DayCraftApplicationTests.java
```

## pom.xml 依赖清单

必须包含以下依赖（版本见 context/tech-stack.md）：

```xml
<!-- 核心 -->
spring-boot-starter-web
spring-boot-starter-validation
spring-boot-starter-data-redis
spring-boot-starter-actuator

<!-- 数据库 -->
mybatis-plus-spring-boot3-starter (3.5.6)
mysql-connector-j

<!-- 文档 -->
knife4j-openapi3-jakarta-spring-boot-starter (4.5.0)

<!-- JWT -->
jjwt-api / jjwt-impl / jjwt-jackson (0.12.5)

<!-- 工具 -->
hutool-all (5.8.26)
lombok
```

## FocusLab 目录结构

```
FocusLab/
├── app.js
├── app.json
├── app.wxss
├── project.config.json.template
├── .gitignore
├── README.md
├── utils/
│   ├── request.js
│   ├── api.js
│   └── util.js
├── images/                    （空目录，存放 TabBar 图标）
└── pages/
    ├── login/
    │   ├── login.js
    │   ├── login.wxml
    │   ├── login.wxss
    │   └── login.json
    ├── index/
    │   ├── index.js
    │   ├── index.wxml
    │   ├── index.wxss
    │   └── index.json
    ├── todo/
    │   ├── todo.js
    │   ├── todo.wxml
    │   ├── todo.wxss
    │   └── todo.json
    ├── focus/
    │   ├── focus.js
    │   ├── focus.wxml
    │   ├── focus.wxss
    │   └── focus.json
    ├── goal/
    │   ├── goal.js
    │   ├── goal.wxml
    │   ├── goal.wxss
    │   └── goal.json
    ├── summary/
    │   ├── summary.js
    │   ├── summary.wxml
    │   ├── summary.wxss
    │   └── summary.json
    └── category/
        ├── category.js
        ├── category.wxml
        ├── category.wxss
        └── category.json
```

## 验收标准

- [ ] `DayCraft/pom.xml` 存在且包含所有依赖
- [ ] `mvn validate` 通过（不报 pom 错误）
- [ ] 所有 Java 文件至少有 package 声明和 class 定义（不是空文件）
- [ ] `FocusLab/app.json` 包含所有页面路径注册
- [ ] `FocusLab/utils/` 下三个文件存在

## ✅ 完成于 2026-04-15 00:00
