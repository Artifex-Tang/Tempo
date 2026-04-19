# Task 07 — 前端基础层

## 目标
实现 FocusLab 的全局配置、工具层和登录流程，这是所有页面的基础依赖。

---

## 07-A：app.json

```json
{
  "pages": [
    "pages/index/index",
    "pages/login/login",
    "pages/todo/todo",
    "pages/goal/goal",
    "pages/focus/focus",
    "pages/summary/summary",
    "pages/category/category"
  ],
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#1A73E8",
    "backgroundColor": "#FFFFFF",
    "borderStyle": "white",
    "list": [
      { "pagePath": "pages/index/index",   "text": "今日",   "iconPath": "images/tab-home.png",    "selectedIconPath": "images/tab-home-active.png" },
      { "pagePath": "pages/focus/focus",   "text": "专注",   "iconPath": "images/tab-focus.png",   "selectedIconPath": "images/tab-focus-active.png" },
      { "pagePath": "pages/goal/goal",     "text": "目标",   "iconPath": "images/tab-goal.png",    "selectedIconPath": "images/tab-goal-active.png" },
      { "pagePath": "pages/summary/summary","text": "汇总",  "iconPath": "images/tab-summary.png", "selectedIconPath": "images/tab-summary-active.png" }
    ]
  },
  "window": {
    "navigationBarBackgroundColor": "#FFFFFF",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#F5F5F5"
  },
  "style": "v2",
  "useExtendedLib": { "weui": true },
  "sitemapLocation": "sitemap.json"
}
```

---

## 07-B：app.wxss（CSS 变量 + 全局样式）

### CSS 变量（定义在 `page` 选择器内）
```css
--color-primary:  #1A73E8
--color-success:  #52C41A
--color-warning:  #FAAD14
--color-danger:   #FF4D4F
--color-text:     #333333
--color-text-sub: #888888
--color-border:   #EEEEEE
--color-bg:       #F5F5F5
--color-card:     #FFFFFF
--radius-card:    12rpx
--shadow-card:    0 2rpx 12rpx rgba(0,0,0,0.06)
```

### 全局组件类（必须包含）
- `.card`：白底卡片，圆角，阴影，内边距 24rpx 28rpx，mb 20rpx
- `.btn-primary`：蓝底白字按钮，圆角 8rpx
- `.btn-ghost`：描边按钮，蓝色边框和文字
- `.tag`、`.tag-high`、`.tag-mid`、`.tag-low`、`.tag-done`：优先级标签
- `.empty`：空状态，居中，灰色提示文字
- `.safe-bottom`：`padding-bottom: env(safe-area-inset-bottom)`
- `.modal-mask`、`.modal-sheet`、`.modal-header`、`.modal-body`、`.modal-footer`：底部弹窗系列
- `.field`、`.field-label`、`.field-input`、`.field-textarea`、`.field-picker`：表单组件系列
- `.priority-row`、`.pri-btn`、`.pri-active-1/2/3`：优先级选择器组件样式

---

## 07-C：utils/request.js

### 功能要求
- `const BASE_URL = 'https://your-domain.com'`（顶部常量，方便修改）
- 核心 `request(url, method, data, silent)` 方法：
  - 从 `wx.getStorageSync('token')` 读 token
  - 设置 `Authorization: Bearer {token}` header
  - 响应处理：`body.code === 200` → resolve(body.data)；`body.code === 401` → 清除 storage + reLaunch 登录页 + reject；其他 → showToast(body.msg) + reject（silent=true 时不 toast）
  - 网络错误：showToast("网络异常") + reject（silent=true 时不 toast）
- 导出语法糖：`get / post / put / patch / del`

---

## 07-D：utils/api.js

按模块分组导出，每个方法是对 request.js 的薄封装：

