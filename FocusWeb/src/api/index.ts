// 业务 API 层：只处理业务语义（URL、参数封装）
// 对齐 FocusLab/utils/api.js 的端点路径与方法，叠加 TypeScript 泛型以提供类型化 data
// 页面只从此文件导入，不直接调用 client
import { get, post, put, patch, del } from './client';
import type { LoginVO, Todo, Goal, Category, DailyStat, Summary } from '../types';

export const auth = {
  // Web 专属：开发旁路登录（对应 WX_MOCK_OPENID 非空时的 dev 入口）
  webMockLogin: () => post<LoginVO>('/api/auth/web-mock-login'),
  // Web OAuth 回调（PC 微信扫码授权后端换取 token）
  webOAuthCallback: (code: string) =>
    post<LoginVO>('/api/auth/web-oauth/callback', { code }),
};

export const todo = {
  today: () => get<Todo[]>('/api/todos/today'),
  list: (status?: number, categoryId?: number) =>
    get<Todo[]>('/api/todos', { status, categoryId }),
  create: (data: Partial<Todo>) => post<Todo>('/api/todos', data),
  update: (id: number, data: Partial<Todo>) => put<Todo>(`/api/todos/${id}`, data),
  finish: (id: number, status: number, finishNote?: string) =>
    patch<Todo>(`/api/todos/${id}/finish`, { status, finishNote }),
  remove: (id: number) => del(`/api/todos/${id}`),
  statistics: (days: number) => get<{ total: number; done: number }>('/api/todos/statistics', { days }),
};

export const goal = {
  list: (type?: number, status?: number) => get<Goal[]>('/api/goals', { type, status }),
  create: (data: Partial<Goal>) => post<Goal>('/api/goals', data),
  update: (id: number, data: Partial<Goal>) => put<Goal>(`/api/goals/${id}`, data),
  updateProgress: (id: number, progress: number) =>
    patch<Goal>(`/api/goals/${id}/progress`, { progress }),
  finish: (id: number, status: number, finishNote?: string) =>
    patch<Goal>(`/api/goals/${id}/finish`, { status, finishNote }),
  remove: (id: number) => del(`/api/goals/${id}`),
};

export const focus = {
  record: (data: { durationMin: number; todoId?: number; goalId?: number; note?: string }) =>
    post('/api/focus/record', data),
  dailyStats: (days: number) => get<DailyStat[]>('/api/focus/daily-stats', { days }),
};

export const category = {
  list: () => get<Category[]>('/api/categories'),
  create: (data: Partial<Category>) => post<Category>('/api/categories', data),
  update: (id: number, data: Partial<Category>) =>
    put<Category>(`/api/categories/${id}`, data),
  remove: (id: number) => del(`/api/categories/${id}`),
};

export const summary = {
  weekly: () => get<Summary>('/api/summary/weekly'),
  monthly: () => get<Summary>('/api/summary/monthly'),
  generate: (type: string) => post(`/api/summary/generate?type=${type}`),
};
