import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  publicDir: "public",
  server: {
    host: true,
    port: 5173,
    open: true
  },
  build: {
    outDir: "dist-vite",
    assetsDir: "assets",
    sourcemap: false,
    target: "es2019"
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      }
    }
  }
});
