import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: ["dist/**", "build/**", ".wrangler/**"],
  },
  fmt: {
    indent: "tab",
    ignorePatterns: ["dist/**", "build/**", ".wrangler/**"],
  },
});
