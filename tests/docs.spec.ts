import { test, expect } from '@playwright/test';
import { siteUrl } from './helpers';

/**
 * Docs / Stream / 移动导航（PRD §24.2：Docs Sidebar、连续阅读上下文、
 * Stream 目录 Active 更新、Mobile Navigation）。
 *
 * 已知行为：
 * - Docs/Stream 的 query 由 `client:idle` 岛在静态托管下接管，初始短暂全量
 *   后收敛——数量断言统一轮询。
 * - 视图切换「连续阅读」链接会由岛补写 ?category= 上下文，点击前先等补写完成；
 *   站点 Header 的同名链接是静态入口，不携带上下文，须用 [data-docs-stream-link] 区分。
 * - 移动端抽屉/Docs 抽屉按钮在移动视口（<64rem）才可见。
 */

test.describe('docs & navigation', () => {
  test('Docs Desktop Sidebar：分类头进入 ?category=navigation，恰好 10 行', async ({
    page,
  }) => {
    await page.goto(siteUrl('/docs/'));
    await expect(
      page.locator('#docs-sidebar').getByRole('link', { name: /All Patterns/ }),
    ).toBeVisible();

    // 默认索引行 40
    await expect(page.locator('[data-docs-row]')).toHaveCount(40);

    await page
      .locator('[data-docs-cat-head][data-cat-key="navigation"]')
      .click();

    await expect(page).toHaveURL(/[?&]category=navigation/);
    await expect(page.locator('[data-docs-row]:visible')).toHaveCount(10);
  });

  test('Docs 深链 ?category=navigation：水合后标题/说明与行数收敛', async ({
    page,
  }) => {
    await page.goto(siteUrl('/docs/?category=navigation'));
    await expect(page.locator('[data-docs-row]:visible')).toHaveCount(10, {
      timeout: 10_000,
    });
    await expect(page.locator('[data-docs-head-name]')).toHaveText('Navigation', {
      timeout: 10_000,
    });
    await expect(page.getByText('分类：Navigation')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Docs 筛选：输入 modal → 词条行收敛到 1 且 URL 带 ?q=modal', async ({
    page,
  }) => {
    await page.goto(siteUrl('/docs/'));
    const filter = page.getByRole('searchbox', { name: '筛选文档词条' });

    // client:idle 水合前输入会丢失 → 重试到生效
    await expect(async () => {
      await filter.fill('modal');
      await expect(page.locator('[data-docs-row]:visible')).toHaveCount(1, {
        timeout: 1500,
      });
    }).toPass({ timeout: 15_000 });

    await expect(page).toHaveURL(/[?&]q=modal/);
    await expect(page.locator('[data-docs-row][data-slug="modal"]')).toBeVisible();
  });

  test('Docs 移动抽屉：打开 → 滚动锁定 → Esc 关闭并归还焦点', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(siteUrl('/docs/'));

    const drawer = page.locator('#docs-sidebar');
    const toggle = page.getByRole('button', { name: '打开目录' });

    await expect(async () => {
      await toggle.click();
      await expect(drawer).toHaveClass(/is-open/, { timeout: 1200 });
    }).toPass({ timeout: 20_000 });

    // 背景滚动锁定
    await expect
      .poll(() =>
        page.evaluate(() => document.body.classList.contains('docs-drawer-open')),
      )
      .toBe(true);

    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/is-open/, { timeout: 5000 });
    await expect(toggle).toBeFocused();
    // 解锁
    await expect
      .poll(() =>
        page.evaluate(() => document.body.classList.contains('docs-drawer-open')),
      )
      .toBe(false);
  });

  test('Site Header 移动导航：打开 → 滚动锁定 → Esc 关闭并归还焦点', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(siteUrl('/'));

    const burger = page.getByRole('button', { name: '打开导航' });
    const nav = page.locator('#site-nav');

    // 内联脚本随页面加载执行；重试避免在脚本就绪前点击
    await expect(async () => {
      await burger.click();
      await expect(nav).toHaveClass(/is-open/, { timeout: 1200 });
    }).toPass({ timeout: 15_000 });

    await expect
      .poll(() => page.evaluate(() => document.body.classList.contains('nav-open')))
      .toBe(true);

    await page.keyboard.press('Escape');
    await expect(nav).not.toHaveClass(/is-open/, { timeout: 5000 });
    await expect(burger).toBeFocused();
  });

  test('Stream TOC：滚动到 #modal → 目录 Active 同步', async ({ page }) => {
    await page.goto(siteUrl('/docs/stream/'));

    const link = page.locator('[data-stream-toc-link][data-slug="modal"]');
    await expect(link).toBeVisible();

    // 页面设有 scroll-behavior:smooth，直接 scrollIntoView 会做长距离动画，
    // 观察带（视口中部）时序不稳定。改为：等 hydration（client:idle）后
    // 先回顶让 IO 有一次观察帧，再瞬时滚动到目标位置（modal top ≈ 88px，
    // 稳定落在观察带内且位于几何兜底线之上）。
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const el = document.getElementById('modal');
      if (el) {
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY - 88,
          behavior: 'instant',
        });
      }
    });

    await expect(link).toHaveAttribute('aria-current', 'true', {
      timeout: 15_000,
    });
  });

  test('Docs → 连续阅读：携带 ?category=navigation 且流收敛到 10 个词条', async ({
    page,
  }) => {
    await page.goto(siteUrl('/docs/?category=navigation'));

    // 视图切换链接由岛补写上下文；等 href 带上 category 后再点
    const streamLink = page.locator('[data-docs-stream-link]');
    await expect(streamLink).toHaveAttribute('href', /category=navigation/, {
      timeout: 10_000,
    });
    await streamLink.click();

    await expect(page).toHaveURL(/\/docs\/stream\/\?category=navigation$/);

    // 客户端收缩：只留导航分类的 10 个 section、1 个分类头
    await expect(page.locator('[data-stream-section]:visible')).toHaveCount(10, {
      timeout: 10_000,
    });
    await expect(page.locator('[data-stream-cat-head]:visible')).toHaveCount(1);
    await expect(page.locator('[data-stream-cat-tag]')).toHaveText(
      '分类：Navigation',
    );
  });
});