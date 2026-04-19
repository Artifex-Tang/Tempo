# Task 08 — 前端业务页面

## 目标
实现所有业务页面。每个页面包含 .js / .wxml / .wxss / .json 四个文件。

---

## 通用要求（所有页面）

- `onShow` 或 `onLoad` 中调用数据加载方法
- 支持下拉刷新（json 中 `"enablePullDownRefresh": true`，onPullDownRefresh 处理完调 `wx.stopPullDownRefresh()`）
- 数据加载期间显示 loading 状态（data 中 `loading: true`），完成后设为 false
- 列表为空时显示 `.empty` 占位提示
- 所有 API 调用用 try-catch 包裹，catch 中不处理（request.js 已统一处理）
- 页面间跳转：tabBar 页面用 `wx.switchTab`，非 tabBar 用 `wx.navigateTo`

---

## 08-A：pages/index/（今日首页）

### 数据
```javascript
data: {
  userInfo: null,      // 从 storage 读
  date: '',            // 'MM月DD日' 格式
  todayTodos: [],
  weeklyStat: null,    // 可能为 null
  loading: false
}
```

### 功能
- `onLoad`：设置 date 和 userInfo
- `onShow`：调 `_loadData()`
- `_loadData()`：并行请求 `todo.today()` 和 `summary.weekly()`
- `quickDone(e)`：点击圆形 checkbox，调 `todo.finish(id, 2, '')` → showToast → reload
- `goToTodo()`：`navigateTo` 待办页

### WXML 结构
```
顶部：用户头像 + 问候语 + 日期
本周统计卡（weeklyStat 有值才显示）：完成任务数、专注分钟、目标达成数/总数
"今日待办" section header + "查看全部"链接
  → loading 状态：文字提示
  → 空状态：文字 + 新建按钮
  → 列表：每项含圆形 checkbox、标题、截止日期、优先级色点
快捷入口：待办/专注/目标/汇总 四个图标格子
```

### 页面 JSON
```json
{"navigationBarTitleText": "今日", "enablePullDownRefresh": true}
```

---

## 08-B：pages/todo/（待办管理）

### 数据
```javascript
data: {
  todos: [],
  categories: [],
  loading: false,
  activeStatus: null,          // null=全部, 0/1/2/3
  activeCatId: null,
  showModal: false,            // 新建/编辑弹窗
  isEdit: false,
  editId: null,
  form: { title:'', description:'', priority:2, categoryId:null, dueDate:'', remindTime:'' },
  showFinishModal: false,      // 完成情况弹窗
  finishId: null,
  finishStatus: 2,
  finishNote: ''
}
```

### 功能
- 状态筛选 tabs：全部 / 待办 / 进行中 / 已完成
- 新建/编辑同一个底部弹窗（showModal）
- 完成/放弃：单独的底部弹窗（showFinishModal），包含结果选择（完成/放弃）和情况填写文本框
- 删除：wx.showModal 二次确认
- 表单字段：标题(input)、描述(textarea)、优先级(三按钮单选)、截止日期(picker date)、提醒时间(picker dateTime)

### WXML 结构
```
状态筛选栏（scroll-view 横滚）
待办列表：
  每项：
    左侧优先级色条 + 标题 + 元信息（截止日、提醒标记）+ 完成备注（有则显示）
    右侧操作：完成按钮（status<2时）/ 编辑 / 删除
右下角 FAB 新建按钮（position:fixed）
底部弹窗：新建/编辑表单
底部弹窗：完成情况填写
```

### 页面 JSON
```json
{"navigationBarTitleText": "待办", "enablePullDownRefresh": true}
```

---

## 08-C：pages/focus/（专注计时）

### 数据
```javascript
data: {
  phase: 'idle',        // idle | running | paused | done
  presets: [25, 45, 60, 90],
  selectedMin: 25,
  remaining: 1500,      // 秒
  elapsed: 0,           // 已用秒
  progress: 0,          // 0-100，用于圆环 CSS
  todos: [],            // 当前待办列表（供关联）
  linkedTodoId: null,
  linkedTitle: '',
  todayMin: 0,
  showDoneModal: false,
  doneNote: ''
}
```

### 计时器实现
- 用 `setInterval` 每秒 -1，存在 `this._timer`
- `onUnload` 时必须 `clearInterval(this._timer)`
- 计时结束：clearInterval → phase='done' → `wx.vibrateShort` → showDoneModal=true

