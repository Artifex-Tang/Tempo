// 统一网络请求层：只处理 HTTP 协议（token注入、错误提示、401跳转）
// 页面禁止直接调用 wx.request，统一通过此模块
const BASE_URL = 'http://localhost:8080';

function request(url, method, data, silent) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.request({
      url: BASE_URL + url,
      method: method || 'GET',
      data: data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
      },
      success: (res) => {
        const body = res.data;
        if (body.code === 200) {
          resolve(body.data);
        } else if (body.code === 401) {
          // token 过期，清除本地缓存并跳转登录
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.reLaunch({ url: '/pages/login/login' });
          reject(new Error('未登录或登录已过期'));
        } else {
          if (!silent) {
            wx.showToast({ title: body.msg || '请求失败', icon: 'none', duration: 2000 });
          }
          reject(new Error(body.msg));
        }
      },
      fail: (err) => {
        if (!silent) {
          wx.showToast({ title: '网络异常，请重试', icon: 'none', duration: 2000 });
        }
        reject(err);
      }
    });
  });
}

const get   = (url, data, silent) => request(url, 'GET',    data, silent);
const post  = (url, data, silent) => request(url, 'POST',   data, silent);
const put   = (url, data, silent) => request(url, 'PUT',    data, silent);
const patch = (url, data, silent) => request(url, 'PATCH',  data, silent);
const del   = (url, data, silent) => request(url, 'DELETE', data, silent);

module.exports = { request, get, post, put, patch, del };
