import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          ...process.env,
          NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:3200/__test-api",
          NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyD-e2e-public-test-key",
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: "study-hub-e2e",
          NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:e2e",
          NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS: "fuji.waseda.jp,suou.waseda.jp",
        },
      },
});
