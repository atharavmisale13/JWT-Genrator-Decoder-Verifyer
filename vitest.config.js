import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",

    // Run only backend unit and integration tests
    include: ["server/src/**/*.test.js"],

    // Never run Playwright tests through Vitest
    exclude: [
      "node_modules/**",
      "tests/e2e/**",
    ],
  },
});