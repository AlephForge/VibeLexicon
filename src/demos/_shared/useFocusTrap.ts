/**
 * Demo 覆盖层共享工具 —— 焦点圈 / Esc / 滚动锁（AGENTS.md §8，PRD §18）。
 *
 * 供 modal / drawer / lightbox / command-palette 四个 Full Demo 共用，保证
 * 这批"可玩的正确示例"行为一致：
 *
 * - 打开时记录打开前的活动元素（trigger），把焦点移入覆盖层；
 * - Tab / Shift+Tab 在容器内循环（focus trap），背景不可键盘访问；
 * - Esc 关闭并归还焦点到打开前的元素；
 * - `useScrollLock` 通过 html/body overflow 锁住页面滚动，并用滚动条宽度
 *   补偿，避免打开覆盖层时页面横向抖动。
 *
 * 状态不依赖动画：focus 管理全部走 reactive watch，CSS 过渡仅负责观感，
 * `prefers-reduced-motion` 下全局降级即可（见 tokens.css）。
 */
import { onBeforeUnmount, watch, type Ref } from 'vue';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function isVisible(el: HTMLElement): boolean {
  return (
    el.getClientRects().length > 0 &&
    getComputedStyle(el).visibility !== 'hidden'
  );
}

/** 容器内可聚焦元素（过滤隐藏 / aria-hidden） */
export function getFocusableWithin(
  root: HTMLElement | null | undefined,
): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      !el.hasAttribute('hidden') &&
      el.getAttribute('aria-hidden') !== 'true' &&
      isVisible(el),
  );
}

export interface FocusTrapOptions {
  /** Esc 关闭回调（idempotent），默认无 */
  onClose?: () => void;
  /** 打开后初始聚焦元素。'first' | 'last' | 返回元素的函数；默认 'first' */
  initialFocus?: 'first' | 'last' | (() => HTMLElement | null);
}

/**
 * 焦点圈：`isActive` 变为 true 时激活（记录 trigger + 聚焦进容器），
 * 变为 false 时移除监听并归还焦点。容器为覆盖层内语义元素（dialog / aside）。
 */
export function useFocusTrap(
  container: Ref<HTMLElement | null>,
  isActive: Ref<boolean>,
  options: FocusTrapOptions = {},
): { focusFirst: () => void; focusLast: () => void } {
  const { onClose, initialFocus = 'first' } = options;
  let previouslyFocused: HTMLElement | null = null;

  function resolveInitial(): HTMLElement | null {
    if (typeof initialFocus === 'function') return initialFocus();
    const items = getFocusableWithin(container.value);
    return initialFocus === 'last' ? items[items.length - 1] ?? null : items[0] ?? null;
  }

  function focusFirst(): void {
    getFocusableWithin(container.value)[0]?.focus();
  }

  function focusLast(): void {
    const items = getFocusableWithin(container.value);
    items[items.length - 1]?.focus();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose?.();
      return;
    }
    if (event.key !== 'Tab') return;
    const root = container.value;
    if (!root) return;
    const items = getFocusableWithin(root);
    if (items.length === 0) {
      event.preventDefault();
      root.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const inside = active instanceof Node && root.contains(active);
    if (event.shiftKey) {
      if (!inside || active === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (!inside || active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function activate(): void {
    previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.addEventListener('keydown', onKeydown, true);
    requestAnimationFrame(() => {
      const initial = resolveInitial();
      if (initial) {
        initial.focus();
      } else {
        focusFirst();
      }
    });
  }

  function deactivate(): void {
    document.removeEventListener('keydown', onKeydown, true);
    const target = previouslyFocused;
    if (target && target.isConnected && typeof target.focus === 'function') {
      target.focus();
    }
    previouslyFocused = null;
  }

  watch(isActive, (active) => (active ? activate() : deactivate()));
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown, true));

  return { focusFirst, focusLast };
}

/**
 * 背景滚动锁：`isActive` 为 true 时锁住 html/body 滚动（保留滚动条宽度，
 * 避免内容横向跳动），为 false 时恢复原值。与组件同生命周期。
 */
export function useScrollLock(isActive: Ref<boolean>): void {
  let saved:
    | { bodyOverflow: string; htmlOverflow: string; bodyPadding: string }
    | null = null;

  function lock(): void {
    const body = document.body;
    const html = document.documentElement;
    saved = {
      bodyOverflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
      bodyPadding: body.style.paddingRight,
    };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
  }

  function unlock(): void {
    if (!saved) return;
    const body = document.body;
    const html = document.documentElement;
    body.style.overflow = saved.bodyOverflow;
    html.style.overflow = saved.htmlOverflow;
    body.style.paddingRight = saved.bodyPadding;
    saved = null;
  }

  watch(isActive, (active) => (active ? lock() : unlock()));
  onBeforeUnmount(unlock);
}