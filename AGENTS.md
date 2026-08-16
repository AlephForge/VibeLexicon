# VibeLexicon Agent Engineering Contract

本文件是本仓库内 AI Agent / Coding Agent 的执行约束。任何自动化开发、代码生成、重构或审查开始前，都必须先阅读：

1. `AGENTS.md`
2. `docs/PRD.md`
3. 当前正在执行的 GitHub Issue 及其依赖 Issue

如果 Issue 与 `docs/PRD.md` 冲突，不得自行选择其中一方；应停止扩大实现范围，并在 PR 中明确指出冲突。除非存在新的已批准决策，MVP 以 `docs/PRD.md` 的“决策记录”作为产品与架构基线。

---

## 1. MVP 不可破坏的五条架构原则

### Content First

Pattern 内容是核心资产。页面只是同一份内容数据的不同视图。

### Static First

默认输出静态 HTML。只有需要真实客户端交互的区域才 Hydrate。

### One Source, Four Views

Gallery、Docs、Stream、Detail 必须共享同一个 Pattern Content Source，禁止复制维护四套数据。

### Demo Registry

内容文件只引用稳定的 Preview/Demo key，禁止与任意组件文件路径强耦合。

### URL as Shareable State

搜索词、分类等可分享状态优先通过 URL 表达；不要只放在内存 Store 中。

---

## 2. MVP 技术基线

已确认：

- Astro
- TypeScript
- Vue 3（仅交互 Islands / Demo）
- `@astrojs/vue`
- Tailwind CSS v4 + 自定义 Design Tokens
- Astro Content Collections
- MDX
- Pagefind Extended
- Playwright
- pnpm
- GitHub Actions
- GitHub Pages

未经明确 Issue / ADR 批准，不得擅自替换主框架、引入数据库、引入运行时后端或改造成 SPA。

---

## 3. 多 Agent 协作要求

当执行一个可以合理拆分的 Issue 时，优先使用多个 Agent 并发处理独立工作，但必须遵守：

- 先拆清职责，再并行。
- 不允许多个 Agent 同时修改同一文件或同一逻辑区域。
- 一个 Agent 负责实现时，另一个 Agent 可以负责测试、内容校验、可访问性检查或代码审查。
- 并行分支 / 工作树必须有清晰边界。
- 最终必须由一个 Integration / Review Agent 统一整合并运行完整验证。
- 不以“并行”为目标牺牲依赖顺序；强依赖工作必须串行。

推荐角色：

- Architecture / Integration Agent：守住 PRD 与跨模块约束。
- UI Agent：页面结构、响应式、设计 Token。
- Content Agent：Pattern 内容、Schema、关系与来源。
- Demo Agent：Mini / Full Demo。
- QA Agent：测试、可访问性、性能、构建与回归。

具体角色数量按 Issue 规模调整。

---

## 4. Issue 执行协议

每次只以一个 GitHub Issue 作为当前工作单元。

开始前：

1. 阅读 Parent Issue。
2. 阅读当前 Sub-Issue。
3. 阅读它声明的依赖 Issue。
4. 确认依赖已完成或当前 Issue 明确允许并行。
5. 阅读相关现有代码，不得根据 Issue 中的文件名猜测代码状态。

开发中：

- 不擅自增加 PRD 明确排除的功能。
- 不把后续 Issue 的范围提前塞入当前 Issue。
- 如果必须建立后续能力所需接口，只建立最小稳定边界，不实现后续功能。
- 任何共享抽象都必须有当前实际使用场景，避免预先设计大量未来框架。

完成前：

- 对照 Issue 验收标准逐条验证。
- 运行 Issue 指定的检查。
- 至少运行 production build（在工程初始化完成后）。
- 改交互必须有对应测试或明确的手工验证记录。
- 改内容模型必须运行 Content Validator。
- 改 Demo 必须检查键盘、Focus、Reduced Motion（适用时）。

---

## 5. 设计约束

视觉方向：

**Warm Editorial × Digital Tool × Interactive Museum**

必须保持：

- 暖米白基底。
- Charcoal 正文。
- 克制陶土强调色。
- Serif Display + Sans UI 的编辑感。
- 清晰 Border / Spacing 建立层级。
- 动效优先发生在 Preview 内，而不是整张 Card 大幅移动。

避免：

- 紫蓝 AI 渐变模板感。
- 过量 Glassmorphism。
- 全局夸张阴影。
- 巨大空 Hero。
- 大量没有信息价值的装饰动画。

页面“漂亮”不能以牺牲信息扫描效率、可访问性或性能为代价。

---

## 6. Content / Demo 边界

Pattern Content：

- 名称、分类、顺序、定义、使用场景、Prompt、关系、来源等。

Demo：

- 负责把 Pattern 的视觉 / 交互行为展示出来。

Content 不应包含具体组件 import。

Demo 不应硬编码 Pattern 的完整知识正文。

Gallery / Stream 使用 Mini 表达；Detail 使用 Full 表达。能共享结构时共享，但不要为了“复用”制造巨大的条件分支组件。

---

## 7. 性能约束

禁止：

- Gallery 首屏 Hydrate 40 个 Demo。
- Stream 首屏加载全部 Full Demo。
- 为核心内容增加运行时 API 依赖。
- 用大型客户端状态框架解决 URL Query 能解决的问题。

优先：

- Astro 静态页面。
- CSS / 静态 DOM Mini Preview。
- Vue Island 按需激活。
- 视口附近 Lazy Hydration。
- 构建时搜索索引。

---

## 8. Accessibility 是功能要求

特别是 Modal、Drawer、Tabs、Accordion、Command Palette 等 Demo：

- 不只追求“看起来像”。
- 必须尽量展示正确键盘行为、Focus 状态与语义结构。
- Esc、Focus Return、ARIA 等应按组件性质正确处理。
- 所有 Motion 尊重 `prefers-reduced-motion`。

---

## 9. 内容版权与来源

Seed Content 可以借鉴公开资料中的术语范围与知识启发，但：

- 定义应重新整理。
- Demo 自主实现。
- Prompt 自主编写。
- 不批量复制来源图片。
- 保留可追溯 Source / Attribution。

VibeLexicon 必须形成自己的知识结构，而不是外部文章镜像。

---

## 10. 提交与 PR

推荐：一个 Sub-Issue 对应一个独立分支 / PR，除非 Issue 本身明确要求组合交付。

PR 描述至少包含：

- 关联 Issue。
- 完成内容。
- 明确未包含的范围。
- 验证命令与结果。
- UI 变更的截图 / 录屏（进入 UI 实现阶段后）。
- 剩余已知风险。

不要把无关重构、格式化全仓库或依赖升级混入功能 PR。
