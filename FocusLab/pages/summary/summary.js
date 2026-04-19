const api = require('../../utils/api');
const { formatMinutes } = require('../../utils/util');

Page({
  data: {
    tab: 'weekly',
    weekly: null,
    monthly: null,
    loading: false,
    generating: false
  },

  onShow() { this._loadData(); },

  onPullDownRefresh() {
    this._loadData().finally(() => wx.stopPullDownRefresh());
  },

  async _loadData() {
    this.setData({ loading: true });
    try {
      const [weekly, monthly] = await Promise.all([
        api.summary.weekly().catch(() => null),
        api.summary.monthly().catch(() => null)
      ]);
      this.setData({ weekly, monthly });
    } catch (e) {
    } finally {
      this.setData({ loading: false });
    }
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  async generate() {
    const type = this.data.tab === 'weekly' ? 1 : 2;
    this.setData({ generating: true });
    try {
      await api.summary.generate(type);
      wx.showToast({ title: '汇总已生成', icon: 'success' });
      this._loadData();
    } catch (e) {
    } finally {
      this.setData({ generating: false });
    }
  },

  // 计算完成率（模板中使用）
  _rate(done, total) {
    if (!total) return 0;
    return Math.round(done / total * 100);
  }
});
