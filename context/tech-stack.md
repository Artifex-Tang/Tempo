# 技术栈版本约束

Claude Code 在生成依赖和代码时必须严格遵守以下版本，不得自行升降级。

## 后端（DayCraft）

| 依赖 | groupId | artifactId | 版本 |
|------|---------|-----------|------|
| SpringBoot Parent | org.springframework.boot | spring-boot-starter-parent | **3.2.5** |
| Java | — | — | **17** |
| MyBatis-Plus | com.baomidou | mybatis-plus-spring-boot3-starter | **3.5.6** |
| MySQL Connector | com.mysql | mysql-connector-j | （随 SpringBoot BOM） |
| Knife4j | com.github.xiaoymin | knife4j-openapi3-jakarta-spring-boot-starter | **4.5.0** |
| jjwt-api | io.jsonwebtoken | jjwt-api | **0.12.5** |
| jjwt-impl | io.jsonwebtoken | jjwt-impl | **0.12.5** |
| jjwt-jackson | io.jsonwebtoken | jjwt-jackson | **0.12.5** |
| Hutool | cn.hutool | hutool-all | **5.8.26** |
| Lombok | org.projectlombok | lombok | （随 SpringBoot BOM） |
| Actuator | org.springframework.boot | spring-boot-starter-actuator | （随 SpringBoot BOM） |

## 运行时环境

| 组件 | 版本 |
|------|------|
| MySQL | **8.0** |
| Redis | **7-alpine**（Docker）|
| JRE（运行） | eclipse-temurin:**17-jre-alpine** |
| JDK（构建） | maven:**3.9.6-eclipse-temurin-17** |

## 前端（FocusLab）

| 组件 | 版本/要求 |
|------|---------|
| 微信基础库 | **2.30.1**（project.config.json 中 libVersion） |
| WeUI | 通过 `useExtendedLib: {weui: true}` 引入（无需手动安装） |
| 框架 | 原生微信小程序，**不使用** uni-app / Taro |

## 前端（FocusWeb · Web 端）

| 组件 | 版本 |
|------|------|
| React | **18** |
| Vite | **5** |
| TypeScript | **5.6** |
| Ant Design | **5** |
| react-router-dom | **6** |
| recharts | **2** |
| Vitest | **1.6**（单元） |
| Playwright | **1.x**（E2E） |

> 不要升级到 React 19 / antd 6 / RRD 7 / Vite 8 / TS 6 —— 页面代码与 E2E 选择器均按此大版本编写。Docker 构建镜像用 `node:22-alpine`。

## 禁止使用的依赖

以下依赖在本项目中**禁止使用**：
- Spring Security（用自定义 JWT 拦截器替代）
- Spring Data JPA / Hibernate（用 MyBatis-Plus 替代）
- Quartz XML 配置（用 @Scheduled 注解替代）
- 任何 uni-app / Taro / mpvue 相关包（前端用原生）
