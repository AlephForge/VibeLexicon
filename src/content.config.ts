import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// W0 骨架：基础字段先行，保证工程基线可独立构建。
// W1（Issue #4）由 Content Model Agent 替换为引用
// src/lib/pattern-schema.ts 的正式同源版本。
const patterns = defineCollection({
  loader: glob({ base: './src/content/patterns', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    titleZh: z.string(),
    slug: z.string(),
    category: z.string(),
    order: z.number().int().positive(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    preview: z.string(),
  }),
});

export const collections = { patterns };
