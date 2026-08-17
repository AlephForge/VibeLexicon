import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { PATTERN_SLUGS } from './helpers';

/**
 * 内容完整性：直接以 Node 读取 src/content/patterns/*.mdx 的 frontmatter，
 * 不启动浏览器（Playwright test 无 page 参数即可）。
 *
 * 覆盖：文件数量（40）、四分类各 10、slug 唯一、related/compare 引用存在、
 * preview ∈ 合法 40 key、slug ↔ preview 双射。schema 同源校验由
 * `pnpm validate`（scripts/validate-patterns.ts）承担，本文件做回归门禁。
 */

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'patterns');

interface MiniEntry {
  slug: string;
  category: string;
  preview: string;
  related: string[];
  compare: string[];
}

function readEntries(): MiniEntry[] {
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx'));
  return files.sort().map((f) => {
    const raw = readFileSync(path.join(CONTENT_DIR, f), 'utf8');
    const { data } = matter(raw);
    return {
      slug: String(data.slug ?? ''),
      category: String(data.category ?? ''),
      preview: String(data.preview ?? ''),
      related: Array.isArray(data.related) ? data.related.map(String) : [],
      compare: Array.isArray(data.compare) ? data.compare.map(String) : [],
    };
  });
}

test.describe('content integrity', () => {
  test('恰好 40 个模式文件，且与 Registry 的 40 个 key 一一对应', () => {
    const entries = readEntries();
    expect(entries).toHaveLength(40);
    const slugs = entries.map((e) => e.slug);
    // slug 集合与 PATTERN_SLUGS（registry 镜像）完全一致
    expect([...slugs].sort()).toEqual([...PATTERN_SLUGS].sort());
  });

  test('四分类各 10 个模式', () => {
    const entries = readEntries();
    const counts = entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      layout: 10,
      'page-structure': 10,
      navigation: 10,
      components: 10,
    });
  });

  test('slug 全局唯一', () => {
    const slugs = readEntries().map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test('preview 是合法 Preview key，且与 slug 双射', () => {
    const entries = readEntries();
    const allowed = new Set(PATTERN_SLUGS);
    for (const e of entries) {
      expect(
        allowed.has(e.preview),
        `${e.slug} 的 preview=${e.preview} 应在 40 个合法 key 内`,
      ).toBe(true);
    }
    // slug 与 preview 集合一致（内容 ↔ Demo Registry 一一对应）
    const previews = entries.map((e) => e.preview);
    expect([...previews].sort()).toEqual([...PATTERN_SLUGS].sort());
  });

  test('related/compare 引用都指向真实存在的 slug，且不自指', () => {
    const entries = readEntries();
    const slugs = new Set(entries.map((e) => e.slug));
    for (const e of entries) {
      for (const ref of [...e.related, ...e.compare]) {
        expect(slugs.has(ref), `${e.slug} 引用了不存在的 slug: ${ref}`).toBe(true);
        expect(ref, `${e.slug} 不能自指`).not.toBe(e.slug);
      }
    }
  });

  test('全部 mdx frontmatter 可被 YAML 解析且必填字段齐全', () => {
    const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx'));
    for (const f of files) {
      const raw = readFileSync(path.join(CONTENT_DIR, f), 'utf8');
      const { data, errors } = matter(raw);
      expect(errors?.length ?? 0, `${f} YAML 解析错误`).toBe(0);
      for (const field of ['title', 'titleZh', 'slug', 'category', 'order', 'summary']) {
        expect(data[field], `${f} 缺少 ${field}`).toBeTruthy();
      }
      expect(typeof data.order, `${f} order 应为数字`).toBe('number');
    }
  });
});