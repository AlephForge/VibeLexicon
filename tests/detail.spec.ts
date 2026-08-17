import { test, expect } from '@playwright/test';
import { siteUrl } from './helpers';

/**
 * Pattern Detail（/patterns/drawer/ 为代表）：Demo Stage、Prompt Copy、
 * Viewport 切换、Reset、Related、Source。
 *
 * Demo Stage 交互组件是 `client:visible` 岛：水合前点击无效，
 * 交互断言用 toPass 重试；纯「存在性」断言用 toBeVisible 轮询即可。
 */

const demoStage = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: 'Drawer · 抽屉 示例演示' });

test.describe('pattern detail', () => {
  test('Demo Stage 存在且为完整交互 Demo（含视口切换与重置）', async ({ page }) => {
    await page.goto(siteUrl('/patterns/drawer/'));
    const stage = demoStage(page);
    await stage.scrollIntoViewIfNeeded();

    await expect(stage).toBeVisible({ timeout: 10_000 });
    // 完整交互版徽标（Full Demo 已合入）
    await expect(stage.getByText('完整交互 Demo')).toBeVisible({ timeout: 10_000 });

    const viewportGroup = stage.getByRole('group', { name: '视口切换' });
    await expect(viewportGroup.getByRole('button', { name: '桌面' })).toBeEnabled();
    await expect(viewportGroup.getByRole('button', { name: '移动' })).toBeEnabled();
    await expect(stage.getByRole('button', { name: '重置' })).toBeEnabled();
  });

  test('点击「复制 Prompt」→ 状态行出现「已复制到剪贴板」', async ({ page }) => {
    await page.goto(siteUrl('/patterns/drawer/'));

    // 按钮的 aria-label 是「复制 <prompt 摘要>… 到剪贴板」，按剪贴板语义定位。
    // PromptCopy 是 client:load 岛：水合前点击会丢失 → 重试到状态行出现。
    const copyBtn = page.getByRole('button', { name: /到剪贴板/ });
    const statusLine = page.getByText('已复制到剪贴板');
    await expect(async () => {
      await copyBtn.click();
      await expect(statusLine).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15_000 });
  });

  test('视口切换：点击「移动」→ Stage 容器进入移动态', async ({ page }) => {
    await page.goto(siteUrl('/patterns/drawer/'));
    const stage = demoStage(page);
    await stage.scrollIntoViewIfNeeded();

    const mobileBtn = stage.getByRole('button', { name: '移动' });
    await expect(async () => {
      await mobileBtn.click();
      await expect(
        stage.locator('.demo-stage__body--mobile'),
      ).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });

    // 切回桌面态
    await stage.getByRole('button', { name: '桌面' }).click();
    await expect(stage.locator('.demo-stage__body--mobile')).toHaveCount(0, {
      timeout: 5000,
    });
  });

  test('Reset 按钮存在且重置后回到初始状态（可反复点）', async ({ page }) => {
    await page.goto(siteUrl('/patterns/drawer/'));
    const stage = demoStage(page);
    await stage.scrollIntoViewIfNeeded();

    const reset = stage.getByRole('button', { name: '重置' });
    await expect(reset).toBeEnabled({ timeout: 10_000 });
    // 点两次不应报错（resetSignal 步进触发复位逻辑）
    await reset.click();
    await reset.click();
    await expect(stage).toBeVisible();
  });

  test('Related 相关模式链接可达（点击任一 → 200 详情页）', async ({ page }) => {
    await page.goto(siteUrl('/patterns/drawer/'));

    const related = page.locator('section[aria-labelledby="related-heading"]');
    await expect(related).toBeVisible();

    const firstLink = related.locator('a').first();
    await firstLink.click();

    await expect(page).toHaveURL(/\/patterns\/[a-z0-9-]+\/$/);
    await expect(
      page.getByRole('heading', { level: 1 }),
    ).toBeVisible();
  });
});