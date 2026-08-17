import { test, expect } from '@playwright/test';
import { openPalette, siteUrl } from './helpers';

/**
 * 全站 SearchPalette（Cmd/Ctrl+K、[data-search-trigger]、Pagefind + 本地兜底）。
 *
 * 已知行为：
 * - 静态搜索索引（Pagefind）在 preview 下可用；本地 fallback 同样可命中；
 *   断言统一面向「结果呈现」，不绑定具体数据源。
 * - 打开后出现 160ms 防抖 + Pagefind 懒加载，先短暂显示浏览态（40 条）
 *   再收敛到查询结果——因此对「首个结果」的断言用 toHaveText 轮询。
 */

const paletteDialog = (page: import('@playwright/test').Page) =>
  page.getByRole('dialog', { name: '全局搜索' });

test.describe('search palette', () => {
  test('Ctrl+K 打开 Palette，输入框自动聚焦', async ({ page }) => {
    await page.goto(siteUrl('/'));
    await openPalette(page);

    const dialog = paletteDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: '全局搜索' })).toBeFocused();
  });

  test('Header [data-search-trigger] 按钮打开 Palette', async ({ page }) => {
    await page.goto(siteUrl('/'));
    const trigger = page.locator('[data-search-trigger]').first();

    // 水合竞态（client:visible）：重试直到点击生效
    await expect(async () => {
      await trigger.click();
      await expect(paletteDialog(page)).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 20_000 });
  });

  test('输入 drawer → 首个结果含 Drawer，↑↓ 选择 + Enter 跳转详情页', async ({
    page,
  }) => {
    await page.goto(siteUrl('/'));
    await openPalette(page);

    const dialog = paletteDialog(page);
    const input = dialog.getByRole('combobox');
    await input.fill('drawer');

    // 期望首个命中是 Drawer 详情页（Pagefind 或本地 fallback 均命中）
    await expect(dialog.getByRole('option').first()).toHaveText(/Drawer/, {
      timeout: 10_000,
    });

    // roving：ArrowDown 离开首位，ArrowUp 回首位，Enter 打开
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/patterns\/drawer\/$/, { timeout: 10_000 });
  });

  test('输入中文「抽屉」→ 有结果且首个结果含抽屉', async ({ page }) => {
    await page.goto(siteUrl('/'));
    await openPalette(page);

    const dialog = paletteDialog(page);
    await dialog.getByRole('combobox').fill('抽屉');

    await expect(dialog.getByRole('option').first()).toHaveText(/抽屉/, {
      timeout: 10_000,
    });
  });

  test('Esc 关闭 Palette，并把焦点归还给触发按钮', async ({ page }) => {
    await page.goto(siteUrl('/'));
    const trigger = page.locator('[data-search-trigger]').first();

    await expect(async () => {
      await trigger.click();
      await expect(paletteDialog(page)).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 20_000 });

    await page.keyboard.press('Escape');

    // 关闭动画约 200ms 后卸载
    await expect(paletteDialog(page)).toHaveCount(0, { timeout: 5000 });
    await expect(trigger).toBeFocused();
  });

  test('无匹配查询 → 空态提示「未找到匹配的模式」', async ({ page }) => {
    await page.goto(siteUrl('/'));
    await openPalette(page);

    const dialog = paletteDialog(page);
    await dialog.getByRole('combobox').fill('zzzzqqqqjunk');

    await expect(dialog.getByRole('status')).toHaveText('未找到匹配的模式', {
      timeout: 10_000,
    });
  });
});