<!--
Tabs · Full Interactive Demo（a11y 重点）
教学要点（PRD §11 / 12.3 + MDX prompt）：
- 完整 tablist / tab / tabpanel 语义，aria-selected / aria-controls / aria-labelledby。
- Roving tabindex（仅焦点标签在 Tab 序中），← / → 移动焦点、Home / End 跳首尾，
  Enter / Space 激活（manual activation，内容不会随焦点自动切换）。
- Active 状态用下划线 + 颜色区分，不依赖动画；面板切换动画 ≤180ms，
  遵循 prefers-reduced-motion（全局动画降级会将其变为瞬时）。
- 隐藏面板用 v-if 卸载，避免残留可聚焦元素。
- 方向假设 LTR（zh-CN）：若要支持 RTL，需交换 ArrowLeft / ArrowRight 语义。
-->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

const props = defineProps<{
  viewport: 'desktop' | 'mobile';
  resetSignal: number;
}>();

const isMobile = computed(() => props.viewport === 'mobile');

const tabs = [
  { label: '概览' },
  { label: '分析' },
  { label: '设置' },
  { label: '记录' },
] as const;

const active = ref(0);
const focusIndex = ref(0);
const tabEls = ref<(HTMLButtonElement | null)[]>([]);

function tabId(i: number) {
  return `vl-tabs-tab-${i}`;
}
function panelId(i: number) {
  return `vl-tabs-panel-${i}`;
}
function setTabRef(i: number, el: unknown) {
  tabEls.value[i] = (el as HTMLButtonElement | null) ?? null;
}

/** 移动焦点（roving tabindex + 真正聚焦 DOM），不激活内容 */
function moveFocusTo(i: number) {
  focusIndex.value = i;
  nextTick(() => tabEls.value[i]?.focus());
}

/** 激活标签：切换面板内容 */
function selectTab(i: number) {
  active.value = i;
  focusIndex.value = i;
}

function onTablistKeydown(e: KeyboardEvent) {
  const total = tabs.length;
  let target = -1;
  switch (e.key) {
    case 'ArrowRight':
      target = (focusIndex.value + 1) % total;
      break;
    case 'ArrowLeft':
      target = (focusIndex.value - 1 + total) % total;
      break;
    case 'Home':
      target = 0;
      break;
    case 'End':
      target = total - 1;
      break;
    default:
      return;
  }
  e.preventDefault();
  moveFocusTo(target);
}

/* 分析面板数据 */
const trend = [
  { day: '一', pct: 42 },
  { day: '二', pct: 60 },
  { day: '三', pct: 50 },
  { day: '四', pct: 74 },
  { day: '五', pct: 58 },
  { day: '六', pct: 92 },
  { day: '日', pct: 66 },
];

/* 设置面板状态（组件级 ref 持久化，切换标签不丢失） */
const notifyOn = ref(true);
const autoCollect = ref(false);
const compactMode = ref(true);

watch(
  () => props.resetSignal,
  () => {
    active.value = 0;
    focusIndex.value = 0;
    notifyOn.value = true;
    autoCollect.value = false;
    compactMode.value = true;
  },
);

const statGrid = computed(() =>
  isMobile.value ? 'grid-cols-1 gap-2.5' : 'grid-cols-3 gap-3',
);
</script>

