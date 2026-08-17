<script setup lang="ts">
/**
 * Stream TOC Scroll Spy（Issue #9 / Stream Agent J）—— 全页唯一交互岛（client:idle）。
 *
 * - Active 同步（验收重点）：单个 IntersectionObserver 观察全部 <section data-stream-section>，
 *   rootMargin = `-${headerH}px 0px -70% 0px`（headerH 从 getComputedStyle(--header-h) 读，
 *   桌面 / 移动断点下自动响应）；回调里取「文档序最后一条仍与观察带相交的词条」为新 active，
 *   观察带为空时用「最后一个 top ≤ 顶线的可见词条」做几何兜底 → 更新目录高亮
 *   （is-active + aria-current）并把目录滚动到当前项可见（block: nearest，无动画）。
 *   无 JS 降级：目录是 SSR 纯锚点链接，默认首项 is-active。
 *
 * - ?category= 客户端收缩（SSR 读不到 query，静态托管兜底，PRD §8 非阻断）：
 *   隐藏其它分类的阅读流分组 / 目录组 / 顶部 chips，并展示「分类：X」tag；
 *   同时重写「索引 / 图鉴」链接携带 q/category 上下文（URL as Shareable State）。
 */
import { onBeforeUnmount, onMounted } from 'vue';
import { readViewState } from '@/lib/url';

const props = defineProps<{
  categories: Array<{ key: string; name: string; nameZh: string }>;
}>();

/** 读取 --header-h（rem 值）并换算为像素。
 *  ⚠ parseFloat("4rem") 只会得到 4（丢单位），必须 × 根字号才能得到真实像素，
 *  否则 IO rootMargin 与 topActive 顶线整体错位（QA Agent L / Issue #14 收敛）。 */
function headerH(): number {
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--header-h');
  const v = Number.parseFloat(raw);
  if (!Number.isFinite(v) || v <= 0) return 64;
  const rootFs =
    Number.parseFloat(
      window.getComputedStyle(document.documentElement).fontSize,
    ) || 16;
  return v * rootFs;
}

