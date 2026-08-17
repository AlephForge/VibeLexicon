<!--
Hero Section · Full Interactive Demo
教学要点（PRD §11 / 12.3）：
- 价值主张 + 一句话说明 + 主要行动入口（h1 层级标题、唯一主 CTA）。
- Desktop 图文双栏；Mobile 结构变化：标题缩小、按钮堆叠、右侧视觉图隐藏。
- 背景装饰只用 Token 暖色渐变 + 衬线字形水印，禁紫蓝渐变。
- 无外部资源；交互以 hover/focus 反馈为主（预览内轻动效）。
- resetSignal 无内部状态可复位的（纯展示），接受但不依赖。
-->
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  viewport: 'desktop' | 'mobile';
  resetSignal: number;
}>();

const isMobile = computed(() => props.viewport === 'mobile');

/** Mobile：标题缩小、单列、按钮堆叠、隐藏右侧视觉图 */
const titleClass = computed(() =>
  isMobile.value
    ? 'text-3xl leading-tight'
    : 'text-4xl leading-[1.15] lg:text-5xl',
);
const layoutClass = computed(() =>
  isMobile.value ? 'grid-cols-1 gap-4' : 'grid-cols-[1.15fr_0.85fr] items-center gap-8',
);
const actionsClass = computed(() =>
  isMobile.value ? 'flex-col' : 'flex-row',
);
const visualClass = computed(() => (isMobile.value ? 'hidden' : 'block'));
</script>

<template>
  <div class="w-full overflow-hidden rounded-card border border-line bg-canvas">
    <section class="relative overflow-hidden px-5 py-9 sm:px-8 sm:py-12">
      <!-- 背景装饰：Token 暖色径向渐变 + 衬线字形水印（纯装饰，aria-hidden） -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 select-none"
        :style="
          'background: radial-gradient(circle at 12% 18%, rgba(236,212,196,0.55) 0%, transparent 46%), radial-gradient(circle at 88% 90%, rgba(232,224,211,0.65) 0%, transparent 52%);'
        "
      ></div>
      <span
        v-if="!isMobile"
        aria-hidden="true"
        class="pointer-events-none absolute -top-10 right-4 select-none font-serif text-[10rem] leading-none text-accent-soft/50"
        >V</span
      >

      <div class="relative grid" :class="layoutClass">
        <!-- 文案 + 行动入口 -->
        <div>
          <span class="tag self-start bg-accent-soft text-accent-deep"
            >交互式视觉词典 · 40 个 Pattern</span
          >
          <h2 class="mt-4 font-serif font-bold tracking-tight text-ink" :class="titleClass">
            把 UI 术语，<br />变成看得见的灵感
          </h2>
          <p class="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            浏览布局、页面结构与界面组件的真实示例，用可交互 Demo 代替纯文字解释。
          </p>
          <div class="mt-6 flex gap-2.5 sm:gap-3" :class="actionsClass">
            <button type="button" class="btn btn--primary flex-1 sm:flex-none">开始浏览</button>
            <button type="button" class="btn btn--ghost flex-1 sm:flex-none">了解更多</button>
          </div>
          <p class="mt-4 text-xs text-muted">无需安装 · 全静态页面 · 键盘可操作</p>
        </div>

        <!-- Desktop 右栏：产品预览图（装饰性，真相隐藏于内联 SVG / 色块） -->
        <div :class="visualClass" aria-hidden="true">
          <div class="relative ml-auto h-56 max-w-xs">
            <div class="card-surface absolute left-0 top-0 w-52 rounded-control p-3">
              <span class="tag">卡片式布局</span>
              <div
                class="mt-2 h-16 rounded-md"
                :style="'background: linear-gradient(135deg, var(--color-accent-soft), var(--color-tag-bg));'"
              ></div>
              <div class="mt-2 h-1.5 w-3/4 rounded-full bg-line"></div>
              <div class="mt-1.5 h-1.5 w-1/2 rounded-full bg-line"></div>
            </div>
            <div class="card-surface absolute bottom-0 right-0 w-48 rounded-control p-3">
              <span class="tag bg-accent-soft text-accent-deep">Tabs · 键盘可用</span>
              <div class="mt-2 flex gap-1 border-b border-line pb-1.5">
                <span class="rounded-sm bg-accent px-1.5 py-0.5 text-[10px] text-card">概览</span>
                <span class="px-1.5 py-0.5 text-[10px] text-muted">分析</span>
              </div>
              <div class="mt-2 h-6 rounded-md bg-tag-bg"></div>
            </div>
            <span class="absolute right-2 top-0 inline-flex h-3 w-3 rounded-full bg-secondary"></span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>