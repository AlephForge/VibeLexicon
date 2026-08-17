import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { patternSchema } from '@/lib/pattern-schema';

// W1（Issue #4）：正式内容模型 —— 单一 Content Collection 驱动 Gallery / Docs / Stream / Detail。
// schema 与 Content Validator（scripts/validate-patterns.ts）同源于 src/lib/pattern-schema.ts。
const patterns = defineCollection({
  loader: glob({ base: './src/content/patterns', pattern: '**/*.mdx' }),
  schema: patternSchema,
});

export const collections = { patterns };
