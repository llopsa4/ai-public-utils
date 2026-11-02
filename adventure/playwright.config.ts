import { defineConfig, devices } from '@playwright/test';

// End-to-end tests against the published build (index.html + build/), served like GitHub Pages.
// Run `npm run build` first; `npm run e2e` does both.
const PORT = 4183;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}/adventure/`,
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'node scripts/serve.mjs',
    env: { PORT: String(PORT) },
    url: `http://127.0.0.1:${PORT}/adventure/`,
    reuseExistingServer: false,
  },
  projects: [
    { name: 'desktop', testMatch: /playthrough|saves|crowd|fight/, use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'phone', testMatch: /mobile/, use: { ...devices['Pixel 7'] } },
  ],
});
