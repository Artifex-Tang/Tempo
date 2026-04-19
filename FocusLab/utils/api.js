// 业务 API 层：只处理业务语义（URL、参数封装）
// 页面只 require 此文件，不直接引用 request.js
const { get, post, put, patch, del } = require('./request');

const auth = {
  login: (code, nickname, avatarUrl) =>
    post('/api/auth/login', { code, nickname, avatarUrl })
};

const todo = {
  today:      ()                          => get('/api/todos/today'),
  list:       (status, categoryId)        => get('/api/todos', { status, categoryId }),
  create:     (data)                      => post('/api/todos', data),
  update:     (id, data)                  => put('/api/todos/' + id, data),
  finish:     (id, status, finishNote)    => patch('/api/todos/' + id + '/finish', { status, finishNote }),
  remove:     (id)                        => del('/api/todos/' + id),
  statistics: (days)                      => get('/api/todos/statistics', { days })
};

const goal = {
  list:           (type, status)            => get('/api/goals', { type, status }),
  create:         (data)                    => post('/api/goals', data),
  update:         (id, data)                => put('/api/goals/' + id, data),
  updateProgress: (id, progress)            => patch('/api/goals/' + id + '/progress', { progress }),
  finish:         (id, status, finishNote)  => patch('/api/goals/' + id + '/finish', { status, finishNote }),
  remove:         (id)                      => del('/api/goals/' + id)
};

const focus = {
  record:     (data) => post('/api/focus/record', data),
  dailyStats: (days) => get('/api/focus/daily-stats', { days })
};

const category = {
  list:   ()         => get('/api/categories'),
  create: (data)     => post('/api/categories', data),
  update: (id, data) => put('/api/categories/' + id, data),
  remove: (id)       => del('/api/categories/' + id)
};

const summary = {
  weekly:   ()       => get('/api/summary/weekly'),
  monthly:  ()       => get('/api/summary/monthly'),
  generate: (type)   => post('/api/summary/generate?type=' + type)
};

module.exports = { auth, todo, goal, focus, category, summary };
