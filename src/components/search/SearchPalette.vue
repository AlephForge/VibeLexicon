<script setup lang="ts">
/**
 * 全站 Command Palette（Issue #13 / Search Agent K）—— 服务器端全局搜索入口。
 *
 * 结构（Warm Editorial Token，参考 demos/command-palette/mini.astro）：
 *   顶部搜索输入行 + 结果列表（roving + aria-activedescendant）+ 底部键盘提示行
 *
 * 行为：
 * - 触发：全局 Cmd/Ctrl+K（target 非 input/textarea/contentEditable 时）+
 *   所有 [data-search-trigger] 按钮点击（事件委托，含 Header 桌面/移动按钮）
 * - 打开：顶部居中面板（桌面）/ 靠近顶部全宽（移动）；role=dialog aria-modal
 * - 搜索：searchAll（Pagefind 优先、本地 JSON 索引兜底），160ms 防抖
 * - 键盘：↑↓ 选择、Enter 打开、Esc 关闭；打开聚焦输入框、关闭焦点归还
 * - 动画：210ms（--duration-modal），reduced-motion 由 global.css 全局降级
 *
 * 性能：
 * - island client:visible 挂载；Pagefind 通过运行时动态 import 懒加载（首次打开才触发）
 * - 根元素保留 1px 固定锚点：Astro 的 client:visible 通过 IntersectionObserver 观察
 *   island 子元素，固定锚点始终在视口内 → 首屏后立即水合，Cmd/Ctrl+K 立即可用，
 *   同时 Pagefind 脚本仍保持按需加载。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { CATEGORIES } from '@/lib/categories';
import { searchAll, type SearchDoc, type SearchHit } from '@/lib/search';

const props = defineProps<{
  /** 构建期投影的本地索引（BaseLayout 传入，fallback 与 slug 校验用） */
  patterns: SearchDoc[];
}>();

// ── 状态 ──
const open = ref(false);
const closing = ref(false);
const isOpen = ref(false); // 两阶段开合：控制 enter/exit 过渡
const query = ref('');
const hits = ref<SearchHit[]>([]);
const active = ref(0);
const status = ref<'idle' | 'searching' | 'ready'>('idle');
const degraded = ref(false);

const inputEl = ref<HTMLInputElement | null>(null);
const listEl = ref<HTMLUListElement | null>(null);

let debounceTimer: number | undefined;
let restoreTarget: HTMLElement | null = null;

const CLOSE_ANIMATION_MS = 200;
const SEARCH_DEBOUNCE_MS = 160;
const LISTBOX_ID = 'palette-listbox';

const itemId = (index: number): string => `palette-option-${index}`;

const categoryName = (key: string | null): string | null => {
  if (!key) return null;
  return CATEGORIES.find((c) => c.key === key)?.nameZh ?? key;
};

const listVisible = computed(
  () => status.value === 'ready' && hits.value.length > 0,
);

const activeDescendant = computed(() =>
  listVisible.value ? itemId(active.value) : undefined,
);

// ── 搜索（160ms 防抖，与 GalleryFilters 同模式） ──
function scheduleSearch(): void {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    void runSearch(query.value);
  }, SEARCH_DEBOUNCE_MS);
}

async function runSearch(term: string): Promise<void> {
  status.value = 'searching';
  const outcome = await searchAll(term, props.patterns);
  hits.value = outcome.hits;
  degraded.value = outcome.degraded;
  active.value = 0;
  status.value = 'ready';
}

// ── 打开 / 关闭 ──
async function openPalette(): Promise<void> {
  if (open.value || closing.value) return;
  restoreTarget =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  open.value = true;
  closing.value = false;
  document.body.classList.add('palette-open');

  await nextTick();
  requestAnimationFrame(() => {
    isOpen.value = true;
  });
  inputEl.value?.focus();
  void runSearch(query.value);
}

function closePalette(): void {
  if (!open.value || closing.value) return;
  closing.value = true;
  isOpen.value = false;
  window.clearTimeout(debounceTimer);

  // 等待 exit 动画结束后卸载并归还焦点
  window.setTimeout(() => {
    open.value = false;
    closing.value = false;
    document.body.classList.remove('palette-open');
    restoreTarget?.focus();
    restoreTarget = null;
  }, CLOSE_ANIMATION_MS);
}

