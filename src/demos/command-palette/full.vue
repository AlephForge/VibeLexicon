<script setup lang="ts">
/**
 * Full Demo — Command Palette（命令面板）
 *
 * 行为要求（PRD §12 / §18）：
 * - Ctrl+K / ⌘K 打开；输入框内直接编辑时不劫持按键（仅当
 *   `(ctrl||meta) && key==='k'` 且 target 不是 input/textarea/contentEditable）；
 * - 面板内输入即时过滤；结果按分类分组；
 * - ↑↓ / Home / End 选择（roving highlight，aria-activedescendant），
 *   Enter 执行 = 跳转对应 Pattern 详情页（真实链接），Esc 关闭；
 * - 无匹配时展示空态「无匹配结果」；
 * - 焦点进入输入框、关闭归还；背景滚动锁；打开动画约 180ms。
 */
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { useFocusTrap, useScrollLock } from '../_shared/useFocusTrap';

const props = withDefaults(
  defineProps<{ viewport?: 'desktop' | 'mobile'; resetSignal?: number }>(),
  { viewport: 'desktop', resetSignal: 0 },
);

const CATEGORY_ZH: Record<string, { label: string; short: string }> = {
  layout: { label: '页面布局', short: '布局' },
  'page-structure': { label: '页面结构', short: '结构' },
  navigation: { label: '导航与切换', short: '导航' },
  components: { label: '常用组件', short: '组件' },
};

interface Command {
  key: string;
  nameEn: string;
  nameZh: string;
  category: string;
}

const COMMANDS: Command[] = [
  { key: 'modal', nameEn: 'Modal', nameZh: '模态框', category: 'components' },
  { key: 'drawer', nameEn: 'Drawer', nameZh: '抽屉', category: 'components' },
  { key: 'accordion', nameEn: 'Accordion', nameZh: '手风琴', category: 'components' },
  { key: 'lightbox', nameEn: 'Lightbox', nameZh: '图片灯箱', category: 'components' },
  { key: 'command-palette', nameEn: 'Command Palette', nameZh: '命令面板', category: 'components' },
  { key: 'card-based-layout', nameEn: 'Card-based Layout', nameZh: '卡片式布局', category: 'layout' },
  { key: 'masonry-layout', nameEn: 'Masonry Layout', nameZh: '瀑布流', category: 'layout' },
  { key: 'bento-grid', nameEn: 'Bento Grid', nameZh: '便当盒布局', category: 'layout' },
  { key: 'hero-section', nameEn: 'Hero Section', nameZh: '首屏', category: 'page-structure' },
  { key: 'faq-section', nameEn: 'FAQ Section', nameZh: '常见问题区', category: 'page-structure' },
  { key: 'tabs', nameEn: 'Tabs', nameZh: '标签页', category: 'navigation' },
  { key: 'breadcrumb', nameEn: 'Breadcrumb', nameZh: '面包屑', category: 'navigation' },
  { key: 'mega-menu', nameEn: 'Mega Menu', nameZh: '巨型菜单', category: 'navigation' },
];

const open = ref(false);
const query = ref('');
const activeIndex = ref(0);
const uid = useId();
const panelRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const listId = `${uid}-list`;

useFocusTrap(panelRef, open, {
  onClose: closePalette,
  initialFocus: () => inputRef.value,
});
useScrollLock(open);

const filtered = computed<Command[]>(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return COMMANDS;
  return COMMANDS.filter((c) =>
    `${c.nameZh}${c.nameEn}${CATEGORY_ZH[c.category]?.label ?? ''}`
      .toLowerCase()
      .includes(q),
  );
});

interface Group {
  category: string;
  label: string;
  short: string;
  items: Command[];
}

const groups = computed<Group[]>(() => {
  const order = Object.keys(CATEGORY_ZH);
  return order
    .map((cat) => ({
      category: cat,
      label: CATEGORY_ZH[cat]!.label,
      short: CATEGORY_ZH[cat]!.short,
      items: filtered.value.filter((c) => c.category === cat),
    }))
    .filter((g) => g.items.length > 0);
});

