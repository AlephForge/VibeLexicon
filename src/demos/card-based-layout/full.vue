<!--
Card-based Layout · Full Interactive Demo
教学要点（PRD §11 / 12.3）：
- 卡片作为内容容器：图片块 + 标题 + 摘要 + 标签，统一网格轨道。
- Desktop 3 列 / Mobile 1–2 列响应式（由 viewport prop 驱动容器模拟）。
- 加分项：数量切换（3/6/9），同一内容在不同密度下验证列数变化。
视觉语言与 mini.astro 保持一致：bg-canvas 外层 + card-surface 卡片。
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  viewport: 'desktop' | 'mobile';
  resetSignal: number;
}>();

const isMobile = computed(() => props.viewport === 'mobile');

/* 数量切换：3 / 6 / 9 张卡片 */
const counts = [3, 6, 9] as const;
const count = ref<number>(6);

/** 数据集：图片块用 Token 暖色渐变（无外部资源），glyph 为排版字符 */
const cards = [
  {
    title: '统一的容器边界',
    summary: '一致的圆角、留白与细边框，让长短不一的内容获得同一种扫读节奏。',
    tags: ['卡片', '容器'],
    glyph: '◧',
    gradient: 'linear-gradient(135deg, #ecd4c4, #f2ece5)',
  },
  {
    title: '网格轨道对齐',
    summary: '同一频道共享同一套列轨道，列内间距保持固定，标题基线尽量一致。',
    tags: ['网格', '对齐'],
    glyph: '▦',
    gradient: 'linear-gradient(135deg, #e8e0d3, #f2ece5)',
  },
  {
    title: '信息密度平衡',
    summary: '卡片过多会稀释注意力，适度收敛数量，让每一条都值得被看见。',
    tags: ['密度', '扫读'],
    glyph: '▭',
    gradient: 'linear-gradient(135deg, #e3e8d9, #f2ece5)',
  },
  {
    title: '图片按比例预留',
    summary: '缩略图先用 aspect-ratio 占位，加载前后整列不跳动。',
    tags: ['图片', '占位'],
    glyph: '◫',
    gradient: 'linear-gradient(135deg, #f2e3d5, #ecd4c4)',
  },
  {
    title: '悬停只动内部',
    summary: 'hover 时图片轻微放大、标题着色，卡片本身不移动，网格保持稳定。',
    tags: ['反馈', '动效'],
    glyph: '◲',
    gradient: 'linear-gradient(135deg, #f2ece5, #e8e0d3)',
  },
  {
    title: '阴影保持克制',
    summary: '轻阴影建立层级即可，叠加强投影会破坏卡片间的边界。',
    tags: ['阴影', '层级'],
    glyph: '▤',
    gradient: 'linear-gradient(135deg, #e3e8d9, #e8e0d3)',
  },
  {
    title: '窄屏递减列数',
    summary: '手机单列流式阅读、平板两列、桌面三列，同一内容三种密度。',
    tags: ['响应式', '断点'],
    glyph: '▯',
    gradient: 'linear-gradient(135deg, #ecd4c4, #eaf0e3)',
  },
  {
    title: '大卡片可混排',
    summary: '首卡可跨两列放大，但仍停留在同一网格轨道，不另起坐标系。',
    tags: ['混排', '焦点'],
    glyph: '▰',
    gradient: 'linear-gradient(135deg, #e8e0d3, #f2ece5)',
  },
  {
    title: '标签维系分类',
    summary: '同组卡片用标签划分频道，横向扫读依然高效，进频道后再细读。',
    tags: ['标签', '频道'],
    glyph: '◱',
    gradient: 'linear-gradient(135deg, #f2e3d5, #e3e8d9)',
  },
];

const visibleCards = computed(() => cards.slice(0, count.value));

/** Desktop 3 列 / Mobile 1–2 列 —— 跟随 viewport prop，不依赖真实像素断点 */
const gridClass = computed(() =>
  isMobile.value ? 'grid-cols-2 max-[340px]:grid-cols-1' : 'grid-cols-3',
);

watch(
  () => props.resetSignal,
  () => {
    count.value = 6;
  },
);
</script>

<template>
  <div class="w-full overflow-hidden rounded-card border border-line bg-canvas">
    <!-- 头部：名称 + 数量切换（加分交互，验证响应式列数） -->
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pb-3 pt-4 sm:px-6">
      <div>
        <p class="section-label">Card-based Layout</p>
        <h3 class="text-lg font-bold text-ink font-serif">卡片式布局</h3>
      </div>
      <div class="flex items-center gap-1.5" role="group" aria-label="卡片数量">
        <span class="mr-0.5 text-xs text-muted">数量</span>
        <button
          v-for="n in counts"
          :key="n"
          type="button"
          class="chip"
          :class="{ 'chip--active': count === n }"
          :aria-pressed="count === n"
          @click="count = n"
        >
          {{ n }}
        </button>
      </div>
    </div>
    <p class="px-4 pb-3 text-xs leading-relaxed text-muted sm:px-6">
      Desktop 3 列 / Mobile 1–2 列 —— 同一份内容随容器变宽变窄，无需二次排版。
    </p>

    <!-- 卡片网格 -->
    <div class="px-4 pb-4 sm:px-6 sm:pb-6">
      <div class="grid gap-3 sm:gap-4" :class="gridClass">
        <article
          v-for="card in visibleCards"
          :key="card.title"
          class="card-surface group flex flex-col overflow-hidden rounded-control"
        >
          <!-- 图片块：暖色渐变 + 排版字形，hover 内部轻动效 -->
          <div
            class="relative aspect-[16/9] overflow-hidden rounded-t-control"
            :style="{ background: card.gradient }"
          >
            <span
              aria-hidden="true"
              class="absolute inset-0 flex items-center justify-center text-4xl text-accent-deep/40 transition-transform duration-200 ease-out group-hover:scale-110"
              >{{ card.glyph }}</span
            >
          </div>
          <!-- 标题 + 摘要 + 标签 -->
          <div class="flex flex-1 flex-col gap-1.5 p-3">
            <h4 class="text-sm font-semibold text-ink transition-colors duration-200 group-hover:text-accent-deep">
              {{ card.title }}
            </h4>
            <p class="line-clamp-2 text-xs leading-relaxed text-muted">{{ card.summary }}</p>
            <div class="mt-auto flex flex-wrap gap-1 pt-2">
              <span v-for="t in card.tags" :key="t" class="tag">{{ t }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>