/**
 * Preview/Demo Registry —— 纯数据与类型模块。
 *
 * 契约（AGENTS.md / PRD §13）：
 * - 内容层只声明稳定 preview key（如 `drawer`），禁止引用组件路径；
 * - 本模块是依赖图叶子：禁止 import 任何 .astro/.vue 组件与 astro:content，
 *   以保证 zod schema、Content Validator（tsx 运行）与页面层三方同源引用、无循环依赖；
 * - key → 组件的唯一映射在 `./components.ts`（只被 Astro 页面层 import）。
 */
export const PREVIEW_KEYS = [
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
] as const;

export type PreviewKey = (typeof PREVIEW_KEYS)[number];

/** 10 个 MVP Full Interactive Demo（PRD §9.4 清单） */
export const FULL_DEMO_KEYS = [
  'card-based-layout',
  'masonry-layout',
  'bento-grid',
  'hero-section',
  'tabs',
  'modal',
  'drawer',
  'accordion',
  'lightbox',
  'command-palette',
] as const satisfies readonly PreviewKey[];

export type FullDemoKey = (typeof FULL_DEMO_KEYS)[number];

export function isPreviewKey(v: string): v is PreviewKey {
  return (PREVIEW_KEYS as readonly string[]).includes(v);
}

export function isFullDemoKey(v: string): v is FullDemoKey {
  return (FULL_DEMO_KEYS as readonly string[]).includes(v);
}

/** 该 preview key 是否已有 Full Demo（Detail 页据此决定加载交互版还是 Mini） */
export function hasFull(key: PreviewKey): boolean {
  return isFullDemoKey(key);
}