/** 平铺后的可见结果（activeIndex 基于它） */
const flat = computed<Command[]>(() => groups.value.flatMap((g) => g.items));

watch(filtered, () => {
  activeIndex.value = flat.value.length > 0 ? 0 : -1;
});

watch(activeIndex, (idx) => {
  if (!open.value || idx < 0) return;
  document.getElementById(optionId(flat.value[idx]!))?.scrollIntoView({
    block: 'nearest',
  });
});

function optionId(cmd: Command): string {
  return `${uid}-option-${cmd.key}`;
}

function activeOptionId(): string | undefined {
  const item = flat.value[activeIndex.value];
  return item ? optionId(item) : undefined;
}

function hrefFor(key: string): string {
  // 通过 baseURI 推导站点 base（GH Pages /VibeLexicon/ 等），不依赖 import.meta.env 类型
  return new URL(`patterns/${key}/`, document.baseURI).href;
}

function openPalette() {
  query.value = '';
  activeIndex.value = 0;
  open.value = true;
}

function closePalette() {
  open.value = false;
}

/** Enter 执行：点击当前高亮选项对应的真实链接，跳转 Pattern 详情页 */
function execute(cmd: Command) {
  document.getElementById(optionId(cmd))?.click();
}

/** 面板内键盘：↑↓ Home End 选择，Enter 执行（Esc 由 focus trap 处理） */
function onPanelKeydown(event: KeyboardEvent) {
  if (!open.value) return;
  const list = flat.value;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (list.length) activeIndex.value = (activeIndex.value + 1) % list.length;
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (list.length) activeIndex.value = (activeIndex.value - 1 + list.length) % list.length;
  } else if (event.key === 'Home') {
    event.preventDefault();
    activeIndex.value = 0;
  } else if (event.key === 'End') {
    event.preventDefault();
    if (list.length) activeIndex.value = list.length - 1;
  } else if (event.key === 'Enter') {
    const item = list[activeIndex.value];
    if (item) {
      event.preventDefault();
      execute(item);
    }
  }
}

/** Ctrl+K / ⌘K 全局快捷键：目标为可编辑元素时不劫持 */
function onGlobalKeydown(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
  const target = event.target as HTMLElement | null;
  const editable =
    target &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
  if (editable) return;
  event.preventDefault();
  if (open.value) {
    inputRef.value?.focus();
    query.value = '';
  } else {
    openPalette();
  }
}

function handleReset() {
  query.value = '';
  activeIndex.value = 0;
  closePalette();
}

const lastSignal = ref(props.resetSignal);
watch(
  () => props.resetSignal,
  (v) => {
    if (!Object.is(v, lastSignal.value)) {
      lastSignal.value = v;
      handleReset();
    }
  },
);

onMounted(() => document.addEventListener('keydown', onGlobalKeydown));
onBeforeUnmount(() => document.removeEventListener('keydown', onGlobalKeydown));
</script>

