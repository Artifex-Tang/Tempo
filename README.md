# Tempo · Claude Code 工作包

这个包将 Tempo 项目的完整设计转化为 Claude Code 可以直接执行的指令集。

---

## 文件清单

```
Tempo-ClaudeCode/
├── CLAUDE.md                  ★ 核心：Claude Code 项目配置文件
├── PROMPTS.md                 ★ 核心：开箱即用的提示词集合
├── README.md                  本文件
│
├── context/                   背景知识库（Claude Code 参考用）
│   ├── tech-stack.md          依赖版本约束（所有版本号以此为准）
│   ├── api-contracts.md       前后端接口契约（字段名/类型/格式）
│   ├── db-schema.md           数据库 ER 图、枚举值、索引说明
│   └── design-decisions.md    设计决策 + 常见实现陷阱
│
└── tasks/                     9 个有序任务文件
    ├── 01-project-init.md     创建目录骨架和 pom.xml
    ├── 02-database.md         编写建表 SQL（init.sql）
    ├── 03-backend-core.md     基础设施（配置/鉴权/异常/工具类）
    ├── 04-backend-modules.md  全部业务模块（Entity→Service→Controller）
    ├── 05-backend-jobs.md     定时任务（提醒推送/自动汇总）
    ├── 06-docker.md           Dockerfile + docker-compose
    ├── 07-frontend-base.md    前端基础层（app/utils/登录页）
    ├── 08-frontend-pages.md   6 个业务页面
    └── 09-integration.md      联调验证和验收标准
```

---

## 快速开始（3 步）

### 第一步：安装 Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

> 需要 Node.js 18+，详见 https://docs.claude.com/claude-code

### 第二步：准备工作目录

```bash
# 创建空项目目录
mkdir Tempo && cd Tempo

# 将本包的 CLAUDE.md 复制到项目根目录
cp /path/to/Tempo-ClaudeCode/CLAUDE.md ./CLAUDE.md

# 将 tasks/ 和 context/ 目录也复制过来（Claude Code 执行时会读取）
cp -r /path/to/Tempo-ClaudeCode/tasks ./tasks
cp -r /path/to/Tempo-ClaudeCode/context ./context
```

### 第三步：启动 Claude Code 并执行

```bash
# 在 Tempo/ 目录下启动
claude

# 然后把 PROMPTS.md 中"方式一"的内容完整粘贴给它
# Claude Code 会自动按顺序执行 01→09 全部任务
```

---

## 项目生成结果预览

执行完成后，你的 `Tempo/` 目录将包含：

```
Tempo/
├── CLAUDE.md
├── README.md
├── docker-compose.yml
├── .env.example
├── .gitignore
│
├── DayCraft/                        后端 SpringBoot 服务
│   ├── Dockerfile                   多阶段构建
│   ├── pom.xml                      Maven 依赖（SpringBoot 3.2 + MyBatis-Plus）
│   └── src/main/
│       ├── java/com/tempo/daycraft/
│       │   ├── DayCraftApplication.java
│       │   ├── config/              (4个配置类)
│       │   ├── common/              (R, ResultCode, 异常体系, UserContext)
│       │   ├── entity/              (6个实体)
│       │   ├── mapper/              (6个Mapper，含自定义SQL)
│       │   ├── dto/ vo/             (7个DTO, 1个VO)
│       │   ├── service/impl/        (6个Service完整实现)
│       │   ├── controller/          (6个Controller, 完整REST接口)
│       │   ├── job/                 (RemindJob + SummaryJob)
│       │   ├── interceptor/         (AuthInterceptor JWT鉴权)
│       │   └── util/                (JwtUtil + WxApiUtil)
│       └── resources/
│           ├── application.yml      (dev/prod双环境)
│           ├── application-custom.yml
│           └── init.sql             (6张表建表脚本)
│
└── FocusLab/                        前端微信小程序
    ├── app.js / app.json / app.wxss
    ├── utils/
    │   ├── request.js               统一HTTP封装
    │   ├── api.js                   全部业务API（20+个方法）
    │   └── util.js                  格式化工具
    └── pages/
        ├── login/                   微信一键登录
        ├── index/                   今日首页
        ├── todo/                    待办管理（含完成情况填写）
        ├── focus/                   专注计时器（CSS圆环进度）
        ├── goal/                    目标计划
        ├── summary/                 周报/月报汇总
        └── category/               分类管理
```

