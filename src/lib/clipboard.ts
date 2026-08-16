/**
 * 剪贴板工具 —— 供 Detail 页「复制 Prompt」等交互使用。
 *
 * 说明：
 * - 本模块允许包含 DOM API，但**只允许在浏览器端函数体内调用**
 *   （navigator / document 均有 typeof 守卫，SSR 导入安全）；
 * - 模块本身不 import astro:content 与任何组件，保持叶子依赖。
 *
 * 策略：优先 `navigator.clipboard.writeText`（仅 Secure Context 可用），
 * 异常时回退到隐藏 textarea + `document.execCommand('copy')` 的兼容方案。
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false;
  // 标准 API；老浏览器可能没有该属性
  if (typeof window.isSecureContext === 'boolean') return window.isSecureContext;
  // 兜底判断：https 或 http://localhost / http://127.0.0.1 视为安全上下文
  const { protocol, hostname } = window.location;
  return (
    protocol === 'https:' ||
    ((hostname === 'localhost' || hostname === '127.0.0.1') && protocol === 'http:')
  );
}

/** 复制文本；返回是否成功 */
export async function copyText(text: string): Promise<boolean> {
  if (
    isSecureContext() &&
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 权限被拒等异常 → 走兼容回退
    }
  }
  return legacyCopy(text);
}

/** 隐藏 textarea + execCommand 的兼容复制（旧浏览器 / 非安全上下文） */
function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    // 移出视口，避免闪烁与 iOS 缩放
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    // iOS Safari 需要显式设置选区
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
