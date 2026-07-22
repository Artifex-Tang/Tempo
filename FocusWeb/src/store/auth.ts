import type { LoginVO } from '../types';

const TOKEN_KEY = 'token';
const USER_KEY = 'userInfo';

// 鉴权状态仅持久化到 localStorage；应用启动时从 localStorage 重建会话
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveLogin(vo: LoginVO): void {
  localStorage.setItem(TOKEN_KEY, vo.token);
  localStorage.setItem(USER_KEY, JSON.stringify(vo));
}

export function clearLogin(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
