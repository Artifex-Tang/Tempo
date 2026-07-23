import { test, expect } from '@playwright/test';
import { mockLogin, cjk } from './helpers';

test('汇总页：周/月切换 + 统计卡 + 专注图 + AI 卡片', async ({ page }) => {
  await mockLogin(page);
  await page.goto('/summary');

  await expect(page.getByRole('tab', { name: cjk('周报') })).toBeVisible();
  await expect(page.getByText('待办总数')).toBeVisible();
  await expect(page.getByText('专注时长分布')).toBeVisible();
  await expect(page.getByText('AI 汇总')).toBeVisible();

  await page.getByRole('tab', { name: cjk('月报') }).click();
  await expect(page.getByRole('tab', { name: cjk('月报') })).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('button', { name: cjk('生成') }).first().click();
});
