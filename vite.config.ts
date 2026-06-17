import { defineConfig } from "vite"

export default defineConfig({
  base: "./",
  build: {
    target: "es2015",
    modulePreload: false,
    outDir: "dist",
    rollupOptions: {
      output: {
        format: "iife",
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash][extname]",
      },
    },
  },
  esbuild: {
    supported: {
      "top-level-await": true,
    },
  },
})