**代码量统计**（生成后约）：
- 后端 Java：~2500 行
- 前端 JS/WXML/WXSS：~1800 行
- SQL：~80 行
- 配置/Docker：~150 行

---

## 功能特性（Claude Code 生成的系统包含）

| 功能 | 说明 |
|------|------|
| 微信登录 | openid 静默注册，JWT token 鉴权 |
| 待办管理 | 增删改查，优先级/分类/截止日期，完成时填写情况说明 |
| 智能提醒 | 设置提醒时间 → 后端 Quartz 扫描 → 微信订阅消息推送 |
| 专注计时 | 预设时长，关联待办，完成后保存记录并累计总时长 |
| 目标计划 | 日/周/月目标，进度跟踪，达成后填写总结 |
| 自动汇总 | 每周一/每月1日自动生成完成情况报告，含文字总结 |
| Docker 部署 | MySQL + Redis + SpringBoot 一键编排，含健康检查 |

---

## 执行时间参考

在标准网络环境下（依赖下载较快时）：

| 阶段 | 预计时间 |
|------|---------|
| Task 01-03（骨架+基础层） | 5-8 分钟 |
| Task 04（业务模块，最大） | 10-15 分钟 |
| Task 05-06（Job+Docker） | 3-5 分钟 |
| Task 07-08（前端） | 8-12 分钟 |
| Task 09（联调验证） | 5-10 分钟 |
| **总计** | **约 35-50 分钟** |

---

## 注意事项

### 必须手动配置的内容
Claude Code **无法**自动获取以下内容，需要你自己填写：

1. **微信 AppID 和 Secret**：在 `.env` 文件中填写
2. **微信订阅消息模板 ID**：需要在微信公众平台申请
3. **FocusLab/project.config.json 中的 appid**：填写你的小程序 AppID
4. **生产环境域名**：`FocusLab/utils/request.js` 中的 `BASE_URL`

### 微信订阅消息说明
提醒功能需要：
- 在微信公众平台"订阅消息"中申请一个包含任务标题和提醒时间的模板
- 用户在前端需要至少点击一次"同意订阅"（`wx.requestSubscribeMessage`）
- 暂未在本包中实现前端订阅申请流程，可在 Task 08 完成后手动补充

### GitHub 仓库创建
```bash
# 安装 GitHub CLI
# https://cli.github.com/

gh repo create DayCraft  --public --description "Tempo backend: SpringBoot 3 + MySQL + Redis"
gh repo create FocusLab  --public --description "Tempo frontend: WeChat Mini Program"

# 推送
cd DayCraft && git init && git add . && git commit -m "feat: init" && git push -u origin main
cd ../FocusLab && git init && git add . && git commit -m "feat: init" && git push -u origin main
```

---

## 如果 Claude Code 执行中断

Claude Code 每次对话有上下文长度限制，长任务可能中断。处理方法：

```bash
# 重新启动 Claude Code
claude

# 使用 PROMPTS.md 中的"进度检查提示词"确认已完成到哪一步
# 然后用对应的"分步执行"提示词继续未完成的任务
```

---

## 技术支持

如果 Claude Code 生成的代码有问题，可以：
1. 查看 `context/design-decisions.md` 的"常见实现陷阱"章节
2. 使用 `PROMPTS.md` 中的"问题排查提示词"定向修复
3. 在 Claude.ai 对话中描述具体错误，获取修复方案
