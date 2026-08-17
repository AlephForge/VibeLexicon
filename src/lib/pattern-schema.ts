/**
 * Pattern Content Schema —— 唯一内容模型（One Source, Four Views 的契约）。
 *
 * 本模块是「纯 schema 模块」：
 * - 只 import zod 与纯数据模块（categories / demos registry），
 *   禁止 import astro:content（Content Validator 在 tsx 下直接运行本模块，不能有 Astro 运行时依赖）；
 * - 页面层（content.config.ts）、Content Validator（scripts/validate-patterns.ts）、
 *   以及未来的 W2 内容 Agent 都以此 schema 为同源事实。
 *
 * 类型说明：
 * - `z.enum` 要求非空 tuple，`as [CategoryKey, ...CategoryKey[]]` / `as [PreviewKey, ...PreviewKey[]]`
 *   是 TS 层面的宽化断言（运行时仍是原数组）；
 * - `PreviewKey` 从 `src/demos/registry.ts` 导入 type，保证内容层与 Demo Registry 强一致。
 */
import { z } from 'astro/zod';
import { CATEGORY_KEYS, type CategoryKey } from './categories';
import { PREVIEW_KEYS } from '../demos/registry';
import type { PreviewKey } from '../demos/registry';

export const patternSchema = z.object({
  title: z.string().min(1).max(80), // 英文标准名
  titleZh: z.string().min(1).max(40), // 中文名称
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), // 稳定 URL key
  category: z.enum(CATEGORY_KEYS as [CategoryKey, ...CategoryKey[]]),
  order: z.number().int().min(1), // 分类内排序
  summary: z.string().min(10).max(200), // 一句话定义
  tags: z.array(z.string().min(1).max(30)).min(2).max(8),
  preview: z.enum([...PREVIEW_KEYS] as [PreviewKey, ...PreviewKey[]]),
  whatIs: z.string().min(30), // 是什么（块标量）
  useCases: z.array(z.string().min(4)).min(1).max(10), // 适合场景
  limitations: z.array(z.string().min(4)).min(1).max(10), // 不适合/边界
  prompt: z.string().min(50), // AI Prompt（块标量）
  related: z.array(z.string()).default([]), // slug 引用
  compare: z.array(z.string()).default([]), // slug 引用
  source: z.object({
    author: z.string().min(1),
    url: z.string().url(),
    note: z.string().optional(),
  }),
});

export type PatternData = z.infer<typeof patternSchema>;
