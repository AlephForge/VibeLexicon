<script setup lang="ts">
/**
 * Full Demo — Accordion（手风琴）
 *
 * 行为要求（PRD §12 / §18）：
 * - Trigger（button）与 Panel（region）通过 aria-expanded /
 *   aria-controls / aria-labelledby 正确关联；
 * - 手风琴模式：同一时间只展开一项，点击已展开项可收起；
 * - 键盘 / 触屏可操作：原生 Enter / Space 切换；↑↓ Home End 在触发项间移动；
 * - 展开内容为真实 FAQ 文案；
 * - 面板收起时置 inert + aria-hidden，避免屏幕阅读器读到隐藏内容；
 * - Reset 恢复到初始状态（第一项展开）。
 */
import { ref, useId, watch } from 'vue';

const props = withDefaults(
  defineProps<{ viewport?: 'desktop' | 'mobile'; resetSignal?: number }>(),
  { viewport: 'desktop', resetSignal: 0 },
);

const uid = useId();

const ITEMS = [
  {
    q: '什么是响应式布局？',
    a: '根据视口宽度调整列数、字号与间距，让内容在手机、平板与桌面都能清晰可读。核心是断点（Breakpoint）与相对单位，而不是把整张页面简单等比缩放。',
  },
  {
    q: '为什么需要断点？',
    a: '断点定义布局在哪些宽度下切换形态。常见做法是从 Mobile First 出发，以小屏样式作为基线，再通过 min-width 断点逐步增强桌面体验。',
  },
  {
    q: '适合哪些项目？',
    a: '凡是内容会出现在多种设备尺寸的项目都适合，例如文档站、电商列表与后台系统。如果产品只面向单一宽屏，可以先不做响应式，避免过度工程。',
  },
  {
    q: '手风琴与普通列表有什么区别？',
    a: '手风琴默认收起长内容，让页面更紧凑；普通列表则利于快速扫描。需要对比多条平级内容时优先考虑普通列表，内容层级较深、按需展开时更适合手风琴。',
  },
];

const items = ITEMS.map((item, i) => ({
  ...item,
  id: String(i),
  triggerId: `${uid}-trigger-${i}`,
  panelId: `${uid}-panel-${i}`,
}));

/** 当前展开项：-1 = 全部收起；初始展开第一项（与 mini 视觉一致） */
const openIndex = ref(0);
const triggerRefs = ref<Array<HTMLButtonElement | null>>([]);

/** 生成按索引写入触发项 ref 的回调（避免模板内联回调产生隐式 any） */
function createTriggerRef(i: number) {
  return (el: HTMLButtonElement | null) => {
    triggerRefs.value[i] = el;
  };
}

function toggle(i: number) {
  openIndex.value = openIndex.value === i ? -1 : i;
}

/** ↑↓ Home End 在触发项之间移动焦点（不改变展开状态） */
function onTriggerKeydown(event: KeyboardEvent, i: number) {
  const target = event.target as HTMLElement | null;
  if (!target || !target.closest('[role="button"], button')) return;
  let next: number | null = null;
  if (event.key === 'ArrowDown') next = (i + 1) % items.length;
  else if (event.key === 'ArrowUp') next = (i - 1 + items.length) % items.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = items.length - 1;
  if (next === null) return;
  event.preventDefault();
  triggerRefs.value[next]?.focus();
}

function handleReset() {
  openIndex.value = 0;
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
</script>

<template>
  <div class="w-full">
    <div class="overflow-hidden rounded-card border border-line bg-canvas p-4 sm:p-5">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold text-ink">常见问题 · FAQ</h3>
        <span class="tag">Accordion</span>
      </div>

      <div class="mt-3 flex flex-col gap-1.5">
        <div
          v-for="(item, i) in items"
          :key="item.id"
          class="rounded-control bg-card shadow-card transition-colors"
          :class="openIndex === i ? 'border border-line' : 'border border-border'"
        >
          <h4 class="m-0">
            <button
              :id="item.triggerId"
              :ref="createTriggerRef(i)"
              type="button"
              class="flex w-full items-center justify-between gap-3 rounded-control px-3 py-2 text-left"
              :aria-expanded="openIndex === i"
              :aria-controls="item.panelId"
              @click="toggle(i)"
              @keydown="onTriggerKeydown($event, i)"
            >
              <span class="text-[11px] font-medium text-ink sm:text-xs">{{ item.q }}</span>
              <span
                class="shrink-0 text-[10px]"
                :class="openIndex === i ? 'text-accent' : 'text-muted'"
                aria-hidden="true"
              >
                {{ openIndex === i ? '−' : '＋' }}
              </span>
            </button>
          </h4>
          <div
            :id="item.panelId"
            role="region"
            :aria-labelledby="item.triggerId"
            :inert="openIndex !== i"
            :aria-hidden="openIndex === i ? undefined : 'true'"
            class="accordion-panel grid"
            :style="{ gridTemplateRows: openIndex === i ? '1fr' : '0fr' }"
          >
            <div class="min-h-0 overflow-hidden">
              <p class="border-t border-border px-3 pb-3 pt-2 text-[10px] leading-relaxed text-muted">
                {{ item.a }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p class="mt-3 text-[11px] text-muted">
        键盘：Enter / 空格展开收起 · ↑ ↓ 在触发项间移动
      </p>
    </div>
  </div>
</template>

<style scoped>
.accordion-panel {
  transition: grid-template-rows var(--duration-feedback) var(--ease-feedback);
}
</style>