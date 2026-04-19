const api = require('../../utils/api');

Page({
  data: {
    goals: [],
    loading: false,
    activeType: null,
    typeLabels: ['全部', '日', '周', '月'],
    showModal: false,
    isEdit: false,
    editId: null,
    form: { title: '', description: '', type: 2, targetDate: '' },
    showFinishModal: false,
    finishId: null,
    finishStatus: 1,
    finishNote: ''
  },

  onShow() { this._loadData(); },

  onPullDownRefresh() {
    this._loadData().finally(() => wx.stopPullDownRefresh());
  },

  async _loadData() {
    this.setData({ loading: true });
    try {
      const goals = await api.goal.list(this.data.activeType, null);
      this.setData({ goals: goals || [] });
    } catch (e) {
    } finally {
      this.setData({ loading: false });
    }
  },

  setType(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    this.setData({ activeType: idx === 0 ? null : idx });
    this._loadData();
  },

  openCreate() {
    this.setData({
      showModal: true, isEdit: false, editId: null,
      form: { title: '', description: '', type: 2, targetDate: '' }
    });
  },

  openEdit(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      showModal: true, isEdit: true, editId: item.id,
      form: {
        title: item.title,
        description: item.description || '',
        type: item.type,
        targetDate: item.targetDate || ''
      }
    });
  },

  closeModal() { this.setData({ showModal: false }); },

  onFormInput(e) {
    const form = Object.assign({}, this.data.form);
    form[e.currentTarget.dataset.field] = e.detail.value;
    this.setData({ form });
  },

  setGoalType(e) {
    const form = Object.assign({}, this.data.form, { type: Number(e.currentTarget.dataset.t) });
    this.setData({ form });
  },

  onTargetDate(e) {
    const form = Object.assign({}, this.data.form, { targetDate: e.detail.value });
    this.setData({ form });
  },

  async submitForm() {
    const { form, isEdit, editId } = this.data;
    if (!form.title.trim()) { wx.showToast({ title: '请填写标题', icon: 'none' }); return; }
    if (!form.targetDate) { wx.showToast({ title: '请选择截止日期', icon: 'none' }); return; }
    try {
      if (isEdit) {
        await api.goal.update(editId, form);
        wx.showToast({ title: '已更新', icon: 'success' });
      } else {
        await api.goal.create(form);
        wx.showToast({ title: '已创建', icon: 'success' });
      }
      this.setData({ showModal: false });
      this._loadData();
    } catch (e) {}
  },

  async updateProgress(e) {
    const { id } = e.currentTarget.dataset;
    const progress = Number(e.detail.value);
    try {
      await api.goal.updateProgress(id, progress);
      this._loadData();
    } catch (e) {}
  },

  openFinish(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ showFinishModal: true, finishId: id, finishStatus: 1, finishNote: '' });
  },

  closeFinishModal() { this.setData({ showFinishModal: false }); },
  setFinishStatus(e) { this.setData({ finishStatus: Number(e.currentTarget.dataset.s) }); },
  onFinishNote(e) { this.setData({ finishNote: e.detail.value }); },

  async submitFinish() {
    try {
      await api.goal.finish(this.data.finishId, this.data.finishStatus, this.data.finishNote);
      wx.showToast({ title: '已更新', icon: 'success' });
      this.setData({ showFinishModal: false });
      this._loadData();
    } catch (e) {}
  },

  removeGoal(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除确认',
      content: '确定删除该目标吗？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await api.goal.remove(id);
          wx.showToast({ title: '已删除', icon: 'success' });
          this._loadData();
        } catch (e) {}
      }
    });
  }
});
