import { defineConfig, lazyPlugins } from "vite-plus";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { voidPlugin } from "void";
import { resolve } from "node:path";

export default defineConfig(({ command }) => ({
  envDir: command === "build" ? ".void/build-env" : ".",
  resolve: {
    alias: {
      "~": resolve(import.meta.dirname, "src"),
    },
  },
  optimizeDeps: {
    exclude: ["hono"],
  },
  plugins: lazyPlugins(() => [
    ...voidPlugin(),
    ...[tanstackRouter({ target: "solid" })].flat(),
    ...tailwindcss(),
    solid(),
  ]),
  server: {
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
  },
}));
