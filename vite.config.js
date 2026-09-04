import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ jsxRuntime: "automatic" })],
  esbuild: {
    jsx: "automatic"
  },
  root: ".",
  publicDir: "public",
  server: {
    host: true,
    port: 5173,
    open: true
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: false,
    cssCodeSplit: false,
    sourcemap: false,
    target: "es2019",
    cssMinify: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/main.min.js",
        chunkFileNames: "assets/[name].min.js",
        assetFileNames: (assetInfo) =>
          assetInfo.name && assetInfo.name.endsWith(".css")
            ? "assets/main.min.css"
            : "assets/[name]-[hash][extname]"
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      }
    }
  }
});
