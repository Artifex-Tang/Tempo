const api = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    date: '',
    todayTodos: [],
    weeklyStat: null,
    loading: false
  },

  onLoad() {
    const now = new Date();
    this.setData({
      date: (now.getMonth() + 1) + '月' + now.getDate() + '日',
      userInfo: wx.getStorageSync('userInfo')
    });
  },

  onShow() {
    // 每次显示页面时刷新数据（从弹窗/子页面返回后自动更新）
    this._loadData();
  },

  onPullDownRefresh() {
    this._loadData().finally(() => wx.stopPullDownRefresh());
  },

  async _loadData() {
    this.setData({ loading: true });
    try {
      const [todos, weekly] = await Promise.all([
        api.todo.today(),
        api.summary.weekly().catch(() => null)
      ]);
      this.setData({
        todayTodos: todos || [],
        weeklyStat: weekly
      });
    } catch (e) {
      // request.js 已统一处理错误提示
    } finally {
      this.setData({ loading: false });
    }
  },

  async quickDone(e) {
    const { id } = e.currentTarget.dataset;
    try {
      await api.todo.finish(id, 2, '');
      wx.showToast({ title: '已完成', icon: 'success', duration: 1000 });
      this._loadData();
    } catch (e) {}
  },

  goToTodo() {
    wx.navigateTo({ url: '/pages/todo/todo' });
  },

  goToFocus() {
    wx.switchTab({ url: '/pages/focus/focus' });
  },

  goToGoal() {
    wx.switchTab({ url: '/pages/goal/goal' });
  },

  goToSummary() {
    wx.switchTab({ url: '/pages/summary/summary' });
  },

  goToCategory() {
    wx.navigateTo({ url: '/pages/category/category' });
  }
});
