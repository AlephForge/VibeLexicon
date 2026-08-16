<script setup lang="ts">
/**
 * Full Demo — Drawer（抽屉）
 *
 * 行为要求（PRD §12 / §18）：
 * - 从右缘滑出面板 + 半透明遮罩（点击遮罩关闭）；
 * - 打开时背景滚动锁（body overflow hidden + 滚动条补偿）；
 * - 焦点移入面板并聚焦圈住（focus trap）；
 * - Esc / 关闭按钮 / 取消 关闭，关闭后焦点归还触发按钮；
 * - aria-modal dialog 语义；
 * - 宽度策略：Desktop 320px，Mobile 80%（max 22rem）；
 * - 动画约 260ms（--duration-drawer）。
 */
import { ref, useId, watch } from 'vue';
import { useFocusTrap, useScrollLock } from '../_shared/useFocusTrap';

const props = withDefaults(
  defineProps<{ viewport?: 'desktop' | 'mobile'; resetSignal?: number }>(),
  { viewport: 'desktop', resetSignal: 0 },
);

const open = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const closeRef = ref<HTMLButtonElement | null>(null);
const titleId = useId();

useFocusTrap(panelRef, open, {
  onClose: closeDrawer,
  initialFocus: () => closeRef.value,
});
useScrollLock(open);

function openDrawer() {
  open.value = true;
}

function closeDrawer() {
  open.value = false;
}

function handleReset() {
  closeDrawer();
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
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-ink">工作台 · 偏好设置</p>
          <p class="mt-1 text-xs text-muted">在此调整预览与编辑行为</p>
        </div>
        <span class="tag">Drawer</span>
      </div>

      <div class="mt-4 flex h-28 flex-col gap-2 rounded-control border border-line bg-card p-3">
        <div class="h-2 w-1/3 rounded-full bg-line"></div>
        <div class="h-2 w-2/3 rounded-full bg-line"></div>
        <div class="mt-auto flex justify-between">
          <div class="h-2 w-1/4 rounded-full bg-tag-bg"></div>
          <button ref="triggerRef" type="button" class="btn btn--primary" @click="openDrawer">
            打开设置
          </button>
        </div>
      </div>

      <p class="mt-3 text-[11px] text-muted">
        键盘：Tab 在面板内循环 · Esc / 遮罩点击关闭 · 打开时背景滚动锁定
      </p>
    </div>

    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="open" class="fixed inset-0 z-[60]">
          <div
            class="absolute inset-0 bg-ink/40"
            aria-hidden="true"
            @click="closeDrawer"
          ></div>
          <aside
            ref="panelRef"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            class="absolute inset-y-0 right-0 flex flex-col border-l border-line bg-surface shadow-card"
            :class="viewport === 'mobile' ? 'w-[80%] max-w-[22rem]' : 'w-[320px]'"
          >
            <header class="flex items-center justify-between gap-3 border-b border-border px-5 pb-3 pt-5">
              <h3 :id="titleId" class="text-base font-semibold text-ink">界面设置</h3>
              <button
                ref="closeRef"
                type="button"
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-tag-bg text-sm text-muted transition-colors hover:text-ink"
                aria-label="关闭抽屉"
                @click="closeDrawer"
              >
                ×
              </button>
            </header>

            <div class="flex-1 overflow-y-auto px-5 py-4">
              <p class="text-xs leading-relaxed text-muted">
                这是从右侧滑出的临时面板。背景内容仍可见，但页面滚动被锁定，焦点被收束在面板内。
              </p>
              <ul class="mt-4 flex flex-col gap-2">
                <li>
                  <label class="flex items-center gap-3 rounded-control border border-border bg-card px-3 py-2.5">
                    <input
                      type="checkbox"
                      class="h-4 w-4"
                      :style="{ accentColor: 'var(--color-accent)' }"
                      checked
                    />
                    <span class="text-sm text-ink">预览加载完成后播放动效</span>
                  </label>
                </li>
                <li>
                  <label class="flex items-center gap-3 rounded-control border border-border bg-card px-3 py-2.5">
                    <input
                      type="checkbox"
                      class="h-4 w-4"
                      :style="{ accentColor: 'var(--color-accent)' }"
                    />
                    <span class="text-sm text-ink">在预览中显示网格辅助线</span>
                  </label>
                </li>
                <li>
                  <label class="flex items-center gap-3 rounded-control border border-border bg-card px-3 py-2.5">
                    <input
                      type="checkbox"
                      class="h-4 w-4"
                      :style="{ accentColor: 'var(--color-accent)' }"
                      checked
                    />
                    <span class="text-sm text-ink">自动保存编辑内容</span>
                  </label>
                </li>
              </ul>
            </div>

            <footer class="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button type="button" class="btn btn--ghost" @click="closeDrawer">取消</button>
              <button type="button" class="btn btn--primary" @click="closeDrawer">
                保存设置
              </button>
            </footer>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity var(--duration-drawer) var(--ease-feedback);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-active aside,
.drawer-leave-active aside {
  transition: transform var(--duration-drawer) var(--ease-feedback);
}
.drawer-enter-from aside,
.drawer-leave-to aside {
  transform: translateX(100%);
}
</style>