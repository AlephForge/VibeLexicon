/**
 * URL 状态工具 —— 实现「URL as Shareable State」契约（PRD §7.4 / §19.2）。
 *
 * Gallery / Docs / Stream 之间的搜索与分类上下文通过 URL Query 传递，
 * 不使用内存 Store。本模块是纯函数模块，SSR 与客户端共用。
 */
import { ALL_CATEGORY, isCategoryKey, type CategoryKey } from './categories';

export interface ViewState {
  q: string;
  category: CategoryKey | null;
}

/**
 * 从 URL 读取可分享的视图状态。
 * - q：trim 后的搜索词（空串 = 无搜索）；
 * - category：「全部」= 参数缺失或 'all'；非法值归一化为 null。
 */
export function readViewState(url: URL): ViewState {
  const q = (url.searchParams.get('q') ?? '').trim();
  const raw = url.searchParams.get('category');
  const category =
    raw !== null && raw !== ALL_CATEGORY && isCategoryKey(raw) ? raw : null;
  return { q, category };
}

/**
 * 生成「保持当前 q / category 上下文」的站内链接。
 * 例：BASE_URL = '/VibeLexicon/'，current = `/?category=navigation&q=drawer`，
 *     buildContextLink('/docs', current) => '/VibeLexicon/docs/?category=navigation&q=drawer'
 *
 * - 目标路径按 astro.config 的 trailingSlash: 'always' 规范补尾斜杠；
 * - 使用 import.meta.env.BASE_URL 拼前缀（Astro 在 SSR 与客户端构建时均注入）。
 */
export function buildContextLink(
  path: '/' | '/docs' | '/docs/stream',
  current: URL,
): string {
  const { q, category } = readViewState(current);
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);

  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const target = path === '/' ? '/' : path.endsWith('/') ? path : `${path}/`;
  const query = params.toString();

  return `${base}${target}${query ? `?${query}` : ''}`;
}
