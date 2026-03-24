import { defineConfig, devices } from "@playwright/test";

const E2E_PORT = 3001;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? "50%" : undefined,
  reporter: "html",
  timeout: process.env.CI ? 60000 : 30000,
  expect: {
    timeout: process.env.CI ? 15000 : 5000,
  },
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: "on-first-retry",
    actionTimeout: process.env.CI ? 15000 : 5000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `NODE_ENV=test vite dev --port ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: "test",
      BETTER_AUTH_URL: `http://localhost:${E2E_PORT}`,
    },
  },
});
