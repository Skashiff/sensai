import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: {
    "@": fileURLToPath(new URL(".", import.meta.url)),
    "server-only": fileURLToPath(new URL("./tests/stubs/server-only.js", import.meta.url)),
  } },
  oxc: { jsx: { runtime: "automatic" } },
  test: { environment: "jsdom", include: ["tests/**/*.test.{js,jsx}"], setupFiles: ["./tests/setup.js"], clearMocks: true },
});
