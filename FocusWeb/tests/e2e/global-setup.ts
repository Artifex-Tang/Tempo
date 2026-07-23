import type { FullConfig } from '@playwright/test';

const BASE = (process.env.E2E_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

async function clear(token: string, path: string) {
  const r = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await r.json();
  const arr: { id: number }[] = body?.data || [];
  await Promise.all(
    arr.map((x) =>
      fetch(`${BASE}${path}/${x.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }),
    ),
  );
  return arr.length;
}

export default async function (_config: FullConfig) {
  const r = await fetch(`${BASE}/api/auth/web-mock-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const login = (await r.json())?.data;
  if (!login?.token) {
    console.log('[global-setup] mock-login 失败，跳过清理（后端未起或 WX_MOCK_OPENID 未设）');
    return;
  }
  const t = await clear(login.token, '/api/todos');
  const g = await clear(login.token, '/api/goals');
  const c = await clear(login.token, '/api/categories');
  console.log(`[global-setup] 清理 todos=${t} goals=${g} categories=${c}`);
}
