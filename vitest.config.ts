import { defineConfig } from "vitest/config";

export default defineConfig({
  // Dev tools exist in test builds (see apps/web/vite.config.ts); the flag is off unless a URL asks for it.
  define: { __DEV_TOOLS__: true, __DEV_TOOLS_FORCED__: false },
  test: {
    include: ["packages/*/src/**/*.test.ts", "apps/*/src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**", "apps/*/src/**"],
    },
  },
});
