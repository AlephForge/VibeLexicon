/**
 * 分类体系 —— 单一来源（One Source, Four Views 的“分类”部分）。
 *
 * 约定（与 PRD §6.4 / §22 一致）：
 * - URL 使用英文 key（如 `/?category=navigation`），`name` 用于英文展示，`nameZh` 用于中文展示；
 * - 「全部」= URL 参数缺失或值为 `ALL_CATEGORY`（'all'）；
 * - 非法分类值统一归一化为 `null`，由调用方按「全部」处理（见 `readViewState`）。
 *
 * 本模块是纯数据模块：禁止 import astro:content 与任何组件，
 * 以保证 zod schema、Content Validator（tsx 运行）与页面层三方同源引用。
 */
export const CATEGORIES = [
  { key: 'layout', order: 1, name: 'Layout', nameZh: '页面布局' },
  { key: 'page-structure', order: 2, name: 'Page Structure', nameZh: '页面结构' },
  { key: 'navigation', order: 3, name: 'Navigation', nameZh: '导航与切换' },
  { key: 'components', order: 4, name: 'Components', nameZh: '常用组件' },
] as const;

export type Category = (typeof CATEGORIES)[number];

/** 合法分类 key 的字面量联合：'layout' | 'page-structure' | 'navigation' | 'components' */
export type CategoryKey = Category['key'];

/**
 * string[] 形态的分类 key 列表，供 zod `z.enum` 使用。
 * 注意：zod enum 要求「非空 tuple」，schema 层通过
 * `CATEGORY_KEYS as [CategoryKey, ...CategoryKey[]]` 满足该类型约束。
 */
export const CATEGORY_KEYS: string[] = CATEGORIES.map((c) => c.key);

/** 「全部」分类：URL 参数缺失或值为 'all' 时表示不过滤 */
export const ALL_CATEGORY = 'all';

/** 类型守卫：v 是否为合法分类 key */
export function isCategoryKey(v: string): v is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(v);
}

/** 按 key 取分类对象；非法 key 返回 undefined */
export function getCategory(key: string): Category | undefined {
  return CATEGORIES.find((c) => c.key === key);
}
