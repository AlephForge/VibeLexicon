import { expect, type Page } from '@playwright/test';

/**
 * VibeLexicon QA 共享工具（Issue #15）。
 *
 * baseURL 带路径前缀 `/VibeLexicon` 时，Playwright 会把 `page.goto('/x/')`
 * 解析到 `http://127.0.0.1:4321/x/`（丢了前缀）。因此站内导航一律走 `siteUrl()`，
 * 给出与 astro.config.mjs `base` 一致的绝对站内地址。
 */

/** 与 playwright.config.ts `use.baseURL` 保持一致。 */
export const BASE = 'http://127.0.0.1:4321/VibeLexicon';

/** 把站内路径（如 `/docs/`）解析为可导航的绝对 URL（不丢失 `/VibeLexicon` 前缀）。 */
export function siteUrl(path: string): string {
  return `${BASE}/${path.replace(/^\/+/, '')}`;
}

/**
 * 40 个 Pattern slug（与 src/demos/registry.ts `PREVIEW_KEYS` 同序同值，
 * 测试侧独立镜像，避免依赖 tsconfig 路径别名）。
 */
export const PATTERN_SLUGS: string[] = [
  // Layout（10）
  'card-based-layout',
  'masonry-layout',
  'bento-grid',
  'split-screen-layout',
  'css-grid-layout',
  'flexbox',
  'sidebar-layout',
  'dashboard-layout',
  'responsive-layout',
  'full-bleed-layout',
  // Page Structure（10）
  'single-page-website',
  'multi-page-website',
  'landing-page',
  'case-study-page',
  'hero-section',
  'feature-grid',
  'sticky-storytelling',
  'timeline',
  'faq-section',
  'footer',
  // Navigation（10）
  'sticky-navbar',
  'hamburger-menu',
  'breadcrumb',
  'anchor-link',
  'tabs',
  'sidebar-navigation',
  'mega-menu',
  'bottom-navigation',
  'pagination',
  'back-to-top',
  // Components（10）
  'modal',
  'drawer',
  'accordion',
  'tooltip',
  'toast',
  'carousel',
  'lightbox',
  'form',
  'command-palette',
  'floating-action-button',
];

/**
 * 打开全站 SearchPalette。
 *
 * Palette 是 `client:visible` 岛：刚导航完立刻按键可能落在水合之前（事件丢失）。
 * 用 `toPass` 重试：事件被吞掉时再按一次，直到对话框出现。
 */
export async function openPalette(page: Page): Promise<void> {
  await expect(async () => {
    await page.keyboard.press('Control+k');
    await expect(
      page.getByRole('dialog', { name: '全局搜索' }),
    ).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 20_000 });
}