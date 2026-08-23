import { resolve } from "node:path";
import { defineConfig } from "vite-plus";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      "solid-js/store": "solid-js",
      "solid-js/web": "@solidjs/web",
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      external: ["solid-js", "@solidjs/web"],
    },
  },
});
