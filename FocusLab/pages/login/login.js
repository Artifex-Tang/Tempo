const api = require('../../utils/api');

Page({
  data: { loading: false },

  onLoad() {
    // 已有 token 则直接跳首页
    const token = wx.getStorageSync('token');
    if (token) {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  handleLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    wx.login({
      success: (res) => {
        if (!res.code) {
          wx.showToast({ title: '获取登录码失败', icon: 'none' });
          this.setData({ loading: false });
          return;
        }
        api.auth.login(res.code)
          .then((data) => {
            wx.setStorageSync('token', data.token);
            wx.setStorageSync('userInfo', {
              nickName: data.nickname || '用户',
              avatarUrl: data.avatarUrl || ''
            });
            const app = getApp();
            app.globalData.token = data.token;
            app.globalData.userInfo = {
              nickName: data.nickname,
              avatarUrl: data.avatarUrl
            };
            wx.switchTab({ url: '/pages/index/index' });
          })
          .catch(() => {
            this.setData({ loading: false });
          });
      },
      fail: () => {
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
        this.setData({ loading: false });
      }
    });
  }
});
