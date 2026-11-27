import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: "http://localhost:5174",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5174/course/",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
