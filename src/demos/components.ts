/**
 * key → 组件唯一映射模块。
 *
 * 契约：
 * - 只被 Astro 页面层 import（Gallery / Docs / Stream / Detail）；
 * - registry.ts（纯数据）→ components.ts（组件映射）单向依赖，无循环；
 * - Record 缺项 = 编译失败（新增 preview key 的强制提醒）；
 * - `fullComponents` 初始为空映射，由 W3 Demo Agent 完成后由 Integration
 *   统一合并（禁止多个 Agent 同时修改本文件）。
 */
import type { Component as VueComponent } from 'vue';
import type { PreviewKey, FullDemoKey } from './registry';

import CardBasedLayoutMini from './card-based-layout/mini.astro';
import MasonryLayoutMini from './masonry-layout/mini.astro';
import BentoGridMini from './bento-grid/mini.astro';
import SplitScreenLayoutMini from './split-screen-layout/mini.astro';
import CssGridLayoutMini from './css-grid-layout/mini.astro';
import FlexboxMini from './flexbox/mini.astro';
import SidebarLayoutMini from './sidebar-layout/mini.astro';
import DashboardLayoutMini from './dashboard-layout/mini.astro';
import ResponsiveLayoutMini from './responsive-layout/mini.astro';
import FullBleedLayoutMini from './full-bleed-layout/mini.astro';
import SinglePageWebsiteMini from './single-page-website/mini.astro';
import MultiPageWebsiteMini from './multi-page-website/mini.astro';
import LandingPageMini from './landing-page/mini.astro';
import CaseStudyPageMini from './case-study-page/mini.astro';
import HeroSectionMini from './hero-section/mini.astro';
import FeatureGridMini from './feature-grid/mini.astro';
import StickyStorytellingMini from './sticky-storytelling/mini.astro';
import TimelineMini from './timeline/mini.astro';
import FaqSectionMini from './faq-section/mini.astro';
import FooterMini from './footer/mini.astro';
import StickyNavbarMini from './sticky-navbar/mini.astro';
import HamburgerMenuMini from './hamburger-menu/mini.astro';
import BreadcrumbMini from './breadcrumb/mini.astro';
import AnchorLinkMini from './anchor-link/mini.astro';
import TabsMini from './tabs/mini.astro';
import SidebarNavigationMini from './sidebar-navigation/mini.astro';
import MegaMenuMini from './mega-menu/mini.astro';
import BottomNavigationMini from './bottom-navigation/mini.astro';
import PaginationMini from './pagination/mini.astro';
import BackToTopMini from './back-to-top/mini.astro';
import ModalMini from './modal/mini.astro';
import DrawerMini from './drawer/mini.astro';
import AccordionMini from './accordion/mini.astro';
import TooltipMini from './tooltip/mini.astro';
import ToastMini from './toast/mini.astro';
import CarouselMini from './carousel/mini.astro';
import LightboxMini from './lightbox/mini.astro';
import FormMini from './form/mini.astro';
import CommandPaletteMini from './command-palette/mini.astro';
import FloatingActionButtonMini from './floating-action-button/mini.astro';

// Full Demo 组件（Vue 3，Detail 页按需激活）
import CardBasedLayoutFull from './card-based-layout/full.vue';
import MasonryLayoutFull from './masonry-layout/full.vue';
import BentoGridFull from './bento-grid/full.vue';
import HeroSectionFull from './hero-section/full.vue';
import TabsFull from './tabs/full.vue';
import ModalFull from './modal/full.vue';
import DrawerFull from './drawer/full.vue';
import AccordionFull from './accordion/full.vue';
import LightboxFull from './lightbox/full.vue';
import CommandPaletteFull from './command-palette/full.vue';

export const miniComponents: Record<PreviewKey, typeof CardBasedLayoutMini> = {
  'card-based-layout': CardBasedLayoutMini,
  'masonry-layout': MasonryLayoutMini,
  'bento-grid': BentoGridMini,
  'split-screen-layout': SplitScreenLayoutMini,
  'css-grid-layout': CssGridLayoutMini,
  flexbox: FlexboxMini,
  'sidebar-layout': SidebarLayoutMini,
  'dashboard-layout': DashboardLayoutMini,
  'responsive-layout': ResponsiveLayoutMini,
  'full-bleed-layout': FullBleedLayoutMini,
  'single-page-website': SinglePageWebsiteMini,
  'multi-page-website': MultiPageWebsiteMini,
  'landing-page': LandingPageMini,
  'case-study-page': CaseStudyPageMini,
  'hero-section': HeroSectionMini,
  'feature-grid': FeatureGridMini,
  'sticky-storytelling': StickyStorytellingMini,
  timeline: TimelineMini,
  'faq-section': FaqSectionMini,
  footer: FooterMini,
  'sticky-navbar': StickyNavbarMini,
  'hamburger-menu': HamburgerMenuMini,
  breadcrumb: BreadcrumbMini,
  'anchor-link': AnchorLinkMini,
  tabs: TabsMini,
  'sidebar-navigation': SidebarNavigationMini,
  'mega-menu': MegaMenuMini,
  'bottom-navigation': BottomNavigationMini,
  pagination: PaginationMini,
  'back-to-top': BackToTopMini,
  modal: ModalMini,
  drawer: DrawerMini,
  accordion: AccordionMini,
  tooltip: TooltipMini,
  toast: ToastMini,
  carousel: CarouselMini,
  lightbox: LightboxMini,
  form: FormMini,
  'command-palette': CommandPaletteMini,
  'floating-action-button': FloatingActionButtonMini,
};

/**
 * key → Full Demo 组件映射（W3 Demo A / Demo B 交付后由 Integration 统一合并）。
 * 仅 Detail 页通过 hasFull + fullComponents 判断并按需 `client:visible` 激活。
 */
export const fullComponents: Record<FullDemoKey, VueComponent> = {
  'card-based-layout': CardBasedLayoutFull,
  'masonry-layout': MasonryLayoutFull,
  'bento-grid': BentoGridFull,
  'hero-section': HeroSectionFull,
  tabs: TabsFull,
  modal: ModalFull,
  drawer: DrawerFull,
  accordion: AccordionFull,
  lightbox: LightboxFull,
  'command-palette': CommandPaletteFull,
};