<template>
  <div class="w-full">
    <div class="overflow-hidden rounded-card border border-line bg-canvas p-4 sm:p-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-ink">导航命令</p>
        <span class="tag">Command Palette</span>
      </div>
      <p class="mt-1 text-xs leading-relaxed text-muted">
        按 Ctrl+K / ⌘K 打开命令面板：输入过滤、↑↓ 选择、Enter 跳转到对应
        Pattern 详情页。
      </p>

      <button
        ref="triggerRef"
        type="button"
        class="mt-4 flex w-full items-center gap-2 rounded-control border border-line bg-card px-3 py-2.5 text-left transition-colors hover:border-accent"
        @click="openPalette"
      >
        <span class="text-sm text-muted">⌕</span>
        <span class="flex-1 text-sm text-muted">搜索模式、页面与命令…</span>
        <kbd
          class="hidden rounded border border-line bg-tag-bg px-1.5 py-0.5 font-sans text-[10px] text-muted sm:inline"
        >
          Ctrl K
        </kbd>
      </button>

      <p class="mt-3 text-[11px] text-muted">
        键盘：Ctrl+K / ⌘K 打开 · ↑↓ 选择 · Enter 执行 · Esc 关闭
      </p>
    </div>

    <Teleport to="body">
      <Transition name="palette">
        <div v-if="open" class="fixed inset-0 z-[60]">
          <div
            class="absolute inset-0 bg-ink/40"
            aria-hidden="true"
            @click="closePalette"
          ></div>
          <div
            ref="panelRef"
            role="dialog"
            aria-modal="true"
            aria-label="命令面板"
            :class="[
              'palette-panel relative z-10 mx-auto flex flex-col overflow-hidden rounded-control bg-card shadow-card',
              viewport === 'mobile' ? 'top-3 w-[calc(100%-1.5rem)]' : 'top-[14vh] w-[min(34rem,88vw)]',
            ]"
            @keydown="onPanelKeydown"
          >
            <div class="palette-input-row flex items-center gap-2 border-b border-border px-4 py-3">
              <span class="text-sm text-muted">⌕</span>
              <input
                ref="inputRef"
                v-model="query"
                type="text"
                role="combobox"
                aria-expanded="true"
                :aria-controls="listId"
                :aria-activedescendant="activeOptionId()"
                placeholder="搜索模式、页面与命令…"
                class="w-full flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
                autocomplete="off"
              />
              <kbd
                class="rounded border border-line bg-tag-bg px-1.5 py-0.5 font-sans text-[10px] text-muted"
              >
                ESC
              </kbd>
            </div>

            <div
              :id="listId"
              role="listbox"
              aria-label="搜索结果"
              class="max-h-[40vh] overflow-y-auto p-1.5"
            >
              <template v-if="flat.length">
                <div
                  v-for="g in groups"
                  :key="g.category"
                  role="group"
                  :aria-label="g.label"
                >
                  <p
                    class="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-muted"
                  >
                    {{ g.label }}
                  </p>
                  <a
                    v-for="item in g.items"
                    :key="item.key"
                    :id="optionId(item)"
                    role="option"
                    :href="hrefFor(item.key)"
                    :aria-selected="item === flat[activeIndex]"
                    class="flex items-center gap-2 rounded-control px-2.5 py-1.5 text-sm no-underline"
                    :class="
                      item === flat[activeIndex]
                        ? 'bg-accent-soft text-ink'
                        : 'text-ink hover:bg-tag-bg'
                    "
                    @click="closePalette"
                  >
                    <span class="truncate">{{ item.nameZh }}</span>
                    <span class="truncate text-xs text-muted">{{ item.nameEn }}</span>
                    <span class="tag ml-auto shrink-0">{{ g.short }}</span>
                  </a>
                </div>
              </template>
              <p v-else class="px-3 py-6 text-center text-sm text-muted">无匹配结果</p>
            </div>

            <footer
              class="flex items-center gap-3 border-t border-border px-4 py-2 text-[10px] text-muted"
            >
              <span>↑↓ 选择</span>
              <span>Enter 打开</span>
              <span>Esc 关闭</span>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.palette-enter-active,
.palette-leave-active {
  transition: opacity var(--duration-feedback) var(--ease-feedback);
}
.palette-enter-from,
.palette-leave-to {
  opacity: 0;
}
.palette-enter-active .palette-panel,
.palette-leave-active .palette-panel {
  transition: transform var(--duration-feedback) var(--ease-feedback);
}
.palette-enter-from .palette-panel,
.palette-leave-to .palette-panel {
  transform: translateY(-8px);
}

/* 输入行 focus 可见指示（QA Agent L / Issue #14）：input 自身 outline-none，用
   :focus-within 在输入行上给出可见焦点环 */
.palette-input-row:focus-within {
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--color-accent) 45%, transparent);
}
</style>