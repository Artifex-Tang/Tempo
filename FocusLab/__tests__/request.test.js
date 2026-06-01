'use strict';

// Mock wx global before requiring module
const mockRequest = jest.fn();
const mockShowToast = jest.fn();
const mockRemoveStorageSync = jest.fn();
const mockReLaunch = jest.fn();
const mockGetStorageSync = jest.fn();

global.wx = {
  request: mockRequest,
  showToast: mockShowToast,
  removeStorageSync: mockRemoveStorageSync,
  reLaunch: mockReLaunch,
  getStorageSync: mockGetStorageSync
};

const { get, post, put, patch, del } = require('../utils/request');

function resolveRequest(code, data, msg = '操作成功') {
  const call = mockRequest.mock.calls[mockRequest.mock.calls.length - 1][0];
  call.success({ data: { code, data, msg } });
}

function failRequest() {
  const call = mockRequest.mock.calls[mockRequest.mock.calls.length - 1][0];
  call.fail({ errMsg: 'request:fail network error' });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetStorageSync.mockReturnValue('test-jwt-token');
});

describe('request — success path', () => {
  test('GET resolves with data when code=200', async () => {
    const promise = get('/api/test');
    resolveRequest(200, { id: 1 });
    const result = await promise;
    expect(result).toEqual({ id: 1 });
  });

  test('POST sends correct method and body', async () => {
    const promise = post('/api/todos', { title: 'task' });
    resolveRequest(200, { id: 5 });
    await promise;
    const call = mockRequest.mock.calls[0][0];
    expect(call.method).toBe('POST');
    expect(call.data).toEqual({ title: 'task' });
  });

  test('Authorization header contains token', async () => {
    const promise = get('/api/todos');
    resolveRequest(200, []);
    await promise;
    const call = mockRequest.mock.calls[0][0];
    expect(call.header['Authorization']).toBe('Bearer test-jwt-token');
  });

  test('PUT uses PUT method', async () => {
    const promise = put('/api/todos/1', { title: 'updated' });
    resolveRequest(200, null);
    await promise;
    expect(mockRequest.mock.calls[0][0].method).toBe('PUT');
  });

  test('PATCH uses PATCH method', async () => {
    const promise = patch('/api/todos/1/finish', { status: 2 });
    resolveRequest(200, null);
    await promise;
    expect(mockRequest.mock.calls[0][0].method).toBe('PATCH');
  });

  test('DELETE uses DELETE method', async () => {
    const promise = del('/api/todos/1');
    resolveRequest(200, null);
    await promise;
    expect(mockRequest.mock.calls[0][0].method).toBe('DELETE');
  });
});

describe('request — error handling', () => {
  test('code=401 clears storage and reLaunches login', async () => {
    const promise = get('/api/todos');
    resolveRequest(401, null, '未登录');
    await expect(promise).rejects.toThrow();
    expect(mockRemoveStorageSync).toHaveBeenCalledWith('token');
    expect(mockRemoveStorageSync).toHaveBeenCalledWith('userInfo');
    expect(mockReLaunch).toHaveBeenCalledWith({ url: '/pages/login/login' });
  });

  test('non-200 non-401 code shows toast and rejects', async () => {
    const promise = get('/api/todos');
    resolveRequest(1100, null, '待办任务不存在');
    await expect(promise).rejects.toThrow('待办任务不存在');
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '待办任务不存在' })
    );
  });

  test('silent=true suppresses toast on error', async () => {
    const promise = get('/api/todos', {}, true);
    resolveRequest(500, null, '系统错误');
    await expect(promise).rejects.toThrow();
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  test('network failure shows toast and rejects', async () => {
    const promise = get('/api/todos');
    failRequest();
    await expect(promise).rejects.toBeDefined();
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '网络异常，请重试' })
    );
  });

  test('silent network failure suppresses toast', async () => {
    const promise = get('/api/todos', {}, true);
    failRequest();
    await expect(promise).rejects.toBeDefined();
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});

describe('request — no token', () => {
  test('sends empty Authorization when no token', async () => {
    mockGetStorageSync.mockReturnValue(null);
    const promise = get('/api/public');
    resolveRequest(200, {});
    await promise;
    const call = mockRequest.mock.calls[0][0];
    expect(call.header['Authorization']).toBe('');
  });
});
