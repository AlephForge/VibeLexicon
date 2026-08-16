import { test, expect } from '@playwright/test';
import { PATTERN_SLUGS, siteUrl } from './helpers';

/**
 * Smoke：四路由加载 + 40 个详情页全部 200 + 非法 slug 404。
 * 覆盖 PRD §24.2「首页加载 / Pattern Detail 可打开」与内容可寻址性。
 */

test.describe('smoke', () => {
  test('四核心路由都能加载（/、/docs/、/docs/stream/、详情页）', async ({ page }) => {
    // Gallery：h1 精确匹配（首屏内 Mini 预览也会出现相同文案，需限定 heading level）
    await page.goto(siteUrl('/'));
    await expect(
      page.getByRole('heading', { level: 1, name: /把 UI 术语/ }),
    ).toBeVisible();

    // Docs 索引
    await page.goto(siteUrl('/docs/'));
    await expect(
      page.getByRole('heading', { name: '界面模式索引' }),
    ).toBeVisible();

    // Stream 连续阅读
    await page.goto(siteUrl('/docs/stream/'));
    await expect(
      page.getByRole('heading', { name: '连续阅读' }),
    ).toBeVisible();

    // Detail：标题含英文名 Drawer
    await page.goto(siteUrl('/patterns/drawer/'));
    await expect(page).toHaveTitle(/Drawer/);
    await expect(
      page.getByRole('heading', { name: /Drawer\s*抽屉/ }),
    ).toBeVisible();
  });

  test('40 个详情页全部返回 200', async ({ request }) => {
    for (const slug of PATTERN_SLUGS) {
      const res = await request.get(siteUrl(`/patterns/${slug}/`));
      expect(res.status(), `patterns/${slug}/ 应返回 200`).toBe(200);
    }
  });

  test('未知的 Pattern slug 落到 Astro 404 页（status 404）', async ({ request }) => {
    const res = await request.get(siteUrl('/patterns/this-pattern-does-not-exist/'));
    expect(res.status()).toBe(404);
  });
});