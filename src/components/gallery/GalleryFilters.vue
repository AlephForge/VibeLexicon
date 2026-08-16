<script setup lang="ts">
/**
 * Gallery 过滤岛（W3 / Issue #7）—— 页面上唯一的 Vue island（client:idle）。
 *
 * 职责（URL as Shareable State）：
 * - q 输入（150ms 防抖）实时过滤；
 * - 分类 Chips 点击切换；
 * - history.replaceState 同步 `?q=` / `?category=`（「全部」移除 category 参数）；
 * - 服务端渲染的 40 张卡片在这里只做 DOM hidden 属性切换（不重渲染、不引入 store）；
 * - 空态提示（未找到匹配的模式 + 清除筛选按钮）。
 *
 * 过滤逻辑与服务端共用同一纯函数 filterPatterns，保证 SSR / CSR 结果一致。
 */
import { onMounted, ref, watch } from 'vue';
import { filterPatterns, type PatternIndex } from '@/lib/patterns';
import { readViewState } from '@/lib/url';
import { CATEGORIES } from '@/lib/categories';

const props = defineProps<{
  patterns: PatternIndex[];
  initialQ: string;
  initialCategory: string | null;
}>();

const q = ref(props.initialQ);
const category = ref<string | null>(props.initialCategory);

const count = ref(
  filterPatterns(props.patterns, props.initialQ, props.initialCategory).length,
);

type Chip = { key: string | null; label: string };
const chips: Chip[] = [
  { key: null, label: '全部' },
  ...CATEGORIES.map((c) => ({ key: c.key as string, label: c.nameZh })),
];

function syncUrl(): void {
  const url = new URL(window.location.href);
  const trimmed = q.value.trim();
  if (trimmed) url.searchParams.set('q', trimmed);
  else url.searchParams.delete('q');
  if (category.value) url.searchParams.set('category', category.value);
  else url.searchParams.delete('category');
  window.history.replaceState(null, '', url);
}

function apply(): void {
  const matched = filterPatterns(props.patterns, q.value, category.value);
  const matchedSlugs = new Set(matched.map((p) => p.slug));
  count.value = matchedSlugs.size;

  // 只切换 DOM hidden，不重渲染卡片（Static First / 性能约束）
  document.querySelectorAll<HTMLElement>('[data-pattern-card]').forEach((el) => {
    const slug = el.getAttribute('data-slug');
    el.hidden = slug ? !matchedSlugs.has(slug) : true;
  });

  const empty = document.querySelector<HTMLElement>('[data-gallery-empty]');
  if (empty) empty.hidden = matchedSlugs.size > 0;

  syncUrl();
}

let debounceTimer: number | undefined;
watch(q, () => {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(apply, 150);
});

function selectChip(key: string | null): void {
  category.value = key;
  apply();
}

function clearFilters(): void {
  q.value = '';
  category.value = null;
  apply();
}

onMounted(() => {
  // 初始同步：以「真实 URL」为准（静态部署下 SSR 无法感知 query，
  // props.initialQ/initialCategory 仅是构建时快照，Deep Link 场景必须在客户端对齐）。
  const state = readViewState(new URL(window.location.href));
  q.value = state.q;
  category.value = state.category;
  apply();
  document
    .querySelector<HTMLElement>('[data-gallery-clear]')
    ?.addEventListener('click', clearFilters);
});
</script>

<template>
  <div id="gallery-filters" class="flex w-full flex-col gap-3">
    <!-- 搜索框：真实 input，点击即聚焦；输入实时过滤 + replaceState 同步 ?q= -->
    <div class="relative w-full">
      <svg
        class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        v-model="q"
        type="search"
        role="searchbox"
        class="h-12 w-full rounded-full border border-line bg-card pl-11 pr-16 text-base text-ink shadow-sm outline-none transition-colors duration-feedback ease-feedback placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20 [&::-webkit-search-cancel-button]:appearance-none sm:h-13"
        placeholder="搜索图鉴（如：Card、导航、Modal…）"
        aria-label="搜索图鉴"
        autocomplete="off"
        @keydown.enter.prevent
      />
      <kbd
        aria-hidden="true"
        class="absolute right-4 top-1/2 -translate-y-1/2 select-none rounded-tag border border-line bg-tag-bg px-1.5 py-0.5 font-sans text-xs text-muted"
      >⌘K</kbd>
    </div>

    <div class="flex items-center gap-3">
      <!-- 分类 Chips：真实 button，横向滚动（.scrollbar-hide），触控目标 ≥ 40px -->
      <div class="flex gap-2 overflow-x-auto scrollbar-hide py-1" role="group" aria-label="按分类筛选">
        <button
          v-for="chip in chips"
          :key="chip.key ?? 'all'"
          type="button"
          class="chip min-h-10 shrink-0"
          :class="(category ?? null) === chip.key ? 'chip--active' : 'chip--default'"
          :aria-pressed="(category ?? null) === chip.key"
          @click="selectChip(chip.key)"
        >
          {{ chip.label }}
        </button>
      </div>
      <!-- 命中计数：a11y 时用 aria-live 播报过滤结果变化 -->
      <p
        class="ml-auto hidden shrink-0 text-xs tabular-nums text-muted sm:block"
        aria-live="polite"
      >
        命中 {{ count }} / {{ props.patterns.length }}
      </p>
    </div>
  </div>
</template>