onMounted(() => {
  // ───────── 收集 DOM 引用 ─────────
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>('[data-stream-section]'),
  );
  const tocContainer = document.querySelector<HTMLElement>(
    '[data-stream-toc-container]',
  );
  const slugLinks = new Map<string, HTMLElement[]>();
  document.querySelectorAll<HTMLElement>('[data-stream-toc-link]').forEach((el) => {
    const slug = el.getAttribute('data-slug');
    if (!slug) return;
    const list = slugLinks.get(slug) ?? [];
    list.push(el);
    slugLinks.set(slug, list);
  });

  const isVisible = (el: HTMLElement): boolean =>
    !el.hidden && !el.closest('[hidden]');

  // ───────── ?category= 客户端收缩（非阻断增强）─────────
  const state = readViewState(new URL(window.location.href));
  const catKey = state.category;
  if (catKey) {
    document.querySelectorAll<HTMLElement>('[data-stream-cat-head]').forEach((el) => {
      el.hidden = el.getAttribute('data-stream-cat-head') !== catKey;
    });
    document.querySelectorAll<HTMLElement>('[data-stream-toc-cat]').forEach((el) => {
      el.hidden = el.getAttribute('data-stream-toc-cat') !== catKey;
    });
    document.querySelectorAll<HTMLElement>('[data-stream-cat-chip]').forEach((el) => {
      const on = el.getAttribute('data-stream-cat-chip') === catKey;
      el.hidden = !on;
      el.classList.toggle('chip--active', on);
    });
    const catTag = document.querySelector<HTMLElement>('[data-stream-cat-tag]');
    if (catTag) {
      const cat = props.categories.find((c) => c.key === catKey);
      catTag.hidden = false;
      catTag.textContent = cat ? `分类：${cat.name}` : '';
    }
  }

  // 上下文链接补写（buildContextLink 的 SSR 侧读不到 query，这里按当前 URL 补全）
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (catKey) params.set('category', catKey);
  const qs = params.toString();
  const indexLink = document.querySelector<HTMLAnchorElement>(
    '[data-stream-index-link]',
  );
  if (indexLink) indexLink.href = `${base}/docs/${qs ? `?${qs}` : ''}`;
  const galleryLink = document.querySelector<HTMLAnchorElement>(
    '[data-stream-gallery-link]',
  );
  if (galleryLink) galleryLink.href = `${base}/${qs ? `?${qs}` : ''}`;

  // ───────── Scroll Spy ─────────
  let active = '';

  const syncScroll = (slug: string): void => {
    if (!tocContainer) return;
    const links = slugLinks.get(slug);
    if (!links?.length) return;
    const link =
      links.find((el) => el.closest('[data-stream-toc-container]')) ?? links[0];
    const cRect = tocContainer.getBoundingClientRect();
    const lRect = link.getBoundingClientRect();
    if (lRect.top < cRect.top || lRect.bottom > cRect.bottom) {
      // block:'nearest' 只滚动目录容器（sticky 面板始终在视口内，不动整页）；
      // 不设 behavior → 尊重容器自身 scroll-behavior（默认 auto，无动画冲突）
      link.scrollIntoView({ block: 'nearest' });
    }
  };

  const setActive = (slug: string): void => {
    if (!slug || slug === active) return;
    active = slug;
    document.querySelectorAll<HTMLElement>('[data-stream-toc-link]').forEach((el) => {
      const on = el.getAttribute('data-slug') === slug;
      el.classList.toggle('is-active', on);
      if (on) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
    syncScroll(slug);
  };

  /**
   * 几何兜底：返回「最后一个 top ≤ 顶线的可见词条」；
   * 页面顶部（第一个词条还低于顶线）时返回 null，由调用方取第一条可见词条。
   *
   * 顶线取 header 高 + 锚点留白（scroll-padding-top = header + 1.5rem）：
   * 词条经锚点定位后 rest 在 header+1.5rem 处（≥64rem 桌面为 64+24=88px），
   * 若只按 header 高度（64px）判断，刚定位的词条会被误判为「未经过顶线」
   * 而停留在上一词条（QA Agent L / Issue #14 收敛）。
   */
  const topActive = (): string | null => {
    // 顶线加 1px 容差：锚点定位后词条 top 因子像素（如 88.0x）恰好在顶线上，
    // 严格 `> line` 会把它判为「未经过顶线」而停在上一词条（QA Agent L / Issue #14）。
    const line = headerH() + 24 + 1;
    let best: string | null = null;
    for (const s of sections) {
      if (!isVisible(s)) continue;
      if (s.getBoundingClientRect().top > line) break;
      best = s.id;
    }
    return best;
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        let latest: string | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) latest = (entry.target as HTMLElement).id;
        }
        if (latest) setActive(latest);
        else {
          const top = topActive();
          if (top) setActive(top);
        }
      },
      { rootMargin: `-${headerH()}px 0px -70% 0px`, threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
  }

  // 初始高亮：优先「最近经过顶线者」，否则第一条可见（与 SSR 默认一致或补正到正确分类）
  const initial = topActive() ?? sections.find((s) => isVisible(s))?.id ?? null;
  if (initial) setActive(initial);

  // 滚动静止后的几何归位（QA Agent L / Issue #14）：IntersectionObserver 只在
  // 目标穿越观察带时回调，快速滚动 / 页面加载后程序化定位时可能漏报最后一段，
  // 导致 Active 停在上一词条。这里在滚动结束 ~120ms 后用 topActive 收敛一次，
  // setActive 幂等，不干扰 IO 的常规同步。
  let scrollSettleTimer: number | undefined;
  const onScrollSettle = (): void => {
    window.clearTimeout(scrollSettleTimer);
    scrollSettleTimer = window.setTimeout(() => {
      const top = topActive();
      if (top) setActive(top);
    }, 120);
  };
  window.addEventListener('scroll', onScrollSettle, { passive: true });
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScrollSettle);
    window.clearTimeout(scrollSettleTimer);
  });
});
</script>

<template>
  <!-- 无渲染岛：仅承载 Scroll Spy 逻辑（script-only） -->
  <span class="stream-toc-sync" aria-hidden="true"></span>
</template>