```javascript
// 认证
auth.login(code, nickname, avatarUrl)   → POST /api/auth/login

// 待办
todo.today()                            → GET  /api/todos/today
todo.list(status, categoryId)           → GET  /api/todos
todo.create(data)                       → POST /api/todos
todo.update(id, data)                   → PUT  /api/todos/:id
todo.finish(id, status, finishNote)     → PATCH /api/todos/:id/finish
todo.remove(id)                         → DELETE /api/todos/:id
todo.statistics(days)                   → GET  /api/todos/statistics?days=N

// 目标
goal.list(type, status)                 → GET  /api/goals
goal.create(data)                       → POST /api/goals
goal.update(id, data)                   → PUT  /api/goals/:id
goal.updateProgress(id, progress)       → PATCH /api/goals/:id/progress
goal.finish(id, status, finishNote)     → PATCH /api/goals/:id/finish
goal.remove(id)                         → DELETE /api/goals/:id

// 专注
focus.record(data)                      → POST /api/focus/record
focus.dailyStats(days)                  → GET  /api/focus/daily-stats?days=N

// 分类
category.list()                         → GET  /api/categories
category.create(data)                   → POST /api/categories
category.update(id, data)              → PUT  /api/categories/:id
category.remove(id)                     → DELETE /api/categories/:id

// 汇总
summary.weekly()                        → GET  /api/summary/weekly
summary.monthly()                       → GET  /api/summary/monthly
summary.generate(type)                  → POST /api/summary/generate?type=N
```

导出：`module.exports = { auth, todo, goal, focus, category, summary }`

---

## 07-E：utils/util.js

```javascript
formatDate(date, fmt)      // fmt 支持 YYYY/MM/DD/HH/mm/ss
today()                    // 返回 'YYYY-MM-DD'
formatMinutes(min)         // 0→'0分钟', <60→'X分钟', ≥60→'X小时Y分'
priorityMap                // {1:{label:'高',color:'#FF4D4F'}, 2:..., 3:...}
statusMap                  // {0:'待办', 1:'进行中', 2:'已完成', 3:'已放弃'}
goalTypeMap                // {1:'日目标', 2:'周目标', 3:'月目标'}
throttle(fn, delay)        // 简单节流
showLoading(title) / hideLoading()
```

---

## 07-F：app.js（全局入口）

```javascript
// globalData: { userInfo: null, token: null, focusTotal: 0 }

onLaunch() {
  // 1. 从 storage 同步缓存的 token 和 userInfo 到 globalData
  // 2. 调用 _silentLogin()
}

_silentLogin() {
  // wx.login → auth.login(code) → 成功后更新 globalData 和 storage
  // 失败只 console.warn，不弹提示（静默登录）
}

checkLogin() {
  // 返回 true 如果有 token，否则 reLaunch 到 /pages/login/login 并返回 false
}
```

---

## 07-G：pages/login/

### login.js
- `onLoad`：有 token 则直接 `wx.switchTab` 到首页
- `handleLogin()`：`wx.login → auth.login → setStorage → switchTab 首页`，失败 showToast

### login.wxml
- 居中布局：logo 图片 + 应用名 "FocusLab" + 副标题"专注 · 计划 · 成长"
- "微信一键登录"按钮，`loading="{{loading}}"`
- 底部隐私提示文字

### login.wxss
- 全屏垂直布局，logo 区域居上，按钮区域居下
- 登录按钮：圆角胶囊样式，蓝色背景，阴影

### login.json
```json
{"navigationBarTitleText": "登录", "enablePullDownRefresh": false}
```

---

## 验收标准

- [ ] 微信开发者工具编译 app.js / app.json / app.wxss 零报错
- [ ] `utils/api.js` 中所有方法能被 require 且函数签名正确
- [ ] 登录页在没有 token 时正常显示
- [ ] 点击登录按钮触发 wx.login（可在开发工具 network 面板确认）
- [ ] 登录成功后 storage 中存在 `token` 键

## ✅ 完成于 2026-04-15 00:00