// ── 全局监听 ──
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function onGlobalKeydown(event: KeyboardEvent): void {
  // Esc 关闭（input 编辑态也需生效）
  if (event.key === 'Escape' && open.value) {
    event.preventDefault();
    closePalette();
    return;
  }

  // Cmd/Ctrl+K：编辑态不劫持
  if (!(event.metaKey || event.ctrlKey)) return;
  if (event.altKey || event.shiftKey) return;
  if (event.key.toLowerCase() !== 'k') return;
  if (isEditableTarget(event.target)) return;

  event.preventDefault();
  if (open.value) closePalette();
  else void openPalette();
}

function onDocumentClick(event: MouseEvent): void {
  // [data-search-trigger]：Header 桌面/移动搜索按钮（island 未挂载时点击无害）
  const trigger = (event.target as HTMLElement | null)?.closest('[data-search-trigger]');
  if (!trigger) return;
  event.preventDefault();
  void openPalette();
}

// ── 面板键盘（focus 常驻输入框：roving + aria-activedescendant） ──
function onPanelKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
      if (hits.value.length === 0) return;
      event.preventDefault();
      active.value = (active.value + 1) % hits.value.length;
      scrollActiveIntoView();
      break;
    case 'ArrowUp':
      if (hits.value.length === 0) return;
      event.preventDefault();
      active.value = (active.value - 1 + hits.value.length) % hits.value.length;
      scrollActiveIntoView();
      break;
    case 'Home':
      event.preventDefault();
      active.value = 0;
      scrollActiveIntoView();
      break;
    case 'End':
      event.preventDefault();
      active.value = hits.value.length - 1;
      scrollActiveIntoView();
      break;
    case 'Enter':
      event.preventDefault();
      {
        const hit = hits.value[active.value];
        if (hit) openHit(hit);
      }
      break;
    case 'Tab':
      // 焦点陷阱：对话框内仅输入框可聚焦，Tab 不泄漏到页面背景
      event.preventDefault();
      inputEl.value?.focus();
      break;
    default:
      break;
  }
}

function scrollActiveIntoView(): void {
  void nextTick(() => {
    const el = listEl.value?.querySelector<HTMLElement>(`#${itemId(active.value)}`);
    el?.scrollIntoView({ block: 'nearest' });
  });
}

function openHit(hit: SearchHit): void {
  if (!hit?.url) return;
  window.location.assign(hit.url);
}

// ── 生命周期 ──
onMounted(() => {
  document.addEventListener('keydown', onGlobalKeydown);
  document.addEventListener('click', onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onGlobalKeydown);
  document.removeEventListener('click', onDocumentClick);
  window.clearTimeout(debounceTimer);
});
</script>

<template>
  <div class="palette-root">
    <!-- client:visible 水合锚点：1px 固定元素始终在视口内（见文件头注释） -->
    <div class="palette-anchor" aria-hidden="true"></div>

    <div
      v-if="open"
      class="palette-overlay"
      :class="{ 'is-open': isOpen }"
      @mousedown.self="closePalette"
      @keydown="onPanelKeydown"
    >
      <div class="palette" role="dialog" aria-modal="true" aria-label="全局搜索">
        <!-- 顶部输入行 -->
        <div class="palette__input-row">
          <svg
            class="palette__search-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
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
            id="palette-input"
            ref="inputEl"
            v-model="query"
            type="text"
            class="palette__input"
            role="combobox"
            aria-label="全局搜索"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            :aria-expanded="listVisible"
            aria-controls="palette-listbox"
            :aria-activedescendant="activeDescendant"
            autocomplete="off"
            spellcheck="false"
            placeholder="搜索模式、页面与命令…（drawer / 抽屉）"
            @input="scheduleSearch"
          />
          <kbd class="palette__kbd" aria-hidden="true">ESC</kbd>
        </div>

        <!-- 结果 / 状态区 -->
        <ul
          v-if="listVisible"
          id="palette-listbox"
          ref="listEl"
          class="palette__results"
          role="listbox"
          aria-label="搜索结果"
        >
          <li
            v-for="(hit, index) in hits"
            :id="itemId(index)"
            :key="hit.url"
            class="palette__option"
            :class="{ 'is-active': index === active }"
            role="option"
            :aria-selected="index === active"
            @click="openHit(hit)"
            @mouseenter="active = index"
          >
            <span class="palette__option-head">
              <span class="palette__option-title">
                {{ hit.title }}
                <span v-if="hit.titleZh" class="palette__option-zh">{{ hit.titleZh }}</span>
              </span>
              <span v-if="hit.category" class="tag">{{ categoryName(hit.category) }}</span>
            </span>
            <span class="palette__option-excerpt" v-html="hit.excerpt"></span>
          </li>
        </ul>

        <div v-else-if="status === 'ready'" class="palette__status" role="status">
          未找到匹配的模式
        </div>
        <div v-else-if="status === 'searching'" class="palette__status" role="status">
          搜索中…
        </div>
        <div v-else class="palette__status">输入中文或英文关键词开始搜索</div>

        <!-- 底部键盘提示行 -->
        <div class="palette__footer">
          <span class="palette__hint">
            <kbd aria-hidden="true">↑</kbd>
            <kbd aria-hidden="true">↓</kbd>
            选择
          </span>
          <span class="palette__hint"><kbd aria-hidden="true">Enter</kbd> 打开</span>
          <span class="palette__hint"><kbd aria-hidden="true">Esc</kbd> 关闭</span>
          <span
            v-if="degraded"
            class="palette__source"
            title="Pagefind 索引不可用，已切换本地索引"
          >
            本地索引
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.palette-root {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 80;
}

