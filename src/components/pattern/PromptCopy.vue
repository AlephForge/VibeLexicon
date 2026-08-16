<script setup lang="ts">
/**
 * PromptCopy（Detail / Issue #10）—— client:load 岛。
 *
 * 职责：
 * - 一键复制 AI Prompt 到剪贴板（复用 src/lib/clipboard.ts：优先 navigator.clipboard，
 *   非安全上下文自动回退 execCommand）；
 * - 非阻断反馈：aria-live="polite" 状态行内提示（成功 / 失败都给反馈），不用 Modal；
 * - 真实 <button>，触屏 / 键盘（Enter/Space）均可触发；按钮尺寸依赖 .btn 契约（min-h ≥ 40px）。
 */
import { onUnmounted, ref } from 'vue';
import { copyText } from '@/lib/clipboard';

const props = defineProps<{ prompt: string }>();

type CopyState = 'idle' | 'success' | 'error';
const state = ref<CopyState>('idle');
let timer: number | undefined;

function copy(): void {
  window.clearTimeout(timer);
  copyText(props.prompt).then((ok) => {
    state.value = ok ? 'success' : 'error';
    timer = window.setTimeout(() => {
      state.value = 'idle';
    }, 2000);
  });
}

onUnmounted(() => window.clearTimeout(timer));
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <button
      type="button"
      class="btn btn--primary focus-ring"
      :aria-label="`复制 ${props.prompt.slice(0, 24)}… 到剪贴板`"
      @click="copy"
    >
      <svg
        v-if="state !== 'success'"
        class="h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      <svg
        v-else
        class="h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      复制 Prompt
    </button>

    <span
      role="status"
      aria-live="polite"
      class="min-w-0 text-sm"
      :class="state === 'error' ? 'font-medium text-accent-deep' : 'text-muted-strong'"
    >
      {{
        state === 'success'
          ? '已复制到剪贴板'
          : state === 'error'
            ? '复制失败，请直接选择文本复制'
            : ''
      }}
    </span>
  </div>
</template>