import { test, expect } from '@playwright/test';
import { mockLogin, cjk } from './helpers';

test('番茄钟开始/暂停切换；本周统计展示', async ({ page }) => {
  await mockLogin(page);
  await page.goto('/focus');
  await expect(page.getByText('番茄钟')).toBeVisible();

  await page.getByRole('button', { name: cjk('开始专注') }).click();
  await expect(page.getByRole('button', { name: cjk('暂停') })).toBeVisible();

  await page.getByRole('button', { name: cjk('暂停') }).click();
  await expect(page.getByRole('button', { name: cjk('开始专注') })).toBeVisible();

  await expect(page.getByText('本周专注(分钟)')).toBeVisible();
});
