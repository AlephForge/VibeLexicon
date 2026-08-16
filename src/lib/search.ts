/**
 * 全站搜索封装 —— Pagefind 优先，本地索引过滤兜底（Issue #13 / Search Agent K）。
 *
 * 纯客户端模块：只在浏览器内调用；SSR 导入安全（无顶层 DOM / window 访问，
 * 所有浏览器 API 都在函数体内）。
 *
 * 依赖约束：
 * - 不 import astro:content / 任何组件；
 * - 不新增第三方运行依赖（Pagefind 通过运行时动态 import 加载，不进打包体积）。
 *
 * 行为（searchAll）：
 * - 空查询 → 本地索引浏览态（全量 Pattern 按分类/序号排序，不依赖 Pagefind）；
 * - 优先 Pagefind：动态 import `${BASE_URL}pagefind/pagefind.js` +
 *   options({ basePath: `${BASE_URL}pagefind/` })，适配 GitHub Pages 子路径；
 * - Pagefind 缺失 / 加载失败（dev、未 build）→ 本地索引子串过滤；
 * - Pagefind 返回 0 条但本地子串可命中 → 用本地结果（逐字输入期间体验更好）。
 *
 * 结果 URL 规整：
 * - 命中 Pattern → 直接用 `${BASE_URL}patterns/<slug>/`（与全站链接约定一致，不带 query）；
 * - 命中非 Pattern 页（docs / about 等）→ 规整 Pagefind 返回的 URL（剥离
 *   `?__highlight=` query、norm 相对段，并保证前缀），保证跳转正确。
 */
import { sortPatterns } from './patterns';

/** 本地兜底索引条目（BaseLayout 构建期从内容集合投影，与 PatternIndex 同源字段） */
export interface SearchDoc {
  slug: string;
  title: string;
  titleZh: string;
  category: string;
  order: number;
  summary: string;
  tags: string[];
}

/** 规范化搜索结果（Palette 展示层唯一形态） */
export interface SearchHit {
  /** 命中 Pattern 的 slug；非 Pattern 页（docs / about 等）为 null */
  slug: string | null;
  title: string;
  titleZh: string | null;
  category: string | null;
  /** 绝对站内 URL（含 base 前缀，如 /VibeLexicon/patterns/drawer/） */
  url: string;
  /** 摘要片段；Pagefind 输出可能含 <mark> 高亮标记（信任构建期产物） */
  excerpt: string;
  source: 'pagefind' | 'local';
}

export interface SearchOutcome {
  hits: SearchHit[];
  source: 'pagefind' | 'local';
  /** 仅当 Pagefind 运行失败、回退本地索引时为 true（Palette 可提示降级） */
  degraded: boolean;
}

/** Pagefind 运行时最小类型面（不引第三方类型包） */
export interface PagefindModule {
  options(opts: Record<string, unknown>): Promise<void>;
  search(term: string): Promise<{ results: PagefindResultItem[] }>;
}
export interface PagefindResultItem {
  data(): Promise<{
    /**
     * 已按 options.baseUrl 拼好前缀的站内网址（如 /VibeLexicon/patterns/drawer/）。
     * pagefind v1.5.2 结果对象没有 url() 方法；raw_url 才是未拼前缀的原始路径。
     */
    url: string;
    title?: string;
    meta?: { title?: string };
    excerpt: string;
  }>;
}

let pagefindPromise: Promise<PagefindModule | null> | null = null;

/** 单例加载 Pagefind；失败返回 null（缓存，避免重复失败请求） */
export function loadPagefind(): Promise<PagefindModule | null> {
  pagefindPromise ??= importPagefind().catch(() => null);
  return pagefindPromise;
}

async function importPagefind(): Promise<PagefindModule | null> {
  const base = import.meta.env.BASE_URL;
  // @vite-ignore：阻止 Vite 在构建期解析并打包 Pagefind ——
  // Pagefind 只存在于构建产物 dist/pagefind/ 中，运行时按 base 拼绝对路径加载。
  const mod: unknown = await import(/* @vite-ignore */ `${base}pagefind/pagefind.js`);
  if (!mod || typeof (mod as PagefindModule).search !== 'function') return null;
  await (mod as PagefindModule).options({ basePath: `${base}pagefind/` });
  return mod as PagefindModule;
}

