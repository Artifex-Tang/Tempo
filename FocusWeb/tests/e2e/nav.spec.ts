import { test, expect } from '@playwright/test';
import { mockLogin } from './helpers';

test('桌面侧边栏导航各页', async ({ page }) => {
  await mockLogin(page);
  const routes: [string, RegExp][] = [
    ['待办', /\/todos/],
    ['目标', /\/goals/],
    ['专注', /\/focus/],
    ['汇总', /\/summary/],
    ['分类', /\/categories/],
    ['今日', /\/today/],
  ];
  for (const [label, url] of routes) {
    await page.getByRole('menuitem', { name: label }).first().click();
    await expect(page).toHaveURL(url);
  }
});

test('键盘 N（非输入态）→ 跳 /today', async ({ page }) => {
  await mockLogin(page);
  await page.goto('/goals');
  await page.keyboard.press('n');
  await expect(page).toHaveURL(/\/today/);
});

test('窄屏底部 Tab 导航', async ({ page }) => {
  await mockLogin(page);
  await page.setViewportSize({ width: 500, height: 800 });
  await page.goto('/today');
  await expect(page.getByRole('menuitem', { name: '汇总' })).toBeVisible();
  await page.getByRole('menuitem', { name: '汇总' }).click();
  await expect(page).toHaveURL(/\/summary/);
});
