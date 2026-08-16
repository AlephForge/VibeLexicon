<script setup lang="ts">
/**
 * Docs 交互岛（Issue #8 / Docs Agent F）—— 同一组件、两种轻量挂载：
 *
 * - mode="filter"（client:idle，挂靠在 DocsSidebar 的筛选槽）
 *   职责：实时筛选（与 SSR 共用 @/lib/patterns 的 filterPatterns 纯函数）+
 *   history.replaceState 同步 ?q=；只切换 [data-docs-row] / [data-sidebar-pattern] /
 *   [data-docs-anchor] 的 hidden 属性，不重渲染任何词条行（Static First）；
 *   同时更新命中计数 [data-docs-total] 与分类计数 [data-docs-count]。
 *
 * - mode="drawer"（client:visible，挂靠在主区工具栏；按钮 <64rem 显示）
 *   职责：目录抽屉开/关、Esc 关闭、背景滚动锁、焦点管理、aria-expanded。
 */
import { onMounted, ref, watch } from 'vue';
import { filterPatterns, type PatternIndex } from '@/lib/patterns';
import { readViewState } from '@/lib/url';

const props = defineProps<{
  mode: 'filter' | 'drawer';
  patterns?: PatternIndex[];
  initialQ?: string;
  initialCategory?: string | null;
  categories?: Array<{ key: string; name: string; nameZh: string; desc: string }>;
}>();

/* ────────── mode = filter ────────── */
const q = ref(props.initialQ ?? '');
const category = ref<string | null>(props.initialCategory ?? null);

/** 当前分类作用域（?category= 只随整页导航变化，岛内不做分类切换；从 URL 读取以兜底静态托管） */
function currentCategory(): string | null {
  return category.value;
}

function syncUrl(): void {
  const url = new URL(window.location.href);
  const trimmed = q.value.trim();
  if (trimmed) url.searchParams.set('q', trimmed);
  else url.searchParams.delete('q');
  window.history.replaceState(null, '', url);
}

/**
 * 同步「当前分类」的页面状态：侧栏分类头 Active、页头标题 / 说明 / 面包屑 / 分类 tag。
 * 静态托管下 SSR 只能渲染“全部”状态，这里的补正让 ?category= 分享链接在
 * hydration 后与 URL 完全一致（无 JS 时退化为全部索引，符合渐进增强）。
 */
function syncScope(): void {
  const catKey = category.value;

  // 侧栏分类头 / 全部头 Active + aria-current
  document.querySelectorAll<HTMLElement>('[data-docs-cat-head]').forEach((el) => {
    const key = el.getAttribute('data-cat-key') ?? '';
    const active = key === 'all' ? catKey === null : catKey === key;
    el.classList.toggle('is-active', active);
    if (active) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });

  // 页头标题 / 说明 / 面包屑 / 分类 tag
  const meta = catKey === null ? null : (props.categories ?? []).find((c) => c.key === catKey) ?? null;
  const setHidden = (sel: string, hidden: boolean): void => {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) el.hidden = hidden;
  };
  setHidden('[data-docs-head-all]', !!meta);
  setHidden('[data-docs-head-cat]', !meta);
  setHidden('[data-docs-head-crumb]', !meta);
  if (meta) {
    const nameEl = document.querySelector<HTMLElement>('[data-docs-head-name]');
    const zhEl = document.querySelector<HTMLElement>('[data-docs-head-zh]');
    const descEl = document.querySelector<HTMLElement>('[data-docs-head-desc]');
    if (nameEl) nameEl.textContent = meta.name;
    if (zhEl) zhEl.textContent = meta.nameZh;
    if (descEl) descEl.textContent = meta.desc;
  }
  const catTag = document.querySelector<HTMLElement>('[data-docs-cat-tag]');
  if (catTag) {
    catTag.hidden = !meta;
    if (meta) catTag.textContent = `分类：${meta.name}`;
  }

  // 全部视图下的分类 section：客户端缩到当前分类时隐藏其余分组
  document.querySelectorAll<HTMLElement>('[data-docs-section]').forEach((el) => {
    el.hidden = catKey !== null && el.getAttribute('data-docs-section') !== catKey;
  });
  // 右栏本页目录的分类锚点同步
  document.querySelectorAll<HTMLElement>('[data-docs-toc-cat]').forEach((el) => {
    el.hidden = catKey !== null && el.getAttribute('data-docs-toc-cat') !== catKey;
  });
}

