const api = require('./utils/api');

App({
  globalData: {
    userInfo: null,
    token: null,
    focusTotal: 0
  },

  onLaunch() {
    // 从 storage 恢复缓存的登录状态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token) this.globalData.token = token;
    if (userInfo) this.globalData.userInfo = userInfo;

    this._silentLogin();
  },

  _silentLogin() {
    wx.login({
      success: (res) => {
        if (!res.code) {
          console.warn('wx.login 未返回 code');
          return;
        }
        const userInfo = this.globalData.userInfo || {};
        api.auth.login(res.code, userInfo.nickName, userInfo.avatarUrl)
          .then((data) => {
            this.globalData.token = data.token;
            this.globalData.userInfo = {
              nickName: data.nickname || '用户',
              avatarUrl: data.avatarUrl || ''
            };
            this.globalData.focusTotal = data.focusTotal || 0;
            wx.setStorageSync('token', data.token);
            wx.setStorageSync('userInfo', this.globalData.userInfo);
          })
          .catch((err) => {
            // 静默登录失败不弹提示，等用户进入页面时再引导
            console.warn('静默登录失败', err);
          });
      },
      fail: (err) => {
        console.warn('wx.login 调用失败', err);
      }
    });
  },

  checkLogin() {
    const token = wx.getStorageSync('token');
    if (token) return true;
    wx.reLaunch({ url: '/pages/login/login' });
    return false;
  }
});
