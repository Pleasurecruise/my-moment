import { defineConfig } from "vite-plus";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import devServer from "@hono/vite-dev-server";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "solid",
    }),
    tailwindcss(),
    solid(),
    devServer({
      entry: "worker.ts",
      exclude: [/^(?!\/api(?:\/|$)).*/],
    }),
  ],
  server: {
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
  },
});
