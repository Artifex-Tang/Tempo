import { expect, type Page } from '@playwright/test';

/** mock 登录并落到 /today */
export async function mockLogin(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /mock 登录/i }).click();
  await expect(page).toHaveURL(/\/today/);
}

/** 今日页快捷新建一个待办（回车） */
export async function addTodoViaToday(page: Page, title: string) {
  await page.getByPlaceholder(/新建待办/).fill(title);
  await page.getByPlaceholder(/新建待办/).press('Enter');
}

/**
 * antd Button 会在两个汉字间插入空格（"添加"→"添 加"）。
 * 该助手生成容忍空格的正则，避免精确名匹配落空。
 */
export const cjk = (s: string) => new RegExp(s.split('').join('\\s*'));
