import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    // The web package's import aliases (packages/web/tsconfig.json).
    alias: {
      "@shared": path("./shared"),
      "@": path("./packages/web"),
    },
  },
  test: {
    // Pure logic only (no DOM): shared/ and the web package's lib/ and hook helpers.
    include: ["shared/**/*.test.ts", "packages/web/{lib,hooks}/**/*.test.ts"],
    environment: "node",
  },
});
