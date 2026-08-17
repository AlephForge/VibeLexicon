<script setup lang="ts">
/**
 * DemoStageControls（Detail / Issue #10）—— client:visible 岛，仅当 Stage 进入视口才激活。
 *
 * 职责：
 * - 管理 viewport（'desktop' | 'mobile'）与 resetSignal（Reset 点击 → +1）；
 * - 把对应 Full Demo 作为子组件响应式渲染（props: viewport / resetSignal）；
 * - Full 组件按需懒加载：demos/<key>/full.vue 只在该页命中时才被动态引入，
 *   不把 40 个 Mini / 其他 Full 拖入首屏（避免 Gallery 全量 Hydrate 的问题）。
 *
 * 说明：
 * - 本岛由 DemoStage.astro 按「hasFull(preview) && fullComponents[preview] 已合入」门槛渲染；
 * - 不 import '@/demos/components'（其包含 40 个 .astro Mini，客户端无法打包），
 *   改为 import.meta.glob 按目录约定懒加载 full.vue —— 全量映射仍由 Registry 与 components.ts 独占。
 */
import { markRaw, onMounted, ref, shallowRef } from 'vue';
import type { Component as VueComponent } from 'vue';

const props = defineProps<{ title: string; titleZh: string; preview: string }>();

const viewport = ref<'desktop' | 'mobile'>('desktop');
const resetSignal = ref(0);
const fullComponent = shallowRef<VueComponent | null>(null);
const status = ref<'loading' | 'ready' | 'error'>('loading');

type FullModulesMap = Record<string, () => Promise<{ default: VueComponent }>>;
const fullModules: FullModulesMap = (
  import.meta as unknown as { glob: (pattern: string) => FullModulesMap }
).glob('@/demos/*/full.vue');

async function resolveFullDemo(): Promise<void> {
  const loaderEntry = Object.entries(fullModules).find(([path]) =>
    path.endsWith(`/demos/${props.preview}/full.vue`),
  );
  if (!loaderEntry) {
    status.value = 'error';
    return;
  }
  try {
    const mod = await loaderEntry[1]();
    fullComponent.value = markRaw(mod.default);
    status.value = 'ready';
  } catch {
    status.value = 'error';
  }
}

onMounted(resolveFullDemo);
</script>

<template>
  <div>
    <header class="demo-stage__header">
      <div class="demo-stage__meta">
        <span class="section-label">Live Demo</span>
        <span class="demo-stage__name">
          {{ props.title }}<span class="demo-stage__name-zh">{{ props.titleZh }}</span>
        </span>
        <span class="tag bg-accent-soft text-accent-deep">完整交互 Demo</span>
      </div>

      <div class="demo-stage__tools">
        <div class="demo-stage__viewport" role="group" aria-label="视口切换">
          <button
            type="button"
            class="chip"
            :class="viewport === 'desktop' ? 'chip--active' : 'chip--default'"
            :aria-pressed="viewport === 'desktop'"
            @click="viewport = 'desktop'"
          >
            桌面
          </button>
          <button
            type="button"
            class="chip"
            :class="viewport === 'mobile' ? 'chip--active' : 'chip--default'"
            :aria-pressed="viewport === 'mobile'"
            @click="viewport = 'mobile'"
          >
            移动
          </button>
        </div>
        <button type="button" class="btn btn--ghost" @click="resetSignal += 1">
          重置
        </button>
      </div>
    </header>

    <div
      class="demo-stage__body"
      :class="{ 'demo-stage__body--mobile': viewport === 'mobile' }"
    >
      <component
        v-if="status === 'ready'"
        :is="fullComponent"
        :viewport="viewport"
        :reset-signal="resetSignal"
      />
      <!-- 懒加载骨架：Full 组件 chunk 未就绪时占位，避免跳动 -->
      <div
        v-else-if="status === 'loading'"
        class="demo-stage__skeleton"
        aria-hidden="true"
      >
        <div class="demo-stage__skeleton-bar" style="width: 38%"></div>
        <div class="demo-stage__skeleton-block"></div>
      </div>
      <div v-else class="demo-stage__fallback" role="note">
        演示组件加载失败，请刷新页面重试。
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 与 DemoStage.astro 共用同一套视觉类（两侧各自声明，避免全局污染） */
.demo-stage__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.625rem 1rem;
  border-bottom: 1px solid var(--color-line);
  padding: 0.75rem 1rem;
}
@media (min-width: 40rem) {
  .demo-stage__header {
    padding-inline: 1.25rem;
  }
}
.demo-stage__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
}
.demo-stage__name {
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-ink);
}
.demo-stage__name-zh {
  margin-left: 0.375rem;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-muted);
}
.demo-stage__tools {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.demo-stage__viewport {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.demo-stage__body {
  padding: 1rem;
}
@media (min-width: 40rem) {
  .demo-stage__body {
    padding: 1.5rem;
  }
}
/* Mobile 视口模拟 ≈ 375px，居中且不产生横向滚动 */
.demo-stage__body--mobile {
  max-width: 23.4375rem;
  margin-inline: auto;
}
.demo-stage__skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  aspect-ratio: 16 / 9;
}
.demo-stage__skeleton-bar {
  height: 0.625rem;
  border-radius: var(--radius-tag);
  background: linear-gradient(90deg, var(--color-tag-bg), var(--color-border), var(--color-tag-bg));
  background-size: 200% 100%;
  animation: demostage-skeleton 1.4s ease-in-out infinite;
}
.demo-stage__skeleton-block {
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-tag-bg);
  opacity: 0.7;
}
.demo-stage__fallback {
  display: flex;
  min-height: 12rem;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-control);
  padding: 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-muted);
}
@keyframes demostage-skeleton {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .demo-stage__skeleton-bar {
    animation: none;
  }
}
</style>