/** 统一入口：Pagefind 优先，本地索引兜底 */
export async function searchAll(term: string, docs: SearchDoc[]): Promise<SearchOutcome> {
  const query = term.trim();

  // 空查询 → 浏览态：直接列出全部 Pattern（稳定排序），不依赖 Pagefind
  if (!query) {
    return { hits: searchLocal(query, docs), source: 'local', degraded: false };
  }

  const pagefind = await loadPagefind();
  if (pagefind) {
    try {
      const { results } = await pagefind.search(query);
      if (results && results.length > 0) {
        const hits = await Promise.all(results.map(async (r) => toHit(r, docs)));
        return { hits, source: 'pagefind', degraded: false };
      }
      // Pagefind「精确 token 匹配」对逐字输入的支持较弱；
      // 本地子串命中能命中时给出更实时的反馈。
      const localHits = searchLocal(query, docs);
      if (localHits.length > 0) {
        return { hits: localHits, source: 'local', degraded: false };
      }
      return { hits: [], source: 'pagefind', degraded: false };
    } catch {
      // 索引加载 / 搜索执行异常 → 回退本地
    }
  }
  return { hits: searchLocal(query, docs), source: 'local', degraded: true };
}

/** 本地子串过滤（title / titleZh / summary / tags / category），稳定排序 */
export function searchLocal(term: string, docs: SearchDoc[]): SearchHit[] {
  const base = import.meta.env.BASE_URL;
  const query = term.trim().toLowerCase();
  return sortPatterns(docs)
    .filter((doc) => {
      if (!query) return true;
      const fields = [doc.title, doc.titleZh, doc.summary, doc.category, ...doc.tags];
      return fields.some((field) => field.toLowerCase().includes(query));
    })
    .map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      titleZh: doc.titleZh,
      category: doc.category,
      url: `${base}patterns/${doc.slug}/`,
      excerpt: doc.summary,
      source: 'local' as const,
    }));
}

async function toHit(result: PagefindResultItem, docs: SearchDoc[]): Promise<SearchHit> {
  const data = await result.data();
  const slug = extractSlug(data.url);
  const doc = slug ? (docs.find((d) => d.slug === slug) ?? null) : null;
  return {
    slug: doc?.slug ?? null,
    title: doc ? doc.title : stripSiteTitle(data.meta?.title ?? data.title ?? ''),
    titleZh: doc?.titleZh ?? null,
    category: doc?.category ?? null,
    url: resolveUrl(data.url, doc),
    excerpt: data.excerpt,
    source: 'pagefind',
  };
}

/** 从 Pagefind URL 提取末段 slug；非法段（非 pattern key）返回 null */
function extractSlug(rawUrl: string): string | null {
  const segment =
    rawUrl
      .split(/[?#]/)[0]
      .replace(/\/+$/, '')
      .split('/')
      .filter(Boolean)
      .pop() ?? '';
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(segment) ? segment : null;
}

/** 规整最终跳转 URL：Pattern 走约定链接；非 Pattern 页规整 Pagefind URL 并保证 base 前缀 */
function resolveUrl(rawUrl: string, doc: SearchDoc | null): string {
  const base = import.meta.env.BASE_URL;
  if (doc) return `${base}patterns/${doc.slug}/`;

  let u = rawUrl.split(/[?#]/)[0];
  while (u.startsWith('../')) u = u.slice(3);
  if (/^(https?:)?\/\//.test(u) || u.startsWith(base)) return u;
  return `${base}${u.replace(/^\/+/, '')}`;
}

/** 去掉页面 <title> 末尾的站点后缀「| VibeLexicon」（title 缺失时回退空串） */
function stripSiteTitle(title: string): string {
  const stripped = title.replace(/\s*[|｜·]\s*VibeLexicon\s*$/i, '').trim();
  return stripped || title;
}