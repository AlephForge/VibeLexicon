import { test, expect, type Page } from '@playwright/test';
import { siteUrl } from './helpers';

/**
 * Gallery：URL 即可分享状态（?category= / ?q=）。
 *
 * 已知行为边界：
 * - 静态 SSG 下 query 由 `client:idle` 过滤岛接管，初始有短暂全量显示后收敛；
 *   「可见卡片数」断言统一用 web-first 轮询（toHaveCount）。
 * - FeaturedPanel 的「在文档视图中浏览 →」是构建期静态链接（Astro SSG 下
 *   `Astro.url` 不含 query），不携带当前筛选上下文；测试按实际行为断言
 *   只进入 /docs/。
 */

const card = () => `[data-pattern-card]`;

/** 交互动作可能在过滤岛水合前执行（client:idle），用 toPass 重试到生效。 */
async function retry(page: Page, run: () => Promise<void>): Promise<void> {
  await expect(async () => {
    await run();
    await expect(page.locator(`${card()}:visible`)).not.toHaveCount(40, {
      timeout: 1500,
    });
  }).toPass({ timeout: 15_000 });
}

test.describe('gallery', () => {
  test('默认加载展示 40 张卡片', async ({ page }) => {
    await page.goto(siteUrl('/'));
    await expect(page.locator(card())).toHaveCount(40);
    await expect(page.locator(`${card()}:visible`)).toHaveCount(40);
  });

  test('点击「导航与切换」chip → URL 带 category=navigation 且恰好 10 卡可见', async ({
    page,
  }) => {
    await page.goto(siteUrl('/'));
    await retry(page, () =>
      page.getByRole('button', { name: '导航与切换' }).click(),
    );

    await expect(page).toHaveURL(/[?&]category=navigation/);
    await expect(page.locator(`${card()}:visible`)).toHaveCount(10);

    // chip 的 aria-pressed 同步为按下态
    await expect(
      page.getByRole('button', { name: '导航与切换' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('点击「全部」chip → category 参数被移除且恢复 40 卡', async ({ page }) => {
    await page.goto(siteUrl('/'));
    await retry(page, () =>
      page.getByRole('button', { name: '导航与切换' }).click(),
    );
    await expect(page.locator(`${card()}:visible`)).toHaveCount(10);

    await page.getByRole('button', { name: '全部' }).click();

    await expect(page).not.toHaveURL(/category=/);
    await expect(page.locator(`${card()}:visible`)).toHaveCount(40);
  });

  test('直达 ?category=navigation 深链：水合后收敛为 10 卡可见', async ({ page }) => {
    await page.goto(siteUrl('/?category=navigation'));
    await expect(page.locator(`${card()}:visible`)).toHaveCount(10, {
      timeout: 10_000,
    });
  });

  test('搜索框输入 Modal → URL 带 q=Modal 且仅 Modal 卡可见', async ({ page }) => {
    await page.goto(siteUrl('/'));
    const input = page.getByRole('searchbox', { name: '搜索图鉴' });

    await expect(async () => {
      await input.fill('Modal');
      await expect(page.locator(`${card()}:visible`)).toHaveCount(1, {
        timeout: 1500,
      });
    }).toPass({ timeout: 15_000 });

    await expect(page).toHaveURL(/[?&]q=Modal/);
    await expect(page.locator(`${card()}[data-slug="modal"]`)).toBeVisible();
    // 命中计数（aria-live）
    await expect(page.getByText('命中 1 / 40')).toBeVisible();
  });

  test('Gallery 精选面板的「在文档视图中浏览」进入 /docs/', async ({ page }) => {
    await page.goto(siteUrl('/'));

    // FeaturedPanel 静态渲染；点击后应到达 Docs 索引页。
    // 注意（实际行为）：该链接由 SSR 构建期生成，不携带当前筛选 query。
    // 并行满负载下偶发瞬时导航失败（chrome-error），重试整段直到真正落位。
    await expect(async () => {
      await page.goto(siteUrl('/'));
      const link = page.getByRole('link', { name: /在文档视图中浏览/ });
      await link.waitFor({ state: 'visible', timeout: 5000 });
      await link.click();
      await page.waitForURL(/\/VibeLexicon\/docs\/$/, { timeout: 8000 });
    }).toPass({ timeout: 40_000 });

    await expect(
      page.getByRole('heading', { name: '界面模式索引' }),
    ).toBeVisible();
  });
});