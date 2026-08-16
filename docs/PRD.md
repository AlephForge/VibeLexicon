# VibeLexicon 产品需求文档（PRD）

> 版本：v0.1 / MVP 基线  
> 状态：Approved for implementation  
> 仓库：`AlephForge/VibeLexicon`  
> 本地开发目录：`D:\Documents\C_learn\VibeLexicon`  
> 最后对齐：2026-08-16

---

## 1. 产品概述

### 1.1 产品名称

**VibeLexicon**

中文副标题：**界面视觉词典**

### 1.2 一句话定位

VibeLexicon 是一个面向 Vibe Coding、AI Coding、前端开发与界面设计学习者的**可视化、可检索、可连续阅读、可交互体验的 UI Pattern 视觉词典**。

它解决的核心问题不是“AI 会不会写代码”，而是：

> 用户看到一个优秀的界面模式，却不知道它叫什么，因此无法准确搜索、学习，也无法准确告诉 AI 应该实现什么。

产品通过“看、查、读、玩”四种入口，把抽象的 UI / Web Design 术语转换为可理解、可操作、可复制给 AI 的知识单元。

### 1.3 品牌主张

英文：**See it. Name it. Understand it. Build it.**

中文：**看见它，叫出它，理解它，做出它。**

建议首页主标题：

> **把 UI 术语，变成看得见的灵感。**

建议首页说明：

> 收录常见布局、页面结构、导航方式与界面组件。看示例、学名称、理解场景，再把准确的描述交给 AI。

---

## 2. 产品目标

### 2.1 MVP 必须验证的价值

MVP 不追求内容平台、账号体系或社区能力，只验证以下四件事：

1. **新手能通过视觉预览识别 UI Pattern。**
2. **熟手能像查文档一样快速找到术语。**
3. **学习者能连续向下阅读一整章内容，不被页面跳转打断。**
4. **进入详情页后，用户可以真实操作 Live Demo，并复制足够准确的 AI Prompt。**

### 2.2 MVP 成功标准

- 首次访问者在 10 秒内能理解网站是“UI 视觉词典”。
- 用户无需注册即可浏览全部 MVP 内容。
- Gallery、Docs、Stream、Detail 四种核心体验全部可用。
- 40 个 Seed Pattern 全部可访问且结构一致。
- 至少 10 个代表性 Pattern 有真实可交互的 Full Demo。
- 所有 Pattern 均提供中文解释、标准英文名、使用场景、Prompt、来源和关联词条。
- 搜索支持中文和英文术语。
- 桌面端与手机端均可完整使用。
- 核心交互支持键盘访问与 `prefers-reduced-motion`。
- 静态站可以通过 GitHub Actions 构建并部署到 GitHub Pages。

---

## 3. 非目标（MVP 明确不做）

MVP 不包含：

- 用户注册 / 登录。
- 云端收藏同步。
- 数据库。
- 后端 API 服务。
- 评论系统。
- 社区投稿后台。
- CMS 管理后台。
- AI 对话助手。
- 在线代码编辑器 / Playground IDE。
- 自动抓取 X / Blog 并直接公开发布。
- 付费体系。
- 多语言完整国际化系统。
- 复杂社交功能。

若实现过程中发现以上能力“顺手可以加”，仍不得擅自纳入 MVP。

---

## 4. 目标用户

### 4.1 Persona A：Vibe Coding 新手

特征：

- 会使用 ChatGPT、Claude、Codex 或其他 Coding Agent。
- 对 HTML/CSS/前端术语不熟。
- 经常只能描述“高级一点”“像这个网站”。
- 对视觉识别比文字定义更敏感。

核心任务：

> 看到 Preview → 发现“这就是我要的” → 知道标准名称 → 复制描述 / Prompt。

主要入口：**Gallery**。

### 4.2 Persona B：熟练开发者 / 设计师

特征：

- 已知道 Modal、Drawer、Masonry、Breadcrumb 等术语。
- 不需要大面积预览图。
- 更重视快速扫描、搜索与精准定义。

核心任务：

> 搜索 / 扫列表 → 快速打开词条 → 确认定义 / Prompt / 差异。

