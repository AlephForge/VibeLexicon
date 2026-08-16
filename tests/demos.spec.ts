import { test, expect, type Page } from '@playwright/test';
import { siteUrl } from './helpers';

/**
 * Full Interactive Demo 回归（Issue #15 验收重点）：
 * tabs / modal / drawer / accordion / command-palette / lightbox。
 *
 * 约定：
 * - 全部 Full Demo 是 `client:visible` 懒加载岛，水合前点击无效；
 *   交互统一用「重试点击 + 可见性断言」的 toPass 模式。
 * - 覆盖层行为（focus trap / Esc / 焦点归还 / 滚动锁）按 PRD §18 断言。
 */

/** 重复点击直到期望元素可见（水合竞态安全）。 */
async function retryUntilVisible(
  page: Page,
  act: () => Promise<void>,
  visible: () => ReturnType<Page['getByRole']> | ReturnType<Page['locator']>,
): Promise<void> {
  await expect(async () => {
    await act();
    await expect(visible()).toBeVisible({ timeout: 1200 });
  }).toPass({ timeout: 20_000 });
}

test.describe('demos', () => {
  test('tabs：tablist 语义 + 点击切换面板 + 键盘 ArrowRight 移动焦点', async ({
    page,
  }) => {
    await page.goto(siteUrl('/patterns/tabs/'));
    await page
      .getByRole('region', { name: 'Tabs · 标签切换 示例演示' })
      .scrollIntoViewIfNeeded();

    const tablist = page.getByRole('tablist', { name: '内容视图切换' });
    await expect(tablist).toBeVisible({ timeout: 10_000 });

    // 键盘 roving tabindex：聚焦首个标签（初始 focusIndex=0）→ ArrowRight 移动焦点
    const overview = page.getByRole('tab', { name: '概览' });
    const analysis = page.getByRole('tab', { name: '分析' });
    await overview.focus();
    await expect(overview).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(analysis).toBeFocused();

    // 点击切换：当前焦点在「分析」，点击后激活对应面板
    await analysis.click();
    const panel = page.getByRole('tabpanel', { name: '分析' });
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('近 7 天访问趋势');
  });

  test('modal：打开 → 焦点入框 Esc 关闭 → 焦点归还触发按钮', async ({ page }) => {
    await page.goto(siteUrl('/patterns/modal/'));
    await page
      .getByRole('region', { name: 'Modal · 模态框 示例演示' })
      .scrollIntoViewIfNeeded();

    const trigger = page.getByRole('button', { name: '删除项目' });
    const dialog = page.getByRole('dialog', { name: '确认删除项目？' });

    await retryUntilVisible(page, () => trigger.click(), () => dialog);

    // 初始焦点移入「取消」
    await expect(dialog.getByRole('button', { name: '取消' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0, { timeout: 5000 });
    await expect(trigger).toBeFocused();
  });

  test('drawer：打开 → 背景滚动锁定 → Esc 关闭并解锁', async ({ page }) => {
    await page.goto(siteUrl('/patterns/drawer/'));
    await page
      .getByRole('region', { name: 'Drawer · 抽屉 示例演示' })
      .scrollIntoViewIfNeeded();

    const trigger = page.getByRole('button', { name: '打开设置' });
    const dialog = page.getByRole('dialog', { name: '界面设置' });

    await retryUntilVisible(page, () => trigger.click(), () => dialog);

    // 滚动锁：body overflow hidden
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
      .toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0, { timeout: 5000 });
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
      .not.toBe('hidden');
    await expect(trigger).toBeFocused();
  });

  test('accordion：aria-expanded 随点击切换（展开 ⇄ 收起）', async ({ page }) => {
    await page.goto(siteUrl('/patterns/accordion/'));
    await page
      .getByRole('region', { name: 'Accordion · 手风琴 示例演示' })
      .scrollIntoViewIfNeeded();

    const first = page.getByRole('button', { name: /什么是响应式布局/ });
    await expect(async () => {
      await first.click();
      await expect(first).toHaveAttribute('aria-expanded', 'false', {
        timeout: 1200,
      });
    }).toPass({ timeout: 20_000 });

    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true', {
      timeout: 3000,
    });
  });

  test('command-palette：Ctrl+K 打开 → 输入过滤 → Esc 关闭', async ({ page }) => {
    await page.goto(siteUrl('/patterns/command-palette/'));
    await page
      .getByRole('region', { name: 'Command Palette · 命令面板 示例演示' })
      .scrollIntoViewIfNeeded();

    // Ctrl+K 打开 Demo 面板（全站 Palette 也会响应，二者并存；按名称区分断言）
    const demoDialog = page.getByRole('dialog', { name: '命令面板' });
    await expect(async () => {
      await page.keyboard.press('Control+k');
      await expect(demoDialog).toBeVisible({ timeout: 1200 });
    }).toPass({ timeout: 20_000 });

    const input = demoDialog.getByRole('combobox');
    await expect(input).toBeFocused();
    await input.fill('drawer');
    await expect(demoDialog.getByRole('option').first()).toContainText(/抽屉|Drawer/, {
      timeout: 5000,
    });

    // Esc：焦点陷阱（capture 优先）关闭 Demo 面板
    await page.keyboard.press('Escape');
    await expect(demoDialog).toHaveCount(0, { timeout: 5000 });

    // 收掉可能仍开着的全站 Palette，避免遮挡后续交互
    if (await page.getByRole('dialog', { name: '全局搜索' }).count()) {
      await page.keyboard.press('Escape');
      await expect(
        page.getByRole('dialog', { name: '全局搜索' }),
      ).toHaveCount(0, { timeout: 5000 });
    }
  });

  test('command-palette：输入 + ↑↓ + Enter 跳转 /patterns/drawer/', async ({
    page,
  }) => {
    await page.goto(siteUrl('/patterns/command-palette/'));
    await page
      .getByRole('region', { name: 'Command Palette · 命令面板 示例演示' })
      .scrollIntoViewIfNeeded();

    const demoDialog = page.getByRole('dialog', { name: '命令面板' });
    const trigger = page.getByRole('button', { name: /搜索模式、页面与命令/ });

    // 用触发按钮打开（确定性，避开与全站 Palette 的 Ctrl+K 竞争）
    await retryUntilVisible(page, () => trigger.click(), () => demoDialog);

    const input = demoDialog.getByRole('combobox');
    await input.fill('drawer');
    await expect(demoDialog.getByRole('option').first()).toContainText(
      /抽屉|Drawer/,
      { timeout: 5000 },
    );

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/patterns\/drawer\/$/, { timeout: 10_000 });
  });

  test('lightbox：点击缩略图打开大图 → Esc 关闭并归还焦点', async ({ page }) => {
    await page.goto(siteUrl('/patterns/lightbox/'));
    await page
      .getByRole('region', { name: 'Lightbox · 图片灯箱 示例演示' })
      .scrollIntoViewIfNeeded();

    const thumb = page.getByRole('button', { name: '打开第 1 张：暖阳' });
    const dialog = page.getByRole('dialog', { name: '图片灯箱' });

    await retryUntilVisible(page, () => thumb.click(), () => dialog);
    await expect(dialog).toContainText('1 / 4');

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0, { timeout: 5000 });
    await expect(thumb).toBeFocused();
  });
});