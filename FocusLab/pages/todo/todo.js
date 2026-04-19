const api = require('../../utils/api');

Page({
  data: {
    todos: [],
    categories: [],
    loading: false,
    activeStatus: null,
    activeCatId: null,
    showModal: false,
    isEdit: false,
    editId: null,
    form: { title: '', description: '', priority: 2, categoryId: null, dueDate: '', remindTime: '' },
    showFinishModal: false,
    finishId: null,
    finishStatus: 2,
    finishNote: ''
  },

  onShow() {
    this._loadData();
  },

  onPullDownRefresh() {
    this._loadData().finally(() => wx.stopPullDownRefresh());
  },

  async _loadData() {
    this.setData({ loading: true });
    try {
      const [todos, categories] = await Promise.all([
        api.todo.list(this.data.activeStatus, this.data.activeCatId),
        api.category.list()
      ]);
      this.setData({ todos: todos || [], categories: categories || [] });
    } catch (e) {
    } finally {
      this.setData({ loading: false });
    }
  },

  setStatus(e) {
    const val = e.currentTarget.dataset.status;
    const status = val === 'null' ? null : Number(val);
    this.setData({ activeStatus: status });
    this._loadData();
  },

  openCreate() {
    this.setData({
      showModal: true,
      isEdit: false,
      editId: null,
      form: { title: '', description: '', priority: 2, categoryId: null, dueDate: '', remindTime: '' }
    });
  },

  openEdit(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      showModal: true,
      isEdit: true,
      editId: item.id,
      form: {
        title: item.title,
        description: item.description || '',
        priority: item.priority || 2,
        categoryId: item.categoryId || null,
        dueDate: item.dueDate || '',
        remindTime: item.remindTime
          ? item.remindTime.replace('T', ' ').substring(0, 16)
          : ''
      }
    });
  },

  closeModal() {
    this.setData({ showModal: false });
  },

  onFormInput(e) {
    const form = Object.assign({}, this.data.form);
    form[e.currentTarget.dataset.field] = e.detail.value;
    this.setData({ form });
  },

  setPriority(e) {
    const form = Object.assign({}, this.data.form, { priority: Number(e.currentTarget.dataset.p) });
    this.setData({ form });
  },

  onDateChange(e) {
    const form = Object.assign({}, this.data.form, { dueDate: e.detail.value });
    this.setData({ form });
  },

  onRemindChange(e) {
    const form = Object.assign({}, this.data.form, { remindTime: e.detail.value + ':00' });
    this.setData({ form });
  },

  async submitForm() {
    const { form, isEdit, editId } = this.data;
    if (!form.title.trim()) {
      wx.showToast({ title: '请填写标题', icon: 'none' });
      return;
    }
    const data = {
      title: form.title.trim(),
      description: form.description || null,
      priority: form.priority,
      categoryId: form.categoryId || null,
      dueDate: form.dueDate || null,
      remindTime: form.remindTime || null
    };
    try {
      if (isEdit) {
        await api.todo.update(editId, data);
        wx.showToast({ title: '已更新', icon: 'success' });
      } else {
        await api.todo.create(data);
        wx.showToast({ title: '已创建', icon: 'success' });
      }
      this.setData({ showModal: false });
      this._loadData();
    } catch (e) {}
  },

  openFinish(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ showFinishModal: true, finishId: id, finishStatus: 2, finishNote: '' });
  },

  closeFinishModal() {
    this.setData({ showFinishModal: false });
  },

  setFinishStatus(e) {
    this.setData({ finishStatus: Number(e.currentTarget.dataset.s) });
  },

  onFinishNote(e) {
    this.setData({ finishNote: e.detail.value });
  },

  async submitFinish() {
    try {
      await api.todo.finish(this.data.finishId, this.data.finishStatus, this.data.finishNote);
      const label = this.data.finishStatus === 2 ? '已完成 ✅' : '已放弃';
      wx.showToast({ title: label, icon: 'none' });
      this.setData({ showFinishModal: false });
      this._loadData();
    } catch (e) {}
  },

  removeTodo(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除确认',
      content: '确定删除该待办吗？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await api.todo.remove(id);
          wx.showToast({ title: '已删除', icon: 'success' });
          this._loadData();
        } catch (e) {}
      }
    });
  }
});
