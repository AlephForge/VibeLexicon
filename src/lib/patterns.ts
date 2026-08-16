/**
 * Pattern 查询辅助 —— 纯函数模块。
 *
 * SSR（Astro 页面）与客户端 Island 共用：禁止 import astro:content 与任何组件。
 * 本模块只依赖 `./categories`（分类顺序的单一来源）。
 */
import { CATEGORIES, ALL_CATEGORY } from './categories';

/** 列表 / 搜索场景下暴露的最小 Pattern 投影（Gallery / Docs / Stream 均可用） */
export interface PatternIndex {
  slug: string;
  title: string;
  titleZh: string;
  category: string;
  order: number;
  summary: string;
  tags: string[];
  preview: string;
}

const CATEGORY_POSITION = new Map<string, number>(
  CATEGORIES.map((c, i) => [c.key, i]),
);

/**
 * 按「分类顺序（CATEGORIES 定义顺序）→ 分类内 order」稳定排序。
 * 不修改入参，返回新数组。未知分类排到最后（schema 已保证不会出现，防御性处理）。
 */
export function sortPatterns<T extends { category: string; order: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ca = CATEGORY_POSITION.get(a.category) ?? Number.MAX_SAFE_INTEGER;
    const cb = CATEGORY_POSITION.get(b.category) ?? Number.MAX_SAFE_INTEGER;
    if (ca !== cb) return ca - cb;
    return a.order - b.order;
  });
}

/**
 * 按 category 与搜索词过滤。
 * - category：非 null 且 ≠ 'all' 时按分类过滤；
 * - q：非空时对 title / titleZh / summary / tags / category 做大小写不敏感的子串匹配
 *   （英文统一转小写包含、中文 toLowerCase 为恒等变换即直接包含）；q 为空 = 全部。
 * 保持输入顺序（调用方可先 sortPatterns 再 filter，或先过滤再排序）。
 */
export function filterPatterns<T extends PatternIndex>(
  list: T[],
  q: string,
  category: string | null,
): T[] {
  const query = q.trim().toLowerCase();
  return list.filter((item) => {
    if (category && category !== ALL_CATEGORY && item.category !== category) return false;
    if (!query) return true;
    const fields = [item.title, item.titleZh, item.summary, item.category, ...item.tags];
    return fields.some((field) => field.toLowerCase().includes(query));
  });
}
