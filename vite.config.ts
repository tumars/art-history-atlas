import { defineConfig } from "vite";

// GitHub Pages 部署在 /<仓库名>/ 下，用相对路径最省事，任何子路径都能用
export default defineConfig({
  base: "./",
  build: { outDir: "dist", assetsInlineLimit: 0 },
});