主要入口：**Docs**。

### 4.3 Persona C：系统学习者

核心任务：

> 按章节连续阅读，从 Card Layout 一路读到当前章节末尾。

主要入口：**Stream**。

### 4.4 Persona D：深度使用者

核心任务：

> 真正操作某个 Pattern，理解其行为、适用边界、可访问性与相似方案差异。

主要入口：**Detail**。

---

## 5. 核心信息架构

### 5.1 四种体验

| 模式 | 用户动作 | 目的 | 主要用户 |
|---|---|---|---|
| Gallery | 看 | 发现、识别 | 新手 |
| Docs | 查 | 快速检索 | 熟手 |
| Stream | 读 | 连续学习 | 学习者 |
| Detail | 玩 | 深度理解 | 所有人 |

### 5.2 路由基线

```text
/
├── /                         Gallery 图鉴首页
├── /docs                     Docs 文档索引页
├── /docs/stream              Stream 连续阅读页
├── /patterns/[slug]          Pattern Detail 详情页
├── /categories/[slug]        分类落地页（MVP 可轻量实现）
└── /about                    关于 / 来源说明
```

### 5.3 一级导航

MVP Header 只保留必要入口：

- VibeLexicon Logo / Wordmark
- 图鉴
- 文档
- 全局搜索
- GitHub
- Theme（若实现暗色模式；暗色模式不是阻断 MVP 的条件）

Stream 属于 Docs 的阅读模式，不提升为一级导航。

---

## 6. Gallery：图鉴首页

### 6.1 产品目标

回答：

> “我不知道这个东西叫什么，但我看见就能认出来。”

Gallery 是品牌记忆点最强的页面，也是新手默认首页。

### 6.2 页面结构

1. Header。
2. 紧凑 Hero。
3. 搜索框。
4. 分类 Filter Chips。
5. Pattern Preview Grid。
6. Footer / 来源说明。

### 6.3 Hero 要求

Hero 不做传统 SaaS 的满屏营销首屏。

必须：

- 首屏内即可看到第一行 Pattern Cards。
- Hero 文案控制在标题 + 1 段说明。
- Search 位于 Hero 内或 Hero 紧邻区域。
- 视觉语言偏 Warm Editorial，不做典型紫蓝 AI 渐变站。

### 6.4 分类 Filter

MVP 四类：

- 全部
- Layout / 页面布局
- Page Structure / 页面结构
- Navigation / 导航与切换
- Components / 常用组件

Filter 需要与 URL 状态同步，例如：

`/?category=navigation`

### 6.5 Pattern Card

必须包含：

- Mini Preview（主要视觉区域）。
- English Name。
- 中文名称。
- 一句简短定义。
- Category / Tags。
- 点击后进入 `/patterns/[slug]`。

### 6.6 Mini Preview 原则

Mini Preview 不是文章封面图，而是对 Pattern 本身的**视觉解释**。

例如：

- Drawer：看到面板从右侧进入。
- Modal：看到居中遮罩对话框。
- Masonry：看到高度不同的图片块错落排列。
- Tabs：看到不同标签对应内容区切换。
- Bento：看到不同面积卡片组成层级。

MVP 性能约束：

- 不允许首页一次 Hydrate 40 个复杂交互组件。
- 大多数 Preview 应静态渲染或仅 CSS 动画。
- 复杂 Demo 的完整交互留在 Detail。

---

## 7. Docs：简洁文档模式

### 7.1 产品目标

回答：

> “我知道它叫什么，让我尽快找到。”

### 7.2 设计特征

Docs 与 Gallery 必须明显区分：

- 信息密度更高。
- 缩略图不是主要元素，MVP 可以完全不显示 Preview。
- 优先 English Name + 中文名 + 一句话定义。
- 桌面端采用文档式 Sidebar。
- 风格可参考成熟文档的信息结构，但不能直接套模板破坏 VibeLexicon 的品牌系统。

### 7.3 Desktop 结构

左侧：

- Search / 快速筛选。
- 四个 Category。
- Category 下的 Pattern 名称。
- 当前项 Active 状态。

中间：

- 当前分类说明。
- 词条列表 / 极简索引。

