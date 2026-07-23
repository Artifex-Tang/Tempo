import { test, expect } from '@playwright/test';
import { mockLogin, addTodoViaToday, cjk } from './helpers';

test('回车新建待办 → 出现在待办栏', async ({ page }) => {
  await mockLogin(page);
  const title = `T-${Date.now()}`;
  await addTodoViaToday(page, title);
  await expect(page.getByText(title).first()).toBeVisible();
});

test('添加按钮新建待办 → 出现', async ({ page }) => {
  await mockLogin(page);
  const title = `TB-${Date.now()}`;
  await page.getByPlaceholder(/新建待办/).fill(title);
  await page.getByRole('button', { name: cjk('添加') }).click();
  await expect(page.getByText(title).first()).toBeVisible();
});

test('勾选完成 → 标题仍可见（已完成后）', async ({ page }) => {
  await mockLogin(page);
  const title = `TC-${Date.now()}`;
  await addTodoViaToday(page, title);
  // antd List 的 Checkbox 用 .check() 不触发 onChange，点 wrapper 才切换
  await page.locator('label.ant-checkbox-wrapper', { hasText: title }).first().click();
  await page.goto('/summary');
  await page.goto('/today');
  await expect(page.getByText(title).first()).toBeVisible();
});
