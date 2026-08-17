<!--
Bento Grid · Full Interactive Demo
教学要点（PRD §11 / 12.3）：
- 不同面积模块建立主次层级：1 大（2×3 单位）+ 2 中（各 2 单位）+ 2 小（各 1 单位），
  不是平均九宫格；Desktop 6 列网格，col-span / row-span 控制面积。
- 窄屏降级为单列顺序堆叠，大模块优先展示（DOM 顺序：大卡片在前）。
- 内容为真实中文：本周亮点 / 浏览趋势 / 快捷操作 / 公告 / 今日访问。
- 无内部状态，纯展示 + hover 内部反馈；接受 resetSignal prop（无状态，忽略即可）。
-->
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  viewport: 'desktop' | 'mobile';
  resetSignal: number;
}>();

const isMobile = computed(() => props.viewport === 'mobile');

/** Desktop 6 列网格；Mobile 单列（span 归零，避免 implicit column 破坏单列堆叠） */
const gridClass = computed(() =>
  isMobile.value ? 'grid-cols-1 gap-3' : 'grid-cols-6 gap-3 sm:gap-4',
);

function spanCls(moduleKey: 'hero' | 'chart' | 'quick' | 'note' | 'stat') {
  if (isMobile.value) return '';
  switch (moduleKey) {
    case 'hero':
      return 'col-span-3 row-span-2';
    case 'chart':
      return 'col-span-2';
    case 'quick':
      return 'col-span-2';
    case 'note':
      return 'col-span-1';
    case 'stat':
      return 'col-span-1';
  }
}

/** 浏览趋势：近 7 天，周六最高（暖色 Token 渐变，无图表库） */
const trend = [
  { day: '一', pct: 42 },
  { day: '二', pct: 60 },
  { day: '三', pct: 50 },
  { day: '四', pct: 74 },
  { day: '五', pct: 58 },
  { day: '六', pct: 92 },
  { day: '日', pct: 66 },
];
</script>

<template>
  <div class="w-full overflow-hidden rounded-card border border-line bg-canvas">
    <!-- 头部 -->
    <div class="px-4 pb-3 pt-4 sm:px-6">
      <p class="section-label">Bento Grid</p>
      <h3 class="text-lg font-bold text-ink font-serif">便当盒布局</h3>
      <p class="mt-1 text-xs leading-relaxed text-muted">
        不同面积建立主次层级：1 大 + 2 中 + 2 小；窄屏降为单列，大模块优先展示。
      </p>
    </div>

    <div class="px-4 pb-4 sm:px-6 sm:pb-6">
      <div class="grid" :class="gridClass">
        <!-- 大模块：本周亮点（2×3 单位，左上主位） -->
        <section :class="[spanCls('hero'), 'card-surface flex min-h-[11rem] flex-col rounded-control p-4']">
          <span class="tag self-start bg-accent-soft text-accent-deep">本周亮点</span>
          <h4 class="mt-2 font-serif text-lg font-bold text-ink sm:text-xl">
            六列网格里的主次叙事
          </h4>
          <p class="mt-1 text-xs leading-relaxed text-muted">
            大区块为整屏定调，中小区块负责补充数据、动作与公告，各归其位。
          </p>
          <ul class="mt-3 flex flex-col gap-2">
            <li class="flex items-start gap-2 text-xs text-ink">
              <span aria-hidden="true" class="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent"></span>
              布局对比 · 便当盒 vs 普通网格（本周新增 3 篇）
            </li>
            <li class="flex items-start gap-2 text-xs text-ink">
              <span aria-hidden="true" class="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-secondary"></span>
              性能 · 纯 CSS Grid，零运行时依赖
            </li>
            <li class="flex items-start gap-2 text-xs text-ink">
              <span aria-hidden="true" class="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-soft"></span>
              内容 · 大卡片内容不折损，窄屏保持顺序
            </li>
          </ul>
        </section>

        <!-- 中模块：浏览趋势（2 单位宽） -->
        <section :class="[spanCls('chart'), 'card-surface flex flex-col rounded-control p-3']">
          <p class="text-xs font-semibold text-ink">浏览趋势</p>
          <div
            class="mt-2 flex h-20 items-end gap-1 sm:h-24"
            role="img"
            aria-label="近 7 天访问量，星期六最高"
          >
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
        </section>

        <!-- 中模块：快捷操作（2 单位宽） -->
        <section :class="[spanCls('quick'), 'card-surface flex flex-col gap-2 rounded-control p-3']">
          <p class="text-xs font-semibold text-ink">快捷操作</p>
          <button type="button" class="btn btn--ghost w-full rounded-control px-3 py-2 text-xs">
            ＋ 新建词条
          </button>
          <button type="button" class="btn btn--ghost w-full rounded-control px-3 py-2 text-xs">
            ☆ 加入收藏
          </button>
          <button type="button" class="btn btn--ghost w-full rounded-control px-3 py-2 text-xs">
            ↓ 导出卡片
          </button>
        </section>

        <!-- 小模块：公告（1 单位宽） -->
        <section :class="[spanCls('note'), 'card-surface flex flex-col rounded-control p-3']">
          <p class="text-xs font-semibold text-ink">公告</p>
          <p class="mt-1 text-xs leading-relaxed text-muted">
            8 月视觉收件箱已更新 12 个新 Pattern。
          </p>
          <span class="tag mt-auto w-fit pt-0.5">08-17</span>
        </section>

        <!-- 小模块：今日访问（1 单位宽） -->
        <section :class="[spanCls('stat'), 'card-surface flex flex-col rounded-control p-3']">
          <p class="text-xs text-muted">今日访问</p>
          <p class="mt-0.5 font-serif text-2xl font-bold text-ink">2,847</p>
          <p class="text-[10px] font-medium text-accent-deep">较昨日 +18%</p>
        </section>
      </div>
    </div>
  </div>
</template>