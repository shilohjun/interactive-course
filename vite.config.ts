import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.BASE_PATH ?? "/course/",
  plugins: [react()],
  server: { port: 5174 },
  preview: { port: 5174 },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: false,
    exclude: ["node_modules/**", "dist/**", "e2e/**", "test-results/**"],
  },
});