/**
 * 视图切换 / 目录链接补写 query 上下文。
 * 静态托管下 SSR 无法预知 search params（Astro SSG），
 * 这里按当前 q / category 重写 href，保证「连续阅读」「图鉴」「索引」与
 * 目录分类链接始终携带可分享的上下文（URL as Shareable State）。
 */
function withParams(path: string, q: string, category: string | null): string {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  const qs = params.toString();
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');
  return `${base}/${path.replace(/^\/+/, '')}${qs ? `?${qs}` : ''}`;
}

function syncLinks(): void {
  const qTrimmed = q.value.trim();
  const catKey = category.value;

  const index = document.querySelector<HTMLAnchorElement>('[data-docs-index-link]');
  if (index) index.href = withParams('docs/', qTrimmed, null);

  const stream = document.querySelector<HTMLAnchorElement>('[data-docs-stream-link]');
  if (stream) stream.href = withParams('docs/stream/', qTrimmed, catKey);

  const gallery = document.querySelector<HTMLAnchorElement>('[data-docs-gallery-link]');
  if (gallery) gallery.href = withParams('', qTrimmed, catKey);

  document.querySelectorAll<HTMLAnchorElement>('[data-docs-cat-head]').forEach((el) => {
    const key = el.getAttribute('data-cat-key') ?? '';
    el.href = withParams('docs/', qTrimmed, key === 'all' ? null : key);
  });
}

function apply(): void {
  if (props.mode !== 'filter') return;
  const patterns = props.patterns;
  if (!patterns) return;

  const matched = filterPatterns(patterns, q.value, currentCategory());
  const slugs = new Set(matched.map((p) => p.slug));

  // 只切 hidden，不让岛重渲染 40 行
  const toggleHidden = (selector: string): void => {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const slug = el.getAttribute('data-slug');
      el.hidden = slug ? !slugs.has(slug) : true;
    });
  };
  toggleHidden('[data-docs-row]');
  toggleHidden('[data-sidebar-pattern]');
  toggleHidden('[data-docs-anchor]');

  // 命中计数（当前分类作用域）
  const total = document.querySelector<HTMLElement>('[data-docs-total]');
  if (total) total.textContent = String(matched.length);

  // 空态
  const empty = document.querySelector<HTMLElement>('[data-docs-empty]');
  if (empty) empty.hidden = matched.length > 0;

  // 分类计数（全局 q 视角，忽略当前 category 参数——导航的双向反馈）
  const qOnly = filterPatterns(patterns, q.value, null);
  document.querySelectorAll<HTMLElement>('[data-docs-count]').forEach((el) => {
    const key = el.getAttribute('data-docs-count');
    el.textContent =
      key === 'all' ? String(qOnly.length) : String(qOnly.filter((p) => p.category === key).length);
  });

  syncScope();
  syncLinks();
  syncUrl();
}

let debounceTimer: number | undefined;
watch(q, () => {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(apply, 150);
});

function clearFilters(): void {
  q.value = '';
  apply();
}

/* ────────── mode = drawer ────────── */
const open = ref(false);

function drawerEl(): HTMLElement | null {
  return document.getElementById('docs-sidebar');
}

function setOpen(next: boolean): void {
  const drawer = drawerEl();
  if (!drawer) return;

  drawer.classList.toggle('is-open', next);
  open.value = next;
  document.body.classList.toggle('docs-drawer-open', next);

  // 焦点管理：打开聚焦关闭按钮（抽屉内第一个可聚焦项），关闭归还触发者
  if (next) {
    const closeBtn = drawer.querySelector<HTMLElement>('[data-docs-drawer-close]');
    (closeBtn ?? document.querySelector<HTMLElement>('[data-docs-drawer-toggle]'))?.focus();
  } else {
    document.querySelector<HTMLElement>('[data-docs-drawer-toggle]')?.focus();
  }
}

