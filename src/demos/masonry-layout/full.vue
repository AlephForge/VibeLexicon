<!--
Masonry Layout · Full Interactive Demo
教学要点（PRD §11 / 12.3）：
- 宽度相近、高度自然错落 —— 绝不裁切成等高。
- 8–10 条不同高度的内容块（图片区 aspect 各异 + 文字长度各异）。
- 加分项：模式切换「瀑布流 / 等高网格」对照，演示等高回退的裁切问题。
优先纯 CSS（CSS multi-column），与新块进入最短列的思路一致。
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  viewport: 'desktop' | 'mobile';
  resetSignal: number;
}>();

const isMobile = computed(() => props.viewport === 'mobile');
type Mode = 'masonry' | 'grid';
const mode = ref<Mode>('masonry');

/** 内容块：图片区用不同 aspect 建立高度差；部分条目以文字为主再加大差异 */
const items = [
  {
    title: '灵感板',
    summary: '收集形状各异的灵感图钉，天然适合让高度自由生长。',
    tags: ['灵感'],
    aspect: 'aspect-[4/3]',
    gradient: 'linear-gradient(135deg, #ecd4c4, #f2ece5)',
    glyph: '◧',
  },
  {
    title: '照片墙',
    summary: '按列堆叠后，白边与留白自然形成透气感，底部不出现大空洞。',
    tags: ['媒体'],
    aspect: 'aspect-square',
    gradient: 'linear-gradient(135deg, #e3e8d9, #f2ece5)',
    glyph: '▦',
  },
  {
    title: '双列阅读流',
    summary: '长文卡片与短图卡片交错出现，扫读时仍然保持节奏。',
    tags: ['内容流'],
    aspect: 'aspect-[3/4]',
    gradient: 'linear-gradient(135deg, #f2e3d5, #ecd4c4)',
    glyph: '▭',
  },
  {
    title: '三列相册',
    summary: '宽度统一之后，视觉重心交给高度；横向沟槽固定，纵向往下流动。',
    tags: ['相册'],
    aspect: 'aspect-[16/10]',
    gradient: 'linear-gradient(135deg, #e8e0d3, #f2ece5)',
    glyph: '◫',
  },
  {
    title: '榜单收藏',
    summary: '每条目的说明长度不一，瀑布流让主要信息自然占满空隙。',
    tags: ['收藏'],
    aspect: 'aspect-[1/1.4]',
    gradient: 'linear-gradient(135deg, #e3e8d9, #e8e0d3)',
    glyph: '▯',
  },
  {
    title: '轻量笔记',
    summary: '只有文字的条目也可以参与错落：短句与长段落交替即可。',
    tags: ['笔记'],
    aspect: 'aspect-[4/5]',
    gradient: 'linear-gradient(135deg, #f2ece5, #ecd4c4)',
    glyph: '▰',
  },
  {
    title: '商品瀑布',
    summary: '商品图第一眼决定高度，详情折进卡片内部，列底自然对齐。',
    tags: ['电商'],
    aspect: 'aspect-[16/9]',
    gradient: 'linear-gradient(135deg, #eaf0e3, #e3e8d9)',
    glyph: '◱',
  },
  {
    title: '图注：保持可读',
    summary: '每张图下方固定保留一行说明，读屏顺序与视觉流动保持一致，不做脚本重排。',
    tags: ['可访问性'],
    aspect: 'aspect-[4/3]',
    gradient: 'linear-gradient(135deg, #ecd4c4, #e3e8d9)',
    glyph: '◲',
  },
  {
    title: '竖向海报',
    summary: '适合展示比例细长的封面：占满一列的高度，但不超出列宽。',
    tags: ['海报'],
    aspect: 'aspect-[3/5]',
    gradient: 'linear-gradient(135deg, #f2e3d5, #e8e0d3)',
    glyph: '▤',
  },
  {
    title: '高度留白处扩展',
    summary: '当列底出现空隙，新内容进入当前最短的列，让底部始终紧凑。',
    tags: ['堆叠'],
    aspect: 'aspect-square',
    gradient: 'linear-gradient(135deg, #e8e0d3, #e3e8d9)',
    glyph: '◭',
  },
];

