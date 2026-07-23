import { test, expect } from '@playwright/test';
import { mockLogin, cjk } from './helpers';

test('新建分类 → 出现；删除 → 消失', async ({ page }) => {
  await mockLogin(page);
  await page.goto('/categories');
  const t = `C-${Date.now()}`;
  await page.getByPlaceholder('新分类名').fill(t);
  await page.getByRole('button', { name: cjk('添加') }).click();
  await expect(page.getByText(t)).toBeVisible();

  await page.locator('tr', { hasText: t }).getByRole('button', { name: cjk('删除') }).click();
  await page.getByRole('button', { name: cjk('确定') }).click();
  await expect(page.getByText(t)).toHaveCount(0);
});
