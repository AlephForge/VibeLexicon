<script setup lang="ts">
/**
 * Full Demo — Lightbox（图片灯箱）
 *
 * 行为要求（PRD §12 / §18）：
 * - 缩略图入口（4 张内联 SVG 色块）→ 点击打开大图；
 * - 遮罩 + 大图 + 关闭按钮；多图前后切换（左右箭头 + 键盘 ← →）；
 * - Esc 关闭；打开时焦点移入大图区、关闭后归还触发缩略图；
 * - 打开时背景滚动锁；
 * - 当前图索引指示（dots + "n / 4" 计数，aria-live 播报）。
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useFocusTrap, useScrollLock } from '../_shared/useFocusTrap';

const props = withDefaults(
  defineProps<{ viewport?: 'desktop' | 'mobile'; resetSignal?: number }>(),
  { viewport: 'desktop', resetSignal: 0 },
);

const IMAGES = [
  {
    name: '暖阳',
    tone: '#ecd4c4',
    circle: { color: '#b67252', x: 32, y: 30, r: 17 },
    barColor: '#fbf8f2',
    bars: [
      { x: 16, y: 62, w: 70 },
      { x: 16, y: 72, w: 46 },
    ],
  },
  {
    name: '墨绿',
    tone: '#dde3d3',
    circle: { color: '#7c876d', x: 88, y: 24, r: 13 },
    barColor: '#fbf8f2',
    bars: [
      { x: 16, y: 52, w: 88 },
      { x: 16, y: 64, w: 60 },
      { x: 16, y: 76, w: 74 },
    ],
  },
  {
    name: '纸张',
    tone: '#f2ece5',
    circle: { color: '#c78b67', x: 60, y: 34, r: 21 },
    barColor: '#fbf8f2',
    bars: [
      { x: 20, y: 68, w: 56 },
      { x: 72, y: 68, w: 30 },
      { x: 20, y: 78, w: 80 },
    ],
  },
  {
    name: '暮蓝',
    tone: '#dfe4ea',
    circle: { color: '#5f6f8c', x: 26, y: 58, r: 15 },
    barColor: '#fbf8f2',
    bars: [
      { x: 16, y: 26, w: 60 },
      { x: 16, y: 38, w: 76 },
      { x: 16, y: 76, w: 48 },
    ],
  },
];

const open = ref(false);
const currentIndex = ref(0);
const overlayRef = ref<HTMLElement | null>(null);
const frameRef = ref<HTMLElement | null>(null);
const current = () => IMAGES[currentIndex.value];

useFocusTrap(overlayRef, open, {
  onClose: closeLightbox,
  initialFocus: () => frameRef.value,
});
useScrollLock(open);

function openAt(i: number) {
  currentIndex.value = i;
  open.value = true;
}

function closeLightbox() {
  open.value = false;
}

function goTo(i: number) {
  currentIndex.value = (i + IMAGES.length) % IMAGES.length;
}

function prev() {
  goTo(currentIndex.value - 1);
}

function next() {
  goTo(currentIndex.value + 1);
}

function handleReset() {
  currentIndex.value = 0;
  closeLightbox();
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (!open.value) return;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    prev();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    next();
  }
}

onMounted(() => document.addEventListener('keydown', onDocumentKeydown));
onBeforeUnmount(() => document.removeEventListener('keydown', onDocumentKeydown));

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
        <div>
          <p class="text-sm font-semibold text-ink">画廊 · 秋日暖色</p>
          <p class="mt-1 text-xs text-muted">点击任意缩略图进入大图浏览</p>
        </div>
        <span class="tag">Lightbox</span>
      </div>

      <div class="mt-4 grid grid-cols-4 gap-2">
        <button
          v-for="(im, i) in IMAGES"
          :key="im.name"
          type="button"
          class="group aspect-[4/3] overflow-hidden rounded-control border border-line bg-card p-1 transition-colors hover:border-accent"
          :aria-label="`打开第 ${i + 1} 张：${im.name}`"
          @click="openAt(i)"
        >
          <svg viewBox="0 0 120 90" class="h-full w-full" role="img" :aria-label="`缩略图：${im.name}`">
            <rect width="120" height="90" :fill="im.tone"></rect>
            <circle :cx="im.circle.x" :cy="im.circle.y" :r="im.circle.r" :fill="im.circle.color"></circle>
            <rect
              v-for="(b, j) in im.bars"
              :key="j"
              :x="b.x"
              :y="b.y"
              :width="b.w"
              height="6"
              rx="3"
              :fill="im.barColor"
            ></rect>
          </svg>
        </button>
      </div>

      <p class="mt-3 text-[11px] text-muted">
        键盘：← → 切换图片 · Esc 关闭 · 打开时背景滚动锁定
      </p>
    </div>

    <Teleport to="body">
      <Transition name="lightbox">
        <div
          v-if="open"
          ref="overlayRef"
          role="dialog"
          aria-modal="true"
          aria-label="图片灯箱"
          class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-ink/70"
            aria-hidden="true"
            @click="closeLightbox"
          ></div>

          <div class="lightbox-content relative z-10 flex max-w-2xl flex-col items-center">
            <figure
              ref="frameRef"
              tabindex="-1"
              class="w-full rounded-control bg-card p-2 shadow-card"
            >
              <div class="overflow-hidden rounded-control bg-tag-bg">
                <svg
                  viewBox="0 0 120 90"
                  class="h-auto w-full"
                  role="img"
                  :aria-label="`${current().name} —— 第 ${currentIndex + 1} 张，共 ${IMAGES.length} 张`"
                >
                  <rect width="120" height="90" :fill="current().tone"></rect>
                  <circle
                    :cx="current().circle.x"
                    :cy="current().circle.y"
                    :r="current().circle.r"
                    :fill="current().circle.color"
                  ></circle>
                  <rect
                    v-for="(b, j) in current().bars"
                    :key="j"
                    :x="b.x"
                    :y="b.y"
                    :width="b.w"
                    height="6"
                    rx="3"
                    :fill="current().barColor"
                  ></rect>
                </svg>
              </div>
              <figcaption class="flex items-center justify-between gap-3 px-2 pb-1 pt-2">
                <span class="text-sm font-medium text-ink">{{ current().name }}</span>
                <span class="tag" aria-live="polite">{{ currentIndex + 1 }} / {{ IMAGES.length }}</span>
              </figcaption>
            </figure>

            <div class="mt-4 flex items-center gap-3">
              <button type="button" class="btn btn--ghost" @click="prev">‹ 上一张</button>
              <button type="button" class="btn btn--ghost" @click="next">下一张 ›</button>
            </div>

            <div class="mt-3 flex items-center gap-2" role="group" aria-label="选择图片">
              <button
                v-for="(im, i) in IMAGES"
                :key="im.name"
                type="button"
                class="h-2.5 w-2.5 rounded-full transition-colors"
                :class="
                  i === currentIndex
                    ? 'bg-accent'
                    : 'border border-line bg-card hover:bg-accent-soft'
                "
                :aria-label="`查看第 ${i + 1} 张：${im.name}`"
                :aria-current="i === currentIndex ? 'true' : undefined"
                @click="goTo(i)"
              ></button>
            </div>
          </div>

          <button
            type="button"
            class="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-card text-xl text-ink shadow-card transition-colors hover:text-accent-deep"
            aria-label="关闭灯箱"
            @click="closeLightbox"
          >
            ×
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity var(--duration-modal) var(--ease-feedback);
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
.lightbox-enter-active .lightbox-content,
.lightbox-leave-active .lightbox-content {
  transition: transform var(--duration-modal) var(--ease-feedback);
}
.lightbox-enter-from .lightbox-content,
.lightbox-leave-to .lightbox-content {
  transform: translateY(8px) scale(0.98);
}
</style>