import { filterNulls } from '../utils/filterNulls';
import { getToken, clearLogin } from '../store/auth';
import { message } from 'antd';
import type { R } from '../types';

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// 统一请求层：注入 Bearer、过滤 GET null 参数、解包 R<T>、401 跳登录
// 对齐 FocusLab/utils/request.js 语义
export async function request<T = unknown>(
  url: string,
  method: Method,
  data?: Record<string, unknown>,
  silent = false,
): Promise<T> {
  const m = method || 'GET';
  let finalUrl = url;
  let body: string | undefined;

  if (m === 'GET') {
    // GET 参数过滤 null/undefined，避免 "null" 字符串污染 URL（历史 bug #8）
    const clean = filterNulls(data || {});
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(clean).map(([k, v]) => [k, String(v)])),
    ).toString();
    if (qs) finalUrl = `${url}?${qs}`;
  } else {
    body = JSON.stringify(data || {});
  }

  const token = getToken();
  // fetch 本身 reject（离线 / DNS 失败 / 中断）单独捕获，对齐 FocusLab request.js 的 fail: 分支
  let resp: Response;
  try {
    resp = await fetch(finalUrl, {
      method: m,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    });
  } catch {
    throw new Error('网络异常，请重试');
  }

  let payload: R<T>;
  try {
    payload = await resp.json();
  } catch {
    throw new Error('网络异常，请重试');
  }

  if (payload.code === 200) return payload.data;

  if (payload.code === 401) {
    clearLogin();
    // 避免已在登录页时的循环重定向
    if (location.pathname !== '/login') location.href = '/login';
    throw new Error(payload.msg || '未登录或登录已过期');
  }

  if (!silent) message.error(payload.msg || '请求失败');
  throw new Error(payload.msg);
}

export const get = (url: string, data?: Record<string, unknown>, silent?: boolean) =>
  request(url, 'GET', data, silent);
export const post = (url: string, data?: Record<string, unknown>, silent?: boolean) =>
  request(url, 'POST', data, silent);
export const put = (url: string, data?: Record<string, unknown>, silent?: boolean) =>
  request(url, 'PUT', data, silent);
export const patch = (url: string, data?: Record<string, unknown>, silent?: boolean) =>
  request(url, 'PATCH', data, silent);
export const del = (url: string, data?: Record<string, unknown>, silent?: boolean) =>
  request(url, 'DELETE', data, silent);
