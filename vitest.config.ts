import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Unit tests only; Playwright e2e specs under tests/e2e run via `pnpm test:e2e`.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
