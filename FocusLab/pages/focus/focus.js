const api = require('../../utils/api');
const { formatMinutes } = require('../../utils/util');

Page({
  data: {
    phase: 'idle',         // idle | running | paused | done
    presets: [25, 45, 60, 90],
    selectedMin: 25,
    remaining: 1500,       // 秒
    elapsed: 0,
    progress: 0,           // 0-100，用于圆环 CSS
    timeDisplay: '25:00',  // 格式化后的倒计时字符串
    todos: [],
    linkedTodoId: null,
    linkedTitle: '',
    todayMin: 0,
    showDoneModal: false,
    doneNote: ''
  },

  _timer: null,
  _totalSec: 0,

  onLoad() {
    this._loadTodayStats();
    this._loadTodos();
  },

  onUnload() {
    // 离开页面时必须清除计时器，防止内存泄漏
    if (this._timer) clearInterval(this._timer);
  },

  async _loadTodayStats() {
    try {
      const stats = await api.focus.dailyStats(1);
      const todayMin = stats && stats.length > 0
        ? Number(stats[stats.length - 1].totalMin || 0)
        : 0;
      this.setData({ todayMin });
    } catch (e) {}
  },

  async _loadTodos() {
    try {
      const todos = await api.todo.list(0, null);
      this.setData({ todos: todos || [] });
    } catch (e) {}
  },

  _fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  },

  selectPreset(e) {
    if (this.data.phase !== 'idle') return;
    const min = Number(e.currentTarget.dataset.min);
    this.setData({
      selectedMin: min,
      remaining: min * 60,
      elapsed: 0,
      progress: 0,
      timeDisplay: this._fmtTime(min * 60)
    });
  },

  linkTodo(e) {
    const { id, title } = e.currentTarget.dataset;
    // 再次点击同一项取消关联
    if (this.data.linkedTodoId === id) {
      this.setData({ linkedTodoId: null, linkedTitle: '' });
    } else {
      this.setData({ linkedTodoId: id, linkedTitle: title });
    }
  },

  startFocus() {
    const total = this.data.selectedMin * 60;
    this._totalSec = total;
    this.setData({ phase: 'running', remaining: total, elapsed: 0, progress: 0, timeDisplay: this._fmtTime(total) });
    this._startTimer();
  },

  _startTimer() {
    this._timer = setInterval(() => {
      const remaining = this.data.remaining - 1;
      const elapsed = this.data.elapsed + 1;
      const progress = Math.round(elapsed / this._totalSec * 100);
      if (remaining <= 0) {
        clearInterval(this._timer);
        wx.vibrateShort({ type: 'heavy' });
        this.setData({
          remaining: 0, elapsed: this._totalSec,
          progress: 100, timeDisplay: '00:00',
          phase: 'done', showDoneModal: true
        });
      } else {
        this.setData({ remaining, elapsed, progress, timeDisplay: this._fmtTime(remaining) });
      }
    }, 1000);
  },

  pauseFocus() {
    clearInterval(this._timer);
    this.setData({ phase: 'paused' });
  },

  resumeFocus() {
    this.setData({ phase: 'running' });
    this._startTimer();
  },

  endFocus() {
    clearInterval(this._timer);
    this.setData({ phase: 'done', showDoneModal: true });
  },

  resetFocus() {
    clearInterval(this._timer);
    const min = this.data.selectedMin;
    this.setData({
      phase: 'idle',
      remaining: min * 60,
      elapsed: 0,
      progress: 0,
      timeDisplay: this._fmtTime(min * 60),
      showDoneModal: false,
      doneNote: ''
    });
  },

  onDoneNote(e) {
    this.setData({ doneNote: e.detail.value });
  },

  async saveFocus() {
    const durationMin = Math.max(1, Math.round(this.data.elapsed / 60));
    try {
      await api.focus.record({
        durationMin,
        todoId: this.data.linkedTodoId || null,
        note: this.data.doneNote || null
      });
      wx.showToast({ title: '专注记录已保存', icon: 'success' });
      this._loadTodayStats();
    } catch (e) {}
    this.resetFocus();
  },

  skipSave() {
    this.resetFocus();
  }
});
