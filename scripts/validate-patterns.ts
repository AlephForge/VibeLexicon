#!/usr/bin/env node
/**
 * VibeLexicon Content Validator（W1 / Issue #4）
 *
 * 职责：在构建之外对 src/content/patterns 目录下全部 mdx 文件（递归）做同源校验，
 * 是 W2 内容 Agent（40 个 Seed Pattern）与 CI 的验收门禁。
 *
 * 同源说明：本脚本直接 import `src/lib/pattern-schema.ts`（zod schema）、
 * `src/demos/registry.ts`（PREVIEW_KEYS）、`src/lib/categories.ts`（分类集合），
 * 校验规则与页面层共享同一事实源，避免复制逻辑后漂移。
 *
 * 为什么用 tsx：以 TypeScript 源码直接运行（无需先编译），且能跨模块边界
 * import src/lib 与 src/demos —— 保持「schema / validator / 页面」三方同源。
 * package.json 已提供 `pnpm validate` 脚本。
 *
 * 用法：
 *   pnpm validate                        # 完整模式（CI 用，要求 40 个 Pattern）
 *   pnpm validate -- --incomplete        # W1/W2 中间阶段：跳过数量检查
 *   pnpm validate -- --json              # 机器可读输出（仅打印 JSON 到 stdout）
 *
 * 退出码：存在任何 FAIL 时 process.exitCode = 1。
 *
 * Windows 说明：
 * - 文件路径统一输出正斜杠（path.sep → '/'）；
 * - gray-matter 读取文件后自动处理 \r\n，块标量内的 CRLF 由 YAML 解析器按换行处理，
 *   无需额外转换。
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { patternSchema } from '../src/lib/pattern-schema';
import { PREVIEW_KEYS, isPreviewKey } from '../src/demos/registry';

// ---------------------------------------------------------------------------
// 常量与 CLI 参数
// ---------------------------------------------------------------------------

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'patterns');

/**
 * 要求的 Pattern 数量（PRD §11：40 个 Seed Pattern）。
 * 以 registry 的长度为权威值（registry 与 PRD 顺序一一对应），避免双源维护。
 */
const REQUIRED_COUNT = PREVIEW_KEYS.length; // = 40

const args = process.argv.slice(2);
const INCOMPLETE = args.includes('--incomplete');
const JSON_OUTPUT = args.includes('--json');

const MODE_LABEL = INCOMPLETE ? 'incomplete（跳过数量检查）' : 'full';

// ---------------------------------------------------------------------------
// 数据结构
// ---------------------------------------------------------------------------

interface Issue {
  file: string; // 相对仓库根、正斜杠路径；集合级问题用 '(collection)'
  level: 'FAIL' | 'WARN';
  type: string;
  message: string;
}

interface ParsedFile {
  relPath: string;
  id: string; // 文件名（不含 .mdx）
  data: Record<string, unknown> | null; // null = YAML 解析失败
  parseError?: string;
}

const issues: Issue[] = [];

function fail(file: string, type: string, message: string): void {
  issues.push({ file, level: 'FAIL', type, message });
}
function warn(file: string, type: string, message: string): void {
  issues.push({ file, level: 'WARN', type, message });
}

// ---------------------------------------------------------------------------
// 文件扫描与解析
// ---------------------------------------------------------------------------

function collectMdx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectMdx(full));
    else if (entry.name.endsWith('.mdx')) out.push(full);
  }
  return out.sort();
}

function toRelPosix(file: string): string {
  return path.relative(process.cwd(), file).split(path.sep).join('/');
}

function parseFile(file: string): ParsedFile {
  const relPath = toRelPosix(file);
  const id = path.basename(file, '.mdx');
  const raw = readFileSync(file, 'utf8');
  try {
    const { data } = matter(raw);
    return { relPath, id, data: (data ?? {}) as Record<string, unknown> };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { relPath, id, data: null, parseError: message };
  }
}

/** 从 js-yaml 异常信息中尽力提取行号（格式如 "…(5:1)" 或 "at line 5, column 3"） */
function extractYamlLine(message: string): number | null {
  const m = message.match(/\((\d+):\d+\)/) ?? message.match(/at line (\d+)/);
  return m ? Number(m[1]) : null;
}

// ---------------------------------------------------------------------------
// zod issue → 可读消息
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  title: 'title（英文标准名）',
  titleZh: 'titleZh（中文名称）',
  slug: 'slug（URL key）',
  category: 'category（分类）',
  order: 'order（分类内排序）',
  summary: 'summary（一句话定义）',
  tags: 'tags（标签）',
  preview: 'preview（Preview key）',
  whatIs: 'whatIs（是什么）',
  useCases: 'useCases（适合场景）',
  limitations: 'limitations（不适合场景）',
  prompt: 'prompt（AI Prompt）',
  related: 'related（相关词条）',
  compare: 'compare（对比词条）',
  'source.author': 'source.author（来源作者）',
  'source.url': 'source.url（来源 URL）',
  'source.note': 'source.note（来源说明）',
};

