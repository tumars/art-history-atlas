import { defineConfig } from "vite";

// 两个发布站点共用此子路径，绝对路径兼容入口末尾没有斜杠的访问。
export default defineConfig({
  base: "/art-history-atlas/",
  build: { outDir: "dist", assetsInlineLimit: 0 },
});
