import { test, expect, type Page } from '@playwright/test';
import { mockLogin, addTodoViaToday, cjk } from './helpers';

async function gotoTodosWith(page: Page, titles: string[]) {
  await mockLogin(page);
  for (const t of titles) {
    await addTodoViaToday(page, t);
    await expect(page.getByText(t).first()).toBeVisible(); // 等创建落定再建下一个，避免连续提交丢任务
  }
  await page.goto('/todos');
  await expect(page.getByRole('table')).toBeVisible();
}

const rowOf = (page: Page, t: string) => page.locator('tr', { hasText: t });

test('待办表格加载并显示已建待办', async ({ page }) => {
  const t = `L-${Date.now()}`;
  await gotoTodosWith(page, [t]);
  await expect(page.getByText(t)).toBeVisible();
});

test('单行删除 → 行消失', async ({ page }) => {
  const t = `D-${Date.now()}`;
  await gotoTodosWith(page, [t]);
  await rowOf(page, t).getByRole('button', { name: cjk('删除') }).click();
  await page.getByRole('button', { name: cjk('确定') }).click();
  await expect(page.getByText(t)).toHaveCount(0);
});

test('批量完成 → 状态变 已完成', async ({ page }) => {
  const a = `B1-${Date.now()}`;
  const b = `B2-${Date.now()}`;
  await gotoTodosWith(page, [a, b]);
  await rowOf(page, a).getByRole('checkbox').check();
  await rowOf(page, b).getByRole('checkbox').check();
  await page.getByRole('button', { name: cjk('批量完成') }).click();
  await expect(rowOf(page, a)).toContainText('已完成');
  await expect(rowOf(page, b)).toContainText('已完成');
});

test('批量删除 → 行消失', async ({ page }) => {
  const a = `BD1-${Date.now()}`;
  const b = `BD2-${Date.now()}`;
  await gotoTodosWith(page, [a, b]);
  await rowOf(page, a).getByRole('checkbox').check();
  await rowOf(page, b).getByRole('checkbox').check();
  await page.getByRole('button', { name: cjk('批量删除') }).click();
  await page.getByRole('button', { name: cjk('确定') }).click();
  await expect(page.getByText(a)).toHaveCount(0);
  await expect(page.getByText(b)).toHaveCount(0);
});