/**
 * zod issue 的结构化投影（避免依赖 zod v4 已弃用的 ZodIssue 导出；
 * 本字段集对 zod v4 的 issue 是协变的，仅读取）。
 */
interface IssueShape {
  path: PropertyKey[]; // zod v4 的 issue path 允许 symbol，宽化为 PropertyKey
  code: string;
  message: string;
  values?: unknown;
}

function formatIssue(issue: IssueShape): string {
  const field = issue.path.join('.') || '(frontmatter)';
  const label = FIELD_LABELS[field] ?? field;
  // zod v4 枚举错误：{ code: 'invalid_value', values: [...] }（astro 7 内置 zod v4）
  if (issue.code === 'invalid_value' && Array.isArray(issue.values)) {
    return `${label}: 非法值，允许值: ${(issue.values as string[]).join(' | ')}`;
  }
  return `${label}: ${issue.message}`;
}

// ---------------------------------------------------------------------------
// 逐文件校验
// ---------------------------------------------------------------------------

function validateFile(file: ParsedFile): void {
  // 1) YAML 解析
  if (file.data === null) {
    const line = file.parseError ? extractYamlLine(file.parseError) : null;
    fail(
      file.relPath,
      'yaml-parse',
      `YAML 解析失败${line !== null ? `（约第 ${line} 行）` : ''}: ${file.parseError}`,
    );
    return;
  }

  // 2) frontmatter 为空：一条可读 FAIL，不再展开一堆 Required
  if (Object.keys(file.data).length === 0) {
    fail(file.relPath, 'empty-frontmatter', 'frontmatter 为空或缺失（需要 --- 分隔的 YAML 块）');
    return;
  }

  // 3) schema 校验（字段级规则全部由 zod 保证）
  const result = patternSchema.safeParse(file.data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      fail(file.relPath, `schema.${issue.path.join('.') || 'root'}`, formatIssue(issue));
    }
    return;
  }

  const data = result.data;

  // 4) preview key 二次确认（schema 已保证合法，此处防御并输出可读信息）
  if (!isPreviewKey(data.preview)) {
    fail(
      file.relPath,
      'preview-key',
      `preview: 非法值，允许值: ${PREVIEW_KEYS.join(' | ')}（该 key 未在 src/demos/registry.ts 注册）`,
    );
  }

  // 5) 约定检查：slug 与 preview key 同名（PRD §11 与 registry 顺序一一对应）
  if (data.slug !== data.preview) {
    warn(
      file.relPath,
      'slug-preview-mismatch',
      `slug（${data.slug}）与 preview key（${data.preview}）不一致，本项目约定两者同名`,
    );
  }
}

// ---------------------------------------------------------------------------
// 集合级校验
// ---------------------------------------------------------------------------

