import { defineConfig, devices } from '@playwright/test';

/**
 * PT-002: Independent Browser E2E Testing Foundation Configuration.
 *
 * Controlled Playwright harness for runtime verification:
 * - Single worker (deterministic, avoids race conditions)
 * - fullyParallel: false
 * - Chromium browser project
 * - Real Vite dev server (http://localhost:5173) with automatic launch/reuse
 * - Screenshots, video, trace retained on failure
 * - HTML & list reporters
 * - Zero API/frontend mocking for production-critical flows
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter api start:dev',
      url: 'http://localhost:3000/api/v1/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'pnpm --filter web dev --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