右侧（可选，屏幕空间充足时）：

- On this page。
- 当前分类的快速锚点。

### 7.4 Docs 与 Gallery 上下文共享

这是强制 UX 约束。

若用户在 Gallery：

- `category=navigation`
- `q=drawer`

切到 Docs 后必须保持相同筛选上下文。

搜索与分类状态优先使用 URL Query 作为可分享的状态源，不应只存在内存状态中。

---

## 8. Stream：连续阅读模式

### 8.1 产品目标

回答：

> “我想系统读完一整章，不想一个词条点进去再返回。”

### 8.2 入口

Docs 页面内提供视图切换：

- 索引
- 连续阅读

### 8.3 内容结构

按照 Category 与 order 连续展开：

```text
01 Card-based Layout
   Mini Demo
   是什么
   适合场景
   Prompt

02 Masonry Layout
   Mini Demo
   是什么
   适合场景
   Prompt

03 Bento Grid
   ...
```

### 8.4 Sticky Sidebar

桌面端目录应随阅读位置更新 Active Pattern。

必须做到：

- 点击目录可跳转到对应 Pattern。
- 滚动后 Active 状态自动同步。
- 锚点被 Sticky Header 遮挡的问题需处理。
- 尊重 `prefers-reduced-motion`。

### 8.5 性能

Stream 不得在首屏一次激活全部 Full Demo。

原则：

- 初始内容静态 HTML 优先。
- 复杂交互 Demo 进入视口附近才激活，或仅显示 Mini 模式。
- Full Demo 通过“查看完整示例”进入 Detail。

---

## 9. Detail：Pattern 详情页

### 9.1 产品目标

回答：

> “这个 Pattern 到底怎么工作，什么时候该用，什么时候不该用？”

### 9.2 标准详情结构

每个 Detail 至少包含：

1. English Name。
2. 中文名称。
3. Category。
4. Summary。
5. Full Live Demo。
6. 是什么。
7. 适合场景。
8. 不适合场景 / 使用边界。
9. AI Prompt。
10. 相关 Pattern。
11. Source / Attribution。

增强内容（MVP 允许逐步补齐，但架构必须支持）：

- 常见变体。
- Accessibility Notes。
- Compare With。
- Do / Don’t。

### 9.3 Demo Stage

Full Demo 必须置于统一 Stage 中，而不是每个详情页自由发挥。

Stage 至少支持：

- Demo 名称。
- 交互区域。
- Reset。
- Desktop / Mobile 两种视口状态（MVP 可以是容器尺寸模拟）。

未来可扩展：

- Light / Dark。
- RTL。
- Reduced Motion。
- View Source。

### 9.4 Full Demo 要求

Full Demo 是**真的网页交互**，不是 GIF、视频或静态截图。

MVP 首批至少覆盖 10 个：

1. Card-based Layout
2. Masonry Layout
3. Bento Grid
4. Hero Section
5. Tabs
6. Modal
7. Drawer
8. Accordion
9. Lightbox
10. Command Palette

---

## 10. Compare：差异理解能力

MVP 的数据结构必须为 Compare 预留，但不要求 40 个词条全部完成对比正文。

优先对比关系：

- Drawer vs Modal
- Grid vs Flexbox
- Sidebar vs Drawer
- Tabs vs Segmented Control（后者可在未来加入词典）
- Pagination vs Infinite Scroll（后者可未来加入）
- Carousel vs Horizontal Scroll（后者可未来加入）

Compare 的价值不是重复定义，而是回答：

> “这两个看起来很像，我到底什么时候应该选哪个？”

---

## 11. 初始内容：40 个 Seed Patterns

### 11.1 Layout

1. Card-based Layout / 卡片式布局
2. Masonry Layout / 瀑布流
3. Bento Grid / 便当盒布局
4. Split-screen Layout / 分屏布局
5. CSS Grid Layout / CSS 网格布局
6. Flexbox / 弹性布局
7. Sidebar Layout / 侧边栏布局
8. Dashboard Layout / 仪表盘布局
9. Responsive Layout / 响应式布局
10. Full-bleed Layout / 全出血布局

