import { defineConfig } from "vite"

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
  },
  esbuild: {
    keepNames: false,
    supported: {
      "top-level-await": true,
    },
  },
})
