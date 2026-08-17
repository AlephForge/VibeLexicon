<script setup lang="ts">
/**
 * Full Demo — Modal（模态框）
 *
 * 焦点管理（AGENTS.md §8 / PRD §18）：
 * - 打开后焦点移入对话框（首个操作按钮「取消」）；
 * - Tab / Shift+Tab 在对话框内循环（focus trap），背景不可键盘访问；
 * - Esc / 遮罩点击 / 关闭按钮关闭，关闭后焦点归还触发按钮；
 * - 打开时锁定页面滚动。
 *
 * 关闭动画约 210ms（--duration-modal）。覆盖层 Teleport 到 body，
 * 规避 Demo Stage 容器的 overflow / 圆角裁剪。
 */
import { ref, useId, watch } from 'vue';
import { useFocusTrap, useScrollLock } from '../_shared/useFocusTrap';

const props = withDefaults(
  defineProps<{ viewport?: 'desktop' | 'mobile'; resetSignal?: number }>(),
  { viewport: 'desktop', resetSignal: 0 },
);

const open = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const dialogRef = ref<HTMLElement | null>(null);
const cancelRef = ref<HTMLButtonElement | null>(null);
const titleId = useId();
const descId = useId();

useFocusTrap(dialogRef, open, {
  onClose: closeModal,
  initialFocus: () => cancelRef.value,
});
useScrollLock(open);

function openModal() {
  open.value = true;
}

function closeModal() {
  open.value = false;
}

function handleReset() {
  closeModal();
}

/* Demo Stage「Reset」：resetSignal 步进时复位到初始状态 */
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
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-ink">项目 · 秋季新品发布页</p>
          <p class="mt-1 text-xs text-muted">最近编辑于 2 分钟前 · 已归档</p>
        </div>
        <span class="tag">Project</span>
      </div>

      <div class="mt-4 rounded-control border border-line bg-card p-4">
        <p class="text-xs leading-relaxed text-muted">
          点击下方按钮打开确认对话框，体验 Modal 的完整行为：焦点移入、Tab
          焦点圈、Esc 关闭、关闭后焦点归还触发按钮。
        </p>
        <div class="mt-3 flex flex-wrap items-center justify-end gap-2">
          <button ref="triggerRef" type="button" class="btn btn--primary" @click="openModal">
            删除项目
          </button>
        </div>
      </div>

      <p class="mt-3 text-[11px] text-muted">
        键盘：Tab 在弹层内循环 · Esc / 遮罩点击关闭
      </p>
    </div>

    <Teleport to="body">
      <Transition name="overlay">
        <div
          v-if="open"
          class="fixed inset-0 z-[60] p-3 sm:p-4"
        >
          <div
            class="absolute inset-0 bg-ink/50"
            aria-hidden="true"
            @click="closeModal"
          ></div>
          <div
            ref="dialogRef"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="descId"
            tabindex="-1"
            class="overlay-dialog relative z-10 mx-auto mt-[16vh] w-full max-w-sm rounded-control bg-card p-5 shadow-card"
          >
            <div class="flex items-start justify-between gap-4">
              <h3 :id="titleId" class="text-base font-semibold text-ink">确认删除项目？</h3>
              <button
                type="button"
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-tag-bg text-sm text-muted transition-colors hover:text-ink"
                aria-label="关闭对话框"
                @click="closeModal"
              >
                ×
              </button>
            </div>
            <p :id="descId" class="mt-2 text-xs leading-relaxed text-muted">
              此操作不可撤销。项目「秋季新品发布页」及其中的所有预览与内容将从工作区移除。
            </p>
            <div class="mt-5 flex justify-end gap-2">
              <button ref="cancelRef" type="button" class="btn btn--ghost" @click="closeModal">
                取消
              </button>
              <button type="button" class="btn btn--primary" @click="closeModal">
                确认删除
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity var(--duration-modal) var(--ease-feedback);
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
.overlay-enter-active .overlay-dialog,
.overlay-leave-active .overlay-dialog {
  transition: transform var(--duration-modal) var(--ease-feedback);
}
.overlay-enter-from .overlay-dialog,
.overlay-leave-to .overlay-dialog {
  transform: translateY(6px) scale(0.98);
}
</style>