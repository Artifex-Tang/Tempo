import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { request } from '../src/api/client';

describe('api client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.clear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('unwraps R<T> data on code 200 and injects Bearer', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ code: 200, msg: 'ok', data: { id: 5 } }),
    });
    localStorage.setItem('token', 'abc');
    const data = await request('/api/todos/today', 'GET');
    expect(data).toEqual({ id: 5 });
    const [, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer abc');
  });

  it('strips null GET params', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, json: async () => ({ code: 200, data: [] }),
    });
    await request('/api/todos', 'GET', { status: null, categoryId: 3 });
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('categoryId=3');
    expect(url).not.toContain('status');
  });

  it('rejects on business error code', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, json: async () => ({ code: 1100, msg: '待办不存在', data: null }),
    });
    await expect(request('/api/todos/9', 'GET')).rejects.toThrow('待办不存在');
  });
});