function onDocumentClick(event: MouseEvent): void {
  if (!open.value) return;
  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (target.closest('[data-docs-drawer-close]') || target.closest('[data-docs-drawer-scrim]')) {
    setOpen(false);
  }
}

function onDocumentKeydown(event: KeyboardEvent): void {
  const drawer = drawerEl();
  if (!drawer) return;

  if (event.key === 'Escape' && drawer.classList.contains('is-open')) {
    event.preventDefault();
    setOpen(false);
    return;
  }

  // 简易焦点圈：Tab / Shift+Tab 在抽屉内循环
  if (event.key !== 'Tab' || !drawer.classList.contains('is-open')) return;
  const focusables = Array.from(
    drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

onMounted(() => {
  if (props.mode === 'filter' && props.patterns) {
    // 静态托管时 SSR 无法预知 query（Astro SSG）：
    // 以当前 URL 为唯一事实来源重构初始状态（props 仅作兜底），
    // 保证分享链接 / Gallery→Docs 上下文在首帧 hydration 后即正确。
    const state = readViewState(new URL(window.location.href));
    if (state.q) q.value = state.q;
    category.value = state.category;
    apply();
    document
      .querySelector<HTMLElement>('[data-docs-clear]')
      ?.addEventListener('click', clearFilters);
  }

  if (props.mode === 'drawer') {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);

    const mq = window.matchMedia('(min-width: 64rem)');
    const onMqChange = (e: MediaQueryListEvent | MediaQueryList): void => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener?.('change', onMqChange);
  }
});
</script>

<template>
  <!-- filter：目录内筛选输入（客户端 SSR 初始值来自 ?q=） -->
  <div v-if="mode === 'filter'" class="docs-filter">
    <svg
      class="docs-filter__icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
    <input
      v-model="q"
      type="search"
      class="docs-filter__input"
      placeholder="筛选词条（Modal、栅格…）"
      aria-label="筛选文档词条"
      autocomplete="off"
      @keydown.enter.prevent
    />
  </div>

  <!-- drawer：移动端目录开关（<64rem 显示，lg:hidden → 桌面不 hydration） -->
  <button
    v-else
    type="button"
    class="docs-drawer-toggle"
    data-docs-drawer-toggle
    :aria-expanded="open"
    aria-controls="docs-sidebar"
    aria-haspopup="dialog"
    :aria-label="open ? '关闭目录' : '打开目录'"
    @click="setOpen(!open)"
  >
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
    <span>目录</span>
  </button>
</template>

<style scoped>
  .docs-filter {
    position: relative;
  }
  .docs-filter__icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-muted);
    pointer-events: none;
  }
  .docs-filter__input {
    width: 100%;
    height: 2.375rem;
    padding: 0.375rem 0.875rem 0.375rem 2.25rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-control);
    background: var(--color-card);
    color: var(--color-ink);
    font-family: inherit;
    font-size: 0.875rem;
    outline: none;
    transition:
      border-color var(--duration-feedback) var(--ease-feedback),
      box-shadow var(--duration-feedback) var(--ease-feedback);
  }
  .docs-filter__input::placeholder {
    color: color-mix(in srgb, var(--color-muted) 60%, transparent);
  }
  .docs-filter__input:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent);
  }

  .docs-drawer-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    height: 2.25rem;
    padding: 0 0.875rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-pill);
    background: var(--color-card);
    color: var(--color-ink);
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
    transition:
      border-color var(--duration-feedback) var(--ease-feedback),
      color var(--duration-feedback) var(--ease-feedback);
  }
  .docs-drawer-toggle:hover {
    border-color: var(--color-accent);
    color: var(--color-accent-deep);
  }

  /* 桌面（≥64rem）侧栏常驻，抽屉按钮隐藏；display:none → client:visible 岛不 hydration */
  @media (min-width: 64rem) {
    .docs-drawer-toggle {
      display: none;
    }
  }
</style>