const api = require('../../utils/api');

const COLOR_PRESETS = [
  '#1A73E8', '#FF4D4F', '#52C41A', '#FAAD14',
  '#8E24AA', '#FF7043', '#00ACC1', '#43A047'
];

Page({
  data: {
    categories: [],
    loading: false,
    colors: COLOR_PRESETS,
    showModal: false,
    isEdit: false,
    editId: null,
    form: { name: '', color: '#1A73E8', icon: '', sortOrder: 0 }
  },

  onShow() { this._loadData(); },

  onPullDownRefresh() {
    this._loadData().finally(() => wx.stopPullDownRefresh());
  },

  async _loadData() {
    this.setData({ loading: true });
    try {
      const categories = await api.category.list();
      this.setData({ categories: categories || [] });
    } catch (e) {
    } finally {
      this.setData({ loading: false });
    }
  },

  openCreate() {
    this.setData({
      showModal: true, isEdit: false, editId: null,
      form: { name: '', color: '#1A73E8', icon: '', sortOrder: 0 }
    });
  },

  openEdit(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      showModal: true, isEdit: true, editId: item.id,
      form: {
        name: item.name,
        color: item.color || '#1A73E8',
        icon: item.icon || '',
        sortOrder: item.sortOrder || 0
      }
    });
  },

  closeModal() { this.setData({ showModal: false }); },

  onNameInput(e) {
    const form = Object.assign({}, this.data.form, { name: e.detail.value });
    this.setData({ form });
  },

  selectColor(e) {
    const form = Object.assign({}, this.data.form, { color: e.currentTarget.dataset.color });
    this.setData({ form });
  },

  async submitForm() {
    const { form, isEdit, editId } = this.data;
    if (!form.name.trim()) {
      wx.showToast({ title: '请填写分类名称', icon: 'none' });
      return;
    }
    try {
      if (isEdit) {
        await api.category.update(editId, form);
        wx.showToast({ title: '已更新', icon: 'success' });
      } else {
        await api.category.create(form);
        wx.showToast({ title: '已创建', icon: 'success' });
      }
      this.setData({ showModal: false });
      this._loadData();
    } catch (e) {}
  },

  removeCategory(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除确认',
      content: '确定删除该分类吗？该分类下任务不受影响。',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await api.category.remove(id);
          wx.showToast({ title: '已删除', icon: 'success' });
          this._loadData();
        } catch (e) {}
      }
    });
  }
});
