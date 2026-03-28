import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@test": resolve(__dirname, "test"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    env: {
      AIRAILS_SECRET: "test-secret",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        branches: 70,
        functions: 75,
        lines: 75,
        statements: 75,
      },
    },
  },
});