/** 瀑布流：CSS 多列；等高网格：grid + auto-rows-fr（形象展示裁切陷阱） */
const masonryClass = computed(() =>
  isMobile.value ? 'columns-2 gap-x-3' : 'columns-3 gap-x-4',
);
const gridClass = computed(() =>
  isMobile.value ? 'grid-cols-2 gap-3 auto-rows-fr' : 'grid-cols-3 gap-4 auto-rows-fr',
);

function imgWrapClass(item: (typeof items)[number]) {
  return mode.value === 'masonry' ? item.aspect : 'h-20 sm:h-24';
}

watch(
  () => props.resetSignal,
  () => {
    mode.value = 'masonry';
  },
);
</script>

<template>
  <div class="w-full overflow-hidden rounded-card border border-line bg-canvas">
    <!-- 头部 + 模式切换（瀑布流 / 等高网格对照） -->
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pb-3 pt-4 sm:px-6">
      <div>
        <p class="section-label">Masonry Layout</p>
        <h3 class="text-lg font-bold text-ink font-serif">瀑布流</h3>
      </div>
      <div class="flex items-center gap-1.5" role="group" aria-label="布局模式">
        <span class="mr-0.5 text-xs text-muted">模式</span>
        <button
          type="button"
          class="chip"
          :class="{ 'chip--active': mode === 'masonry' }"
          :aria-pressed="mode === 'masonry'"
          @click="mode = 'masonry'"
        >
          瀑布流
        </button>
        <button
          type="button"
          class="chip"
          :class="{ 'chip--active': mode === 'grid' }"
          :aria-pressed="mode === 'grid'"
          @click="mode = 'grid'"
        >
          等高网格（对比）
        </button>
      </div>
    </div>
    <p class="px-4 pb-3 text-xs leading-relaxed text-muted sm:px-6">
      宽度相近、高度自然错落 —— 内容块绝不裁切成等高。试试切到「等高网格」看会发生什么。
    </p>

    <div class="px-4 pb-4 sm:px-6 sm:pb-6">
      <!-- 瀑布流：CSS 多列 -->
      <div v-if="mode === 'masonry'" :class="masonryClass">
        <article
          v-for="item in items"
          :key="item.title"
          class="mb-4 break-inside-avoid rounded-card border border-border bg-card p-3"
        >
          <div class="overflow-hidden rounded-control" :class="imgWrapClass(item)">
            <div class="relative h-full w-full" :style="{ background: item.gradient }">
              <span
                aria-hidden="true"
                class="absolute inset-0 flex items-center justify-center text-3xl text-accent-deep/40"
                >{{ item.glyph }}</span
              >
            </div>
          </div>
          <h4 class="mt-2.5 text-sm font-semibold text-ink">{{ item.title }}</h4>
          <p class="mt-1 text-xs leading-relaxed text-muted">{{ item.summary }}</p>
          <div class="mt-2 flex flex-wrap gap-1">
            <span v-for="t in item.tags" :key="t" class="tag">{{ t }}</span>
          </div>
        </article>
      </div>

      <!-- 等高网格：对照说明（展示「不要做」的回退） -->
      <div v-else class="grid" :class="gridClass">
        <article
          v-for="item in items"
          :key="item.title"
          class="flex flex-col overflow-hidden rounded-card border border-border bg-card p-3"
        >
          <div class="overflow-hidden rounded-control" :class="imgWrapClass(item)">
            <div class="relative h-full w-full" :style="{ background: item.gradient }">
              <span
                aria-hidden="true"
                class="absolute inset-0 flex items-center justify-center text-3xl text-accent-deep/40"
                >{{ item.glyph }}</span
              >
            </div>
          </div>
          <h4 class="mt-2.5 text-sm font-semibold text-ink">{{ item.title }}</h4>
          <p class="mt-1 text-xs leading-relaxed text-muted">{{ item.summary }}</p>
          <div class="mt-2 flex flex-wrap gap-1">
            <span v-for="t in item.tags" :key="t" class="tag">{{ t }}</span>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>