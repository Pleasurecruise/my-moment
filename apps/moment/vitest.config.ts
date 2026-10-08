import { defineConfig } from "vite-plus";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "solid-js/store": "solid-js",
      "solid-js/web": "@solidjs/web",
      "~": resolve(import.meta.dirname, "src"),
    },
  },
});
