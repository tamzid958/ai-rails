import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env["DASHBOARD_URL"] ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
});