### 11.2 Page Structure

11. Single-page Website / 单页网站
12. Multi-page Website / 多页网站
13. Landing Page / 落地页
14. Case Study Page / 案例研究页
15. Hero Section / 首屏
16. Feature Grid / 功能网格
17. Sticky Storytelling / 固定叙事区
18. Timeline / 时间线
19. FAQ Section / 常见问题区
20. Footer / 页脚

### 11.3 Navigation

21. Sticky Navbar / 固定导航
22. Hamburger Menu / 汉堡菜单
23. Breadcrumb / 面包屑
24. Anchor Link / 锚点跳转
25. Tabs / 标签切换
26. Sidebar Navigation / 侧边导航
27. Mega Menu / 超级菜单
28. Bottom Navigation / 底部导航
29. Pagination / 分页
30. Back to Top / 返回顶部

### 11.4 Components

31. Modal / 模态框
32. Drawer / 抽屉
33. Accordion / 手风琴
34. Tooltip / 气泡提示
35. Toast / 轻提示
36. Carousel / 轮播图
37. Lightbox / 图片灯箱
38. Form / 表单
39. Command Palette / 命令面板
40. Floating Action Button / 悬浮操作按钮

---

## 12. 内容结构规范

每个 Pattern 是一个独立知识实体，至少包含：

### 12.1 基础字段

- `title`：英文标准名。
- `titleZh`：中文名称。
- `slug`：稳定 URL key。
- `category`。
- `order`。
- `summary`。
- `tags`。
- `preview`：Preview Registry key。

### 12.2 教学内容

- 是什么。
- 适合场景。
- 不适合场景 / 边界。
- Prompt。

### 12.3 关系字段

- `related`。
- `compare`。

### 12.4 来源字段

- 来源作者。
- 原始 URL。
- 来源说明。

### 12.5 推荐内容文件形态

MVP 使用结构化 Content Collection + MDX，每个 Pattern 一份内容文件。

内容与 Demo 代码必须解耦，MDX 不应随意直接 import 任意交互组件。

---

## 13. Preview / Demo Registry

### 13.1 核心原则

内容层只声明：

`preview: drawer`

代码层通过统一 Registry 决定使用哪个 Demo 组件。

目标：

- 内容不会绑定组件路径。
- Demo 可以重构而无需批量修改 Markdown。
- 可验证所有 `preview` key 都存在。
- 本地 AI Agent 新增 Pattern 时有明确边界。

### 13.2 Mini / Full 两种模式

同一个 Demo 系列需要支持两个展示目标：

- `mini`：Gallery / Stream。
- `full`：Detail。

可以共享核心视觉结构，但 Full 才必须提供完整操作能力。

---

## 14. AI Prompt 规范

每个 Pattern 至少提供一个可直接复制的 Prompt。

Prompt 不应该只有：

> “给我做一个 Drawer。”

而应包含足够明确的：

- 结构位置。
- 行为。
- Desktop / Mobile 差异（适用时）。
- 必要的可访问性要求。
- 不应该出现的错误实现（适用时）。

MVP Prompt 应服务于通用 Coding Agent，不绑定特定厂商模型。

Copy 成功后使用非阻断式反馈（如 Toast / 状态文本）。

---

## 15. 搜索

### 15.1 搜索对象

搜索至少覆盖：

- English Name。
- 中文名称。
- Summary。
- Tags。
- Category。
- 正文关键词。

### 15.2 交互

- Header / Hero 提供 Search。
- 支持 `⌘ K` / `Ctrl K` 打开 Command Palette。
- 搜索结果可键盘上下选择、Enter 打开、Esc 关闭。
- 中文搜索必须可用。

### 15.3 静态搜索约束

MVP 不引入搜索后端。

推荐构建时生成静态索引，并由客户端加载轻量查询模块。

---

## 16. 视觉设计系统

### 16.1 设计关键词

**Warm Editorial × Digital Tool × Interactive Museum**

整体风格希望接近 Claude / Anthropic 所代表的温暖、克制、编辑感与人文感，但不得复制其具体品牌资产、Logo、页面或组件。

### 16.2 禁止的视觉方向

