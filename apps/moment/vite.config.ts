import { defineConfig } from "vite-plus";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import devServer from "@hono/vite-dev-server";
import cloudflareAdapter from "@hono/vite-dev-server/cloudflare";
import { resolve } from "node:path";

const srcDir = resolve(import.meta.dirname, "src");

export default defineConfig({
  resolve: {
    alias: {
      "~": srcDir,
    },
  },
  plugins: [
    tanstackRouter({
      target: "solid",
    }),
    tailwindcss(),
    solid(),
    devServer({
      entry: "worker.ts",
      exclude: [/^(?!\/api(?:\/|$)).*/],
      adapter: cloudflareAdapter,
    }),
  ],
  server: {
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
  },
});
