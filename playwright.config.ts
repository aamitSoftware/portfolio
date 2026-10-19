import { defineConfig, devices } from '@playwright/test';

// Tests run against the production build, served the way Vercel serves it (see scripts/serve-static.mjs).
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4322' },
  webServer: {
    command: 'node scripts/serve-static.mjs .vercel/output/static 4322',
    url: 'http://localhost:4322',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