<template>
  <div class="flex w-full flex-col overflow-hidden rounded-card border border-line bg-canvas">
    <!-- 头部 -->
    <div class="px-4 pb-2 pt-4 sm:px-6">
      <p class="section-label">Tabs · WAI-ARIA APG</p>
      <h3 class="text-lg font-bold text-ink font-serif">标签切换</h3>
    </div>

    <!-- tablist -->
    <div
      role="tablist"
      aria-label="内容视图切换"
      class="mt-2 border-b border-line px-4 sm:px-6"
      @keydown="onTablistKeydown"
    >
      <div class="scrollbar-hide -mb-px flex gap-1 overflow-x-auto">
        <button
          v-for="(t, i) in tabs"
          :id="tabId(i)"
          :key="t.label"
          type="button"
          role="tab"
          :aria-selected="active === i"
          :aria-controls="panelId(i)"
          :tabindex="focusIndex === i ? 0 : -1"
          :ref="(el) => setTabRef(i, el)"
          class="-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-200 sm:px-4"
          :class="
            active === i
              ? 'border-accent text-ink'
              : 'border-transparent text-muted hover:text-ink'
          "
          @click="selectTab(i)"
          @keydown.enter.prevent="selectTab(i)"
          @keydown.space.prevent="selectTab(i)"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- tabpanel：每次仅渲染激活面板（v-if 卸载隐藏面板，不残留可聚焦元素） -->
    <div class="flex-1 p-4 sm:p-6">
      <template v-for="(t, i) in tabs" :key="t.label">
        <section
          v-if="active === i"
          :id="panelId(i)"
          role="tabpanel"
          tabindex="0"
          :aria-labelledby="tabId(i)"
          class="tab-panel-in"
        >
          <!-- ── 概览 ── -->
          <template v-if="i === 0">
            <h4 class="font-serif text-base font-bold text-ink">本周概览</h4>
            <div class="mt-3 grid" :class="statGrid">
              <div class="card-surface rounded-control p-3">
                <p class="text-xs text-muted">词条总数</p>
                <p class="mt-0.5 font-serif text-2xl font-bold text-ink">40</p>
              </div>
              <div class="card-surface rounded-control p-3">
                <p class="text-xs text-muted">本周新增</p>
                <p class="mt-0.5 font-serif text-2xl font-bold text-accent-deep">12</p>
              </div>
              <div class="card-surface rounded-control p-3">
                <p class="text-xs text-muted">收藏词条</p>
                <p class="mt-0.5 font-serif text-2xl font-bold text-ink">26</p>
              </div>
            </div>
            <p class="mt-3 text-xs leading-relaxed text-muted">
              概览汇总当前词条库的规模与本周进展。同一块内容区域，随着标签切换而更换视图。
            </p>
          </template>

          <!-- ── 分析 ── -->
          <template v-else-if="i === 1">
            <h4 class="font-serif text-base font-bold text-ink">近 7 天访问趋势</h4>
            <div
              class="card-surface mt-3 rounded-control p-3"
              role="img"
              aria-label="近 7 天访问量柱状图，星期六最高"
            >
              <div class="flex h-24 items-end gap-1.5">
                <div
                  v-for="d in trend"
                  :key="d.day"
                  class="flex-1 rounded-md"
                  :style="{
                    height: d.pct + '%',
                    background: d.pct === 92 ? 'var(--color-accent)' : 'var(--color-tag-bg)',
                  }"
                ></div>
              </div>
              <div class="mt-1.5 flex justify-between text-[10px] text-muted">
                <span v-for="d in trend" :key="d.day">{{ d.day }}</span>
              </div>
            </div>
            <p class="mt-3 text-xs leading-relaxed text-muted">
              用纯 CSS 柱状图演示数据视图，无需图表库；周六访问量最高（周二与周五波动）。
            </p>
          </template>

          <!-- ── 设置 ── -->
          <template v-else-if="i === 2">
            <h4 class="font-serif text-base font-bold text-ink">偏好设置</h4>
            <div class="mt-3 flex flex-col gap-2">
              <label class="flex cursor-pointer items-center justify-between gap-3 rounded-control border border-border bg-card p-3">
                <span class="text-sm text-ink">通知提醒</span>
                <span
                  class="vl-switch relative inline-flex h-5 w-9 shrink-0 items-center rounded-pill transition-colors duration-200"
                  :class="notifyOn ? 'bg-accent' : 'bg-line'"
                >
                  <input v-model="notifyOn" type="checkbox" class="sr-only" />
                  <span
                    aria-hidden="true"
                    class="pointer-events-none absolute left-0.5 inline-block h-4 w-4 rounded-full bg-card shadow-sm transition-transform duration-200"
                    :class="notifyOn ? 'translate-x-4' : 'translate-x-0'"
                  ></span>
                </span>
              </label>
              <label class="flex cursor-pointer items-center justify-between gap-3 rounded-control border border-border bg-card p-3">
                <span class="text-sm text-ink">自动收藏</span>
                <span
                  class="vl-switch relative inline-flex h-5 w-9 shrink-0 items-center rounded-pill transition-colors duration-200"
                  :class="autoCollect ? 'bg-accent' : 'bg-line'"
                >
                  <input v-model="autoCollect" type="checkbox" class="sr-only" />
                  <span
                    aria-hidden="true"
                    class="pointer-events-none absolute left-0.5 inline-block h-4 w-4 rounded-full bg-card shadow-sm transition-transform duration-200"
                    :class="autoCollect ? 'translate-x-4' : 'translate-x-0'"
                  ></span>
                </span>
              </label>
              <label class="flex cursor-pointer items-center justify-between gap-3 rounded-control border border-border bg-card p-3">
                <span class="text-sm text-ink">紧凑模式</span>
                <span
                  class="vl-switch relative inline-flex h-5 w-9 shrink-0 items-center rounded-pill transition-colors duration-200"
                  :class="compactMode ? 'bg-accent' : 'bg-line'"
                >
                  <input v-model="compactMode" type="checkbox" class="sr-only" />
                  <span
                    aria-hidden="true"
                    class="pointer-events-none absolute left-0.5 inline-block h-4 w-4 rounded-full bg-card shadow-sm transition-transform duration-200"
                    :class="compactMode ? 'translate-x-4' : 'translate-x-0'"
                  ></span>
                </span>
              </label>
            </div>
            <p class="mt-3 text-xs leading-relaxed text-muted">
              状态保存在组件内，切换标签后会保留；每个开关都可键盘操作（Tab 聚焦 + 空格切换）。
            </p>
          </template>

          <!-- ── 记录 ── -->
          <template v-else>
            <h4 class="font-serif text-base font-bold text-ink">最近浏览</h4>
            <ol class="mt-3 flex flex-col gap-2">
              <li class="card-surface flex items-center justify-between gap-3 rounded-control p-3">
                <span class="text-xs text-ink">查看了 Tabs 的 ARIA 实现笔记</span>
                <time class="shrink-0 text-[11px] text-muted">09:40</time>
              </li>
              <li class="card-surface flex items-center justify-between gap-3 rounded-control p-3">
                <span class="text-xs text-ink">收藏了 Bento Grid 响应式示例</span>
                <time class="shrink-0 text-[11px] text-muted">08:15</time>
              </li>
              <li class="card-surface flex items-center justify-between gap-3 rounded-control p-3">
                <span class="text-xs text-ink">对比了 Modal 与 Drawer 的使用场景</span>
                <time class="shrink-0 text-[11px] text-muted">昨天</time>
              </li>
            </ol>
            <p class="mt-3 text-xs leading-relaxed text-muted">
              记录面板展示按时间排序的浏览历史，时间戳使用语义化 <code>time</code> 元素。
            </p>
          </template>
        </section>
      </template>
    </div>

    <p class="px-4 pb-4 text-[11px] leading-relaxed text-muted sm:px-6">
      键盘提示：← / → 移动焦点 · Home / End 跳转首尾 · Enter / Space 激活当前标签
    </p>
  </div>
</template>

<style scoped>
@keyframes vlTabPanelIn {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.tab-panel-in {
  animation: vlTabPanelIn var(--duration-feedback) var(--ease-feedback);
}

/* 自定义开关的键盘 Focus 环：input 是 sr-only，聚焦时给轨道描边 */
.vl-switch:has(input:focus-visible) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>