- 大面积紫蓝 AI 渐变。
- 过多玻璃拟态。
- 巨大圆角到处出现。
- 所有卡片统一浮起的大阴影。
- 复杂 3D 装饰掩盖内容。
- Marketing Landing Page 式大面积空 Hero。

### 16.3 色彩 Token 基线

- Canvas：`#F5F0E8`
- Surface：`#FBF8F2`
- Ink：`#272421`
- Muted：`#746E67`
- Border：`#DED6CA`
- Accent：`#C76D45`
- Accent Soft：`#ECD4C4`
- Secondary：`#7C876D`

这些是方向基线，可在设计实现中微调，但不能偏离暖米白 + charcoal + 陶土强调的整体语言。

### 16.4 Typography

- Editorial / Display Heading：Serif 气质。
- UI / 正文：清晰 Sans Serif。
- 英文术语必须拥有足够视觉权重。
- 中文负责解释，不应全部使用过度装饰性字体。

### 16.5 Spacing / Radius

- 建立统一 Token，不允许页面各自魔法数字。
- 主 Card 推荐 16px 左右圆角。
- Demo Stage 可略大。
- 小 Button 10–12px 左右。

### 16.6 Motion

- 普通反馈：约 160–220ms。
- Drawer：约 220–280ms。
- Modal：约 180–240ms。
- Hover 应优先让 Preview 内部产生轻量变化，而不是让整张 Card 大幅飞起。
- 必须支持 Reduced Motion。

---

## 17. 响应式要求

### 17.1 Gallery

- Desktop：多列 Grid。
- Tablet：列数降低。
- Mobile：单列或适合窄屏的紧凑卡片。
- Filter Chips 可横向滚动。

### 17.2 Docs

- Desktop Sidebar 常驻。
- Mobile Sidebar 转为可打开的导航 Drawer。

### 17.3 Stream

- Mobile 单列连续阅读。
- Sticky Sidebar 在移动端不应占据正文宽度。

### 17.4 Detail

- Full Demo Stage 不能导致页面横向滚动。
- Desktop / Mobile 切换控件触屏可操作。
- Copy Prompt 按钮在移动端仍容易触达。

---

## 18. Accessibility 基线

VibeLexicon 不能只“展示组件长什么样”，还应尽量示范正确交互。

MVP 核心要求：

- 所有主要操作可键盘完成。
- 可见 Focus State。
- Modal 正确处理 Focus、Esc、背景交互和关闭后的焦点归还。
- Tabs 支持合适的 ARIA 与键盘导航。
- Accordion 正确关联 trigger 与 panel。
- Drawer / Mobile Navigation 打开后处理背景滚动与焦点。
- Search / Command Palette 支持键盘操作。
- 图片 / 图形有合理替代文本策略。
- 尊重 `prefers-reduced-motion`。

---

## 19. 技术架构基线（MVP 已确认）

### 19.1 栈

- Astro
- TypeScript
- Vue 3（仅交互 Islands / Demo）
- `@astrojs/vue`
- Tailwind CSS v4 + 自定义 Design Tokens
- Astro Content Collections
- MDX
- Pagefind Extended（静态中文 / 英文搜索）
- Playwright
- pnpm
- GitHub Actions
- GitHub Pages

### 19.2 架构思想

强制遵守：

1. **Content First**：Pattern 数据 / 内容是核心资产。
2. **Static First**：默认静态 HTML，需要交互才 Hydrate。
3. **One Source, Four Views**：Gallery、Docs、Stream、Detail 共用同一 Pattern 数据源。
4. **Demo Registry**：内容层不能和组件文件路径强耦合。
5. **URL as Shareable State**：搜索 / 分类等可分享状态优先在 URL 中表达。

### 19.3 不允许

- 把整个网站实现为纯 Vue SPA。
- 为了 40 个卡片在首页一次性加载 40 个客户端 App。
- 引入数据库解决纯静态内容问题。
- 在四个页面复制维护四套 Pattern 数据。
- 将 Demo JSX/Vue 代码直接散落在 MDX 中形成不可维护依赖。

---

## 20. 推荐仓库结构

