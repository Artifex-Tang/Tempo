import { test, expect } from '@playwright/test';

test('login (mock) → today → add todo → appears in list', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /mock 登录/i }).click();
  await expect(page).toHaveURL(/\/today/);

  const title = `E2E-${Date.now()}`;
  await page.getByPlaceholder(/新建待办/).fill(title);
  await page.getByPlaceholder(/新建待办/).press('Enter');

  // 导航离开再回来触发重新加载（对齐小程序 E2E 验证策略）
  await page.goto('/summary');
  await page.goto('/today');
  await expect(page.getByText(title)).toBeVisible();
});