function validateCollection(files: ParsedFile[], slugs: Set<string>): void {
  const bySlug = new Map<string, ParsedFile>();

  // 1) slug 全局唯一
  for (const file of files) {
    const slug = file.data?.slug;
    if (typeof slug !== 'string') continue; // schema 已报错
    if (slugs.has(slug)) {
      fail(file.relPath, 'duplicate-slug', `slug「${slug}」与 ${bySlug.get(slug)?.relPath} 重复`);
    } else {
      bySlug.set(slug, file);
      slugs.add(slug);
    }
  }

  // 2) 文件名 id 与 frontmatter slug 一致（路由依赖 data.slug）
  for (const file of files) {
    const slug = file.data?.slug;
    if (typeof slug === 'string' && file.id !== slug) {
      fail(
        file.relPath,
        'slug-mismatch',
        `文件名 id（${file.id}）与 frontmatter slug（${slug}）不一致，请重命名文件或修正 slug`,
      );
    }
  }

  // 3) order 在同一 category 内唯一
  const orderSeen = new Map<string, string>(); // `${category}:${order}` → 先见文件
  for (const file of files) {
    const { category, order } = (file.data ?? {}) as { category?: unknown; order?: unknown };
    if (typeof category !== 'string' || typeof order !== 'number') continue; // schema 已报错
    const key = `${category}:${order}`;
    const prev = orderSeen.get(key);
    if (prev !== undefined) {
      fail(file.relPath, 'duplicate-order', `order=${order} 与 ${prev} 在分类「${category}」内重复`);
    } else {
      orderSeen.set(key, file.relPath);
    }
  }

  // 4) related / compare 引用检查
  for (const file of files) {
    const data = file.data as Record<string, unknown> | null;
    if (!data) continue;
    for (const field of ['related', 'compare'] as const) {
      const refs = data[field];
      if (!Array.isArray(refs)) continue; // schema 已报错 / 默认 []
      for (const ref of refs) {
        if (typeof ref !== 'string' || !ref) continue;
        if (ref === data.slug) {
          fail(file.relPath, 'self-ref', `${field}: 引用了自身 slug「${ref}」，应指向其他词条`);
        } else if (!slugs.has(ref)) {
          // W1/W2 中间阶段依赖词条尚未就绪，--incomplete 下降级为 WARN；
          // 完整模式（CI）必须全部可解析。
          if (INCOMPLETE) {
            warn(
              file.relPath,
              'dangling-ref',
              `${field}: 引用不存在的 slug「${ref}」（当前已有: ${[...slugs].sort().join(', ') || '无'}）—— --incomplete 模式降级为 WARN，W2 需补齐`,
            );
          } else {
            fail(
              file.relPath,
              'dangling-ref',
              `${field}: 引用不存在的 slug「${ref}」（当前已有: ${[...slugs].sort().join(', ') || '无'}）`,
            );
          }
        }
      }
    }
  }

  // 5) 非对称关系（WARN）：A → B 但 B 未回引 A
  const relatedMap = new Map<string, string[]>();
  const compareMap = new Map<string, string[]>();
  for (const file of files) {
    const data = file.data as Record<string, unknown> | null;
    if (!data || typeof data.slug !== 'string') continue;
    const slug = data.slug;
    if (Array.isArray(data.related)) relatedMap.set(slug, data.related.filter((r): r is string => typeof r === 'string'));
    if (Array.isArray(data.compare)) compareMap.set(slug, data.compare.filter((r): r is string => typeof r === 'string'));
  }
  const checkAsymmetry = (
    field: 'related' | 'compare',
    map: Map<string, string[]>,
    bySlug: Map<string, ParsedFile>,
  ): void => {
    for (const [slug, refs] of map) {
      for (const ref of refs) {
        const back = map.get(ref);
        if (ref !== slug && back && !back.includes(slug)) {
          const targetFile = bySlug.get(slug);
          warn(
            targetFile?.relPath ?? '(collection)',
            'asymmetric-ref',
            `${field} 非对称: ${slug} → ${ref}，但 ${ref} 未回引 ${slug}（可选：双向关系更利于导航）`,
          );
        }
      }
    }
  };
  checkAsymmetry('related', relatedMap, bySlug);
  checkAsymmetry('compare', compareMap, bySlug);

  // 6) 数量精确检查（--incomplete 跳过）
  if (!INCOMPLETE && files.length !== REQUIRED_COUNT) {
    const usedPreview = new Set(
      files
        .map((f) => (f.data && typeof f.data.preview === 'string' ? f.data.preview : null))
        .filter((v): v is string => v !== null),
    );
    const missing = PREVIEW_KEYS.filter((k) => !usedPreview.has(k));
    const extraSlugs = [...slugs].filter((s) => !isPreviewKey(s));
    const lines: string[] = [`数量校验失败: 当前 ${files.length} 个文件 / 要求 ${REQUIRED_COUNT} 个 Pattern`];
    if (missing.length > 0) lines.push(`  缺失（按 preview key）: ${missing.join(', ')}`);
    if (extraSlugs.length > 0) lines.push(`  多余（slug 不在 40 个名单内）: ${extraSlugs.join(', ')}`);
    fail('(collection)', 'count', lines.join('\n  '));
  }
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

function main(): void {
  const mdxFiles = collectMdx(CONTENT_DIR);
  const files: ParsedFile[] = mdxFiles.map(parseFile);

  for (const file of files) validateFile(file);

  const slugs = new Set<string>();
  validateCollection(files, slugs);

  const failCount = issues.filter((i) => i.level === 'FAIL').length;
  const warnCount = issues.filter((i) => i.level === 'WARN').length;
  const ok = failCount === 0;

  if (JSON_OUTPUT) {
    const json = {
      ok,
      mode: INCOMPLETE ? 'incomplete' : 'full',
      files: files.length,
      required: REQUIRED_COUNT,
      fail: failCount,
      warn: warnCount,
      issues,
    };
    console.log(JSON.stringify(json, null, 2));
  } else {
    console.log('── VibeLexicon Content Validator ──────────────');
    for (const issue of issues) {
      console.log(`[${issue.level}] ${issue.file}`);
      for (const line of issue.message.split('\n')) {
        console.log(`  • ${line}`);
      }
    }
    console.log('──────────────────────────────────────────────');
    console.log(
      `结果: ${files.length} 个文件，${failCount} FAIL，${warnCount} WARN（模式: ${MODE_LABEL}）`,
    );
  }

  if (!ok) process.exitCode = 1;
}

main();
