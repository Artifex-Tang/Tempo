import { test, expect } from '@playwright/test';
import { mockLogin, cjk } from './helpers';

test('新建目标 → 出现；+10% 与 完成 可用', async ({ page }) => {
  await mockLogin(page);
  await page.goto('/goals');
  const t = `G-${Date.now()}`;
  await page.getByPlaceholder('新建目标…').fill(t);
  await page.getByRole('button', { name: cjk('添加') }).click();
  await expect(page.getByText(t).first()).toBeVisible();

  const item = page.locator('li', { hasText: t }).first();
  await item.getByRole('button', { name: '+10%' }).click();
  await item.getByRole('button', { name: cjk('完成') }).click();
  await page.getByRole('button', { name: cjk('确定') }).click();
  await expect(page.getByText('目标已完成')).toBeVisible();
});
