import { defineConfig, devices } from '@playwright/test';

// Browser smoke test against the Vite dev server (see TESTING.md). `npm run e2e` starts the server.
// Not the dev port (5174), so a running `npm run dev` does not collide.
const PORT = 5184;
// Headless Chromium renders WebGL in software, so game timers crawl. On Windows, use the GPU through
// ANGLE/Direct3D; elsewhere the defaults apply.
const GPU = process.platform === 'win32' ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [];

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}/`, viewport: { width: 1280, height: 720 } },
  webServer: {
    command: 'npm run dev -- --port 5184 --strictPort',
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 }, launchOptions: { args: GPU } } }],
});
