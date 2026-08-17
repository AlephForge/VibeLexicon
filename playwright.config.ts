import { defineConfig, devices } from '@playwright/test';

/**
 * VibeLexicon QA（Issue #15）：Playwright MVP Smoke 与关键交互回归套件。
 *
 * - 静态 SSG：先 `pnpm build`（含 pagefind 后处理），再起 `astro preview`。
 * - Windows 下 `astro preview` 默认绑定 localhost（可能解析为 ::1），
 *   必须 `--host 127.0.0.1` 才能经 `http://127.0.0.1:4321` 访问。
 * - baseURL 与 astro.config.mjs 的 `base: '/VibeLexicon/'` 保持一致；
 *   测试内只写相对路径（如 `/docs/`）。
 * - `reuseExistingServer: true`：本地已起 preview 的场合直接复用。
 */
export default defineConfig({
  testDir: './tests',
  // 生产构建产物 + preview server（需先 pnpm build）
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4321/VibeLexicon',
    trace: 'on-first-retry',
    // Detail 页「复制 Prompt」使用 navigator.clipboard（127.0.0.1 为安全上下文），
    // 显式授予剪贴板写权限，避免 headless 下 NotAllowedError。
    permissions: ['clipboard-write'],
  },
  webServer: {
    command: 'pnpm preview --host 127.0.0.1',
    url: 'http://127.0.0.1:4321/VibeLexicon/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});