```text
VibeLexicon/
├── AGENTS.md
├── docs/
│   └── PRD.md
├── src/
│   ├── components/
│   │   ├── shell/
│   │   ├── gallery/
│   │   ├── docs/
│   │   ├── pattern/
│   │   └── search/
│   ├── content/
│   │   └── patterns/
│   ├── demos/
│   │   ├── registry.ts
│   │   └── ...
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── docs/
│   │   │   ├── index.astro
│   │   │   └── stream.astro
│   │   └── patterns/
│   │       └── [slug].astro
│   └── styles/
│       ├── tokens.css
│       └── global.css
├── scripts/
│   ├── utf8.ps1
│   └── validate-patterns.*
├── tests/
└── .github/
    └── workflows/
```

这是目标结构，不要求第一条 Issue 一次生成全部目录；目录应随对应能力出现。

---

## 21. Content Validator 要求

MVP 必须有自动校验能力，至少检查：

- `slug` 唯一。
- title / titleZh 基础完整性。
- category 在允许集合内。
- order 合法。
- `preview` key 可在 Registry 中解析。
- `related` 引用存在。
- `compare` 引用存在（若填写）。
- Source 基本结构合法。
- 构建时不允许出现无效内部 Pattern 链接。

该 Validator 应进入 CI。

---

## 22. SEO / URL

每个 Pattern 必须有稳定独立 URL：

`/patterns/drawer`

建议标题结构：

> Drawer 抽屉组件：示例、使用场景与 AI Prompt | VibeLexicon

页面至少提供：

- title。
- description。
- canonical。
- Open Graph 基础信息。

MVP 不要求复杂 SEO 自动化，但不能让所有 Pattern 只存在 JS 客户端状态中。

---

## 23. 性能预算与约束

目标不是追逐绝对分数，而是防止架构错误。

必须：

- 首页主体可静态生成。
- Gallery 非必要 Demo 不 Hydrate。
- Stream 不一次加载全部 Full Demo。
- 图片 Lazy Load（首屏关键图除外）。
- JS 仅为 Search、必要 Navigation 和真实交互 Demo 服务。
- 不依赖外部运行时 API 才能显示核心内容。

---

## 24. 测试策略

### 24.1 Build / Type

每次 PR 至少保证：

- 安装成功。
- Astro / TypeScript 检查通过。
- Content Validator 通过。
- Production Build 通过。

### 24.2 E2E Smoke

MVP 至少覆盖：

- 首页加载。
- Gallery Filter。
- Search 打开 / 查询 / 导航。
- Gallery → Docs 状态保持。
- Docs Sidebar。
- Stream 目录跳转 / Active 更新。
- Pattern Detail 可打开。
- Prompt Copy。
- Modal Demo。
- Drawer Demo。
- Tabs Demo。
- Mobile Navigation。

### 24.3 Accessibility Smoke

重点验证：

- Tab 顺序。
- Focus 可见。
- Esc 关闭行为。
- Modal / Drawer Focus Return。
- Reduced Motion 不出现明显冲突。

---

## 25. CI / CD

### 25.1 Pull Request CI

建议流水线：

```text
pnpm install --frozen-lockfile
→ lint / format check（若项目启用）
→ type / astro check
→ content validation
→ production build
→ Playwright smoke（可分阶段引入）
```

### 25.2 main

合并 main 后：

```text
build
→ Pagefind index
→ GitHub Pages deploy
```

### 25.3 发布目标

MVP 首发目标：GitHub Pages。

后续只有在出现明确 Edge / Server Function 需求后才讨论迁移 Cloudflare Pages / Vercel。

---

## 26. 内容与版权策略

VibeLexicon 的 Seed Content 起点来自对公开 UI 视觉词典文章的学习与整理，但公开站不能成为原文章镜像。

必须：

- 定义使用自己的语言重新整理。
- Demo 由本项目自己实现。
- Prompt 可基于概念重新编写。
- 每个来源可保留 Attribution。
- 不批量复制原作者图片作为核心资产。
- Source 字段保留原始链接，便于追溯。

目标是让 VibeLexicon 逐渐形成自己的知识结构与内容资产。

---

