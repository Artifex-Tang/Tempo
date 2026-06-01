'use strict';

// Mock the request module
const mockGet  = jest.fn().mockResolvedValue([]);
const mockPost = jest.fn().mockResolvedValue({});
const mockPut  = jest.fn().mockResolvedValue({});
const mockPatch= jest.fn().mockResolvedValue({});
const mockDel  = jest.fn().mockResolvedValue(null);

jest.mock('../utils/request', () => ({
  get:   mockGet,
  post:  mockPost,
  put:   mockPut,
  patch: mockPatch,
  del:   mockDel
}));

const api = require('../utils/api');

beforeEach(() => jest.clearAllMocks());

describe('api.auth', () => {
  test('login calls POST /api/auth/login with code', () => {
    api.auth.login('wx_code', 'Nick', 'http://avatar.url');
    expect(mockPost).toHaveBeenCalledWith('/api/auth/login', {
      code: 'wx_code',
      nickname: 'Nick',
      avatarUrl: 'http://avatar.url'
    });
  });
});

describe('api.todo', () => {
  test('today calls GET /api/todos/today', () => {
    api.todo.today();
    expect(mockGet).toHaveBeenCalledWith('/api/todos/today');
  });

  test('list passes status and categoryId params', () => {
    api.todo.list(0, 5);
    expect(mockGet).toHaveBeenCalledWith('/api/todos', { status: 0, categoryId: 5 });
  });

  test('create calls POST /api/todos', () => {
    api.todo.create({ title: 'task', priority: 1 });
    expect(mockPost).toHaveBeenCalledWith('/api/todos', { title: 'task', priority: 1 });
  });

  test('update calls PUT /api/todos/:id', () => {
    api.todo.update(42, { title: 'updated' });
    expect(mockPut).toHaveBeenCalledWith('/api/todos/42', { title: 'updated' });
  });

  test('finish calls PATCH /api/todos/:id/finish', () => {
    api.todo.finish(7, 2, '完成了');
    expect(mockPatch).toHaveBeenCalledWith('/api/todos/7/finish', {
      status: 2,
      finishNote: '完成了'
    });
  });

  test('remove calls DELETE /api/todos/:id', () => {
    api.todo.remove(3);
    expect(mockDel).toHaveBeenCalledWith('/api/todos/3');
  });

  test('statistics passes days param', () => {
    api.todo.statistics(14);
    expect(mockGet).toHaveBeenCalledWith('/api/todos/statistics', { days: 14 });
  });
});

describe('api.goal', () => {
  test('list passes type and status', () => {
    api.goal.list(2, 0);
    expect(mockGet).toHaveBeenCalledWith('/api/goals', { type: 2, status: 0 });
  });

  test('create calls POST /api/goals', () => {
    api.goal.create({ title: 'goal', type: 2 });
    expect(mockPost).toHaveBeenCalledWith('/api/goals', { title: 'goal', type: 2 });
  });

  test('updateProgress calls PATCH with progress', () => {
    api.goal.updateProgress(1, 75);
    expect(mockPatch).toHaveBeenCalledWith('/api/goals/1/progress', { progress: 75 });
  });

  test('finish calls PATCH /api/goals/:id/finish', () => {
    api.goal.finish(1, 1, '达成了');
    expect(mockPatch).toHaveBeenCalledWith('/api/goals/1/finish', {
      status: 1,
      finishNote: '达成了'
    });
  });

  test('remove calls DELETE /api/goals/:id', () => {
    api.goal.remove(2);
    expect(mockDel).toHaveBeenCalledWith('/api/goals/2');
  });
});

describe('api.focus', () => {
  test('record calls POST /api/focus/record', () => {
    api.focus.record({ durationMin: 25, note: 'great' });
    expect(mockPost).toHaveBeenCalledWith('/api/focus/record', { durationMin: 25, note: 'great' });
  });

  test('dailyStats passes days', () => {
    api.focus.dailyStats(7);
    expect(mockGet).toHaveBeenCalledWith('/api/focus/daily-stats', { days: 7 });
  });
});

describe('api.category', () => {
  test('list calls GET /api/categories', () => {
    api.category.list();
    expect(mockGet).toHaveBeenCalledWith('/api/categories');
  });

  test('create calls POST /api/categories', () => {
    api.category.create({ name: '工作', color: '#1A73E8' });
    expect(mockPost).toHaveBeenCalledWith('/api/categories', { name: '工作', color: '#1A73E8' });
  });

  test('update calls PUT /api/categories/:id', () => {
    api.category.update(3, { name: '学习' });
    expect(mockPut).toHaveBeenCalledWith('/api/categories/3', { name: '学习' });
  });

  test('remove calls DELETE /api/categories/:id', () => {
    api.category.remove(3);
    expect(mockDel).toHaveBeenCalledWith('/api/categories/3');
  });
});

describe('api.summary', () => {
  test('weekly calls GET /api/summary/weekly', () => {
    api.summary.weekly();
    expect(mockGet).toHaveBeenCalledWith('/api/summary/weekly');
  });

  test('monthly calls GET /api/summary/monthly', () => {
    api.summary.monthly();
    expect(mockGet).toHaveBeenCalledWith('/api/summary/monthly');
  });

  test('generate calls POST with type in query string', () => {
    api.summary.generate(1);
    expect(mockPost).toHaveBeenCalledWith('/api/summary/generate?type=1');
  });
});
