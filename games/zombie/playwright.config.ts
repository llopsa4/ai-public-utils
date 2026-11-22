import { defineConfig } from '@playwright/test';

// Smoke test (TESTING.md): Playwright starts its own dev server on port 5185.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:5185', viewport: { width: 1280, height: 720 } },
  webServer: {
    command: 'npm run dev -- --port 5185 --strictPort',
    url: 'http://127.0.0.1:5185/',
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
