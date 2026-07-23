import { test, expect } from '@playwright/test';
import { mockLogin } from './helpers';

test('未登录访问受保护页 → 跳 /login', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/today');
  await expect(page).toHaveURL(/\/login/);
});

test('mock 登录 → 落到 /today 并渲染外壳', async ({ page }) => {
  await mockLogin(page);
  await expect(page.getByText('个人事务')).toBeVisible();
});