/* client:visible 水合锚点（始终在视口内，见文件头注释） */
.palette-anchor {
  position: fixed;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: min(14vh, 7rem) 1rem 1rem;
  background: color-mix(in srgb, var(--color-dark-bg) 42%, transparent);
  opacity: 0;
  transition: opacity var(--duration-modal) var(--ease-feedback);
}
.palette-overlay.is-open {
  opacity: 1;
}

/* 顶部居中面板（桌面）/ 靠近顶部全宽（移动） */
.palette {
  display: flex;
  flex-direction: column;
  width: min(38rem, 100%);
  max-height: min(70vh, 40rem);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-panel);
  background: var(--color-card);
  box-shadow: 0 24px 60px -16px rgba(44, 37, 32, 0.38);
  overflow: hidden;
  transform: translateY(-10px) scale(0.985);
  opacity: 0;
  transition:
    transform var(--duration-modal) var(--ease-feedback),
    opacity var(--duration-modal) var(--ease-feedback);
}
.palette-overlay.is-open .palette {
  transform: translateY(0) scale(1);
  opacity: 1;
}

/* ── 顶部输入行 ── */
.palette__input-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--color-border);
}
.palette__search-icon {
  flex-shrink: 0;
  color: var(--color-accent-deep);
}
.palette__input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.4;
  color: var(--color-ink);
}
.palette__input::placeholder {
  color: var(--color-muted);
  opacity: 0.7;
}
.palette__kbd {
  flex-shrink: 0;
  padding: 0.125rem 0.375rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-tag);
  background: var(--color-tag-bg);
  color: var(--color-muted);
  font-family: var(--font-sans);
  font-size: 0.75rem;
  line-height: 1.2;
}

/* ── 结果列表 ── */
.palette__results {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0.5rem;
  overflow-y: auto;
  list-style: none;
}
.palette__option {
  display: grid;
  gap: 0.25rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-control);
  color: var(--color-ink);
  cursor: pointer;
  transition: background-color var(--duration-feedback) var(--ease-feedback);
}
.palette__option.is-active {
  background: var(--color-accent-soft);
}
.palette__option-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}
.palette__option-title {
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.3;
}
.palette__option-zh {
  margin-left: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--color-muted);
}
.palette__option-excerpt {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--color-muted);
}
.palette__option-excerpt :deep(mark) {
  background: transparent;
  color: var(--color-accent-deep);
  font-weight: 600;
}

/* ── 状态区（空态 / 搜索中 / 引导） ── */
.palette__status {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-muted);
}

/* ── 底部键盘提示行 ── */
.palette__footer {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-muted);
}
.palette__hint {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.palette__hint kbd {
  padding: 0.125rem 0.375rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-tag);
  background: var(--color-card);
  color: var(--color-muted);
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  line-height: 1.2;
}
.palette__source {
  margin-left: auto;
  color: var(--color-accent-deep);
  font-weight: 500;
}
</style>