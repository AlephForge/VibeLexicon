# VibeLexicon 界面视觉词典

> **See it. Name it. Understand it. Build it.** —— 看见它，叫出它，理解它，做出它。

VibeLexicon 是一个面向 Vibe Coding、AI Coding、前端开发与界面设计学习者的**可视化、可检索、可连续阅读、可交互体验的 UI Pattern 视觉词典**。收录常见布局、页面结构、导航方式与界面组件：看示例、学名称、理解场景，再把准确的描述交给 AI。

- 产品需求与决策记录见 [`docs/PRD.md`](docs/PRD.md)
- 工程执行约束见 [`AGENTS.md`](AGENTS.md)

## 四种体验

| 模式 | 路由 | 用户动作 |
|---|---|---|
| Gallery 图鉴 | `/` | 看 —— 视觉识别、发现 |
| Docs 文档 | `/docs` | 查 —— 高密度检索 |
| Stream 连续阅读 | `/docs/stream` | 读 —— 整章连续学习 |
| Detail 详情 | `/patterns/[slug]` | 玩 —— 操作真实 Live Demo |

## 本地开发

```bash
pnpm install
pnpm dev        # 本地开发
pnpm check      # astro check（类型检查）
pnpm validate   # Content Validator（40 词条/引用/preview key）
pnpm build      # 生产构建（含 Pagefind 搜索索引）
pnpm test:e2e   # Playwright E2E（需先 build）
```

## 技术栈

Astro 7 · TypeScript · Vue 3（仅交互 Islands）· Tailwind CSS v4 · Astro Content Collections（MDX）· Pagefind · Playwright · pnpm · GitHub Actions · GitHub Pages

## 目录结构

```text
src/
├── components/     # shell / gallery / docs / pattern / search
├── content/        # 单一 Pattern 内容源（40 个 Seed Pattern）
├── demos/          # Preview/Demo Registry 与 mini/full 组件
├── layouts/
├── lib/            # schema / categories / patterns / url / clipboard
├── pages/          # / /docs /docs/stream /patterns/[slug]
└── styles/         # tokens.css + global.css
scripts/            # validate-patterns.ts（Content Validator）
tests/              # Playwright E2E
```

## 部署

- GitHub Actions `deploy.yml`：main 分支构建静态站（含 Pagefind 索引）并部署到 GitHub Pages（`https://alephforge.github.io/VibeLexicon/`）。
- 首次部署前需在仓库 **Settings → Pages → Source** 选择 "GitHub Actions"。

## 搜索说明

- MVP 使用 **Pagefind** 静态索引（构建时生成，支持中英文检索）。
- 若 Pagefind 在特定环境不可用，可切换为内置 JSON 静态索引 fallback（见 `src/lib/search` 相关开关）。
- TypeScript 锁定 `~5.9.x`：`@astrojs/check` 暂不支持 TS 7，**禁止升级到 7.x**。
