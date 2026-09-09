import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    // Node by default; UI specs opt in with a `@vitest-environment jsdom` docblock.
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["{app,components,lib}/**/*.test.{ts,tsx}"],
  },
});