## 27. MVP 内容完成度

### 27.1 40 个 Pattern

全部必须：

- 可在 Gallery 找到。
- 可在 Docs 找到。
- 可在 Stream 找到。
- 有独立 Detail URL。
- 有基础文字内容。
- 有 Prompt。
- 有 Related。
- 有 Source。

### 27.2 10 个 Full Demo

必须完整交互。

其他 30 个允许 MVP 先使用高质量 Mini / Static Demo，但 Detail 页面仍必须可正常访问，且不能出现“404 / TODO 空白页”。

---

## 28. MVP 全局验收标准

### 产品

- [ ] Gallery、Docs、Stream、Detail 四种模式全部可达。
- [ ] 四种模式共享同一 Pattern 数据源。
- [ ] 40 个 Seed Pattern 全部存在。
- [ ] 至少 10 个 Full Demo 可真实操作。
- [ ] 中英文搜索可用。
- [ ] Prompt 可复制。
- [ ] Related Pattern 可跳转。
- [ ] Source 可追溯。

### UX

- [ ] Gallery 与 Docs 切换保持搜索 / 分类上下文。
- [ ] Stream 能整页连续阅读。
- [ ] Stream Active Sidebar 能随滚动更新。
- [ ] Detail 的 Live Demo 可 Reset。
- [ ] Mobile 四种模式均可使用。

### 视觉

- [ ] 使用统一 Design Tokens。
- [ ] Warm Editorial 方向一致。
- [ ] 不出现模板拼接感严重的页面。
- [ ] Mini Preview 能视觉表达词条含义。

### 工程

- [ ] Production build 通过。
- [ ] Content Validator 通过。
- [ ] 关键 Playwright Smoke 通过。
- [ ] GitHub Actions CI 可重复运行。
- [ ] main 可部署 GitHub Pages。
- [ ] 无数据库 / 后端运行依赖。

### Accessibility

- [ ] Header / Search / Docs 导航可键盘操作。
- [ ] 关键 Demo 有合理 ARIA / Focus 行为。
- [ ] 支持 Reduced Motion。

---

## 29. MVP 后续路线（不属于当前交付范围）

### v0.2：知识关系

- Compare。
- Similar。
- Use Instead。
- Do Not Use When。
- Accessibility 内容扩充。
- Full Demo 扩展至 25+。

### v0.3：探索与学习

- 收藏（可先 localStorage）。
- Recently Viewed。
- Random Pattern。
- Learning Path。
- Pattern Collection。

### v0.4：AI-native 组合

用户输入：

> “我想做一个 SaaS Dashboard。”

系统组合推荐：

- Dashboard Layout
- Sidebar Navigation
- Card Layout
- Tabs
- Toast
- Modal
- Command Palette

并生成组合 Prompt。

---

## 30. 决策记录（MVP 已锁定）

以下决策除非通过新的 Issue / ADR 明确修改，否则视为 MVP 固定约束：

1. 项目名：VibeLexicon。
2. 默认首页：Gallery，而不是传统 Marketing Landing Page。
3. 四种体验：Gallery / Docs / Stream / Detail。
4. Stream 属于 Docs 的阅读模式。
5. 同一 Content Source 驱动四种界面。
6. 默认静态生成，交互按 Island 激活。
7. Demo 通过 Registry 与内容解耦。
8. Astro + TypeScript 为主框架。
9. Vue 3 仅承载必要互动组件 / Demo。
10. Tailwind CSS v4 + 自定义 Token 构建设计系统。
11. Content Collections + MDX 管理 Pattern。
12. Pagefind Extended 负责静态搜索。
13. Playwright 负责关键端到端行为验证。
14. pnpm 作为包管理器。
15. GitHub Actions + GitHub Pages 作为 MVP CI/CD 与部署方案。
16. MVP 不引入数据库、账号、CMS 或服务器后端。
17. 初始 40 个 Seed Pattern。
18. 至少 10 个 Full Interactive Demo。
19. 设计方向为 Warm Editorial × Digital Tool × Interactive Museum。
20. 公开内容以重新整理与自主 Demo 为主，保留来源 Attribution，不做原文章镜像。