### 圆环进度
用 CSS `conic-gradient` 实现：
```css
.progress-ring {
  background: conic-gradient(
    var(--color-primary) calc(var(--p, 0) * 1%),
    #EEEEEE 0
  );
}
```
通过 style 内联 `--p:{{progress}}` 传值。

### WXML 结构
```
计时圆环（480rpx × 480rpx）
  内层白圆：显示倒计时数字 + 状态文字 + 关联任务名
  外层进度环：CSS conic-gradient
预设时长按钮组（idle 状态显示）
控制按钮：
  idle → "开始专注"
  running → "暂停"
  paused → "结束" + "继续"（并排）
关联待办列表（idle 状态，scroll-view 限高）
今日专注统计（底部小卡片）
完成弹窗：本次时长 + 备注输入框 + 跳过/保存
```

### 页面 JSON
```json
{"navigationBarTitleText": "专注", "enablePullDownRefresh": false}
```

---

## 08-D：pages/goal/（目标计划）

### 数据
```javascript
data: {
  goals: [],
  loading: false,
  activeType: null,    // null=全部 1/2/3
  typeLabels: ['全部', '日', '周', '月'],
  showModal: false,
  isEdit: false,
  editId: null,
  form: { title:'', description:'', type:2, targetDate:'' },
  showFinishModal: false,
  finishId: null,
  finishStatus: 1,
  finishNote: ''
}
```

### WXML 结构
```
类型筛选 chips（全部/日/周/月）
目标列表卡片，每张卡片包含：
  头部：类型徽章（日/周/月，不同颜色）+ 标题 + 状态徽章
  描述文字（有则显示）
  截止日期
  进度条（status=0 时显示）
  完成备注（有则显示）
  操作栏：编辑 / 完成（status=0时）/ 删除
FAB 新建按钮
底部弹窗：新建/编辑（标题、描述、类型三按钮、截止日期picker）
底部弹窗：完成结果（已达成/未达成 + 总结文本框）
```

### 页面 JSON
```json
{"navigationBarTitleText": "目标", "enablePullDownRefresh": true}
```

---

## 08-E：pages/summary/（汇总）

### 数据
```javascript
data: {
  tab: 'weekly',       // 'weekly' | 'monthly'
  weekly: null,
  monthly: null,
  loading: false,
  generating: false
}
```

### WXML 结构
```
Tab 切换（本周/本月，滑块式）
有数据时：
  期间标签（periodStart ~ periodEnd）
  指标网格（3列）：
    完成待办数 / 总数（含完成率进度条）
    专注时长（formatMinutes）
    目标达成数 / 总数
  AI 总结卡片（aiSummary 有值时显示）
  重新生成按钮（底部）
无数据时：
  提示文字 + "生成汇总"按钮
```

### rate 计算方法
```javascript
rate(done, total) {
  if (!total) return 0
  return Math.round(done / total * 100)
}
```

### 页面 JSON
```json
{"navigationBarTitleText": "汇总", "enablePullDownRefresh": true}
```

---

## 08-F：pages/category/（分类管理）

### 功能
- 分类列表：色点 + 名称 + 编辑/删除
- 新建/编辑底部弹窗：名称输入 + 颜色选择（8个颜色圆点，点击高亮）
- 删除：showModal 二次确认，提示"该分类下任务不受影响"
- 颜色预设：`['#1A73E8','#FF4D4F','#52C41A','#FAAD14','#8E24AA','#FF7043','#00ACC1','#43A047']`

### 页面 JSON
```json
{"navigationBarTitleText": "分类管理", "enablePullDownRefresh": true}
```

> 此页面不在 TabBar，从首页快捷入口或待办页"管理分类"入口进入，用 `wx.navigateTo`。

---

## 各页面 WXSS 要求

- 不定义 CSS 变量（继承 app.wxss）
- 不重复定义 `.card`、`.btn-primary`、`.modal-*`、`.field-*` 等全局类
- 每个页面只定义本页专属的布局和组件样式
- 颜色值一律使用 CSS 变量，如 `var(--color-primary)`

---

## 验收标准

- [ ] 微信开发者工具编译所有页面零错误、零警告
- [ ] 首页正确显示今日待办列表（需后端运行）
- [ ] 待办页可完整走通：创建 → 完成（填写情况）→ 删除
- [ ] 专注页倒计时正常工作，结束后能保存记录
- [ ] 目标页可创建目标并更新进度
- [ ] 汇总页显示本周/本月数据（需有历史数据）

## ✅ 完成于 2026-04-15 00:00
