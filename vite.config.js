import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  server: {
    proxy: {
      // any request to /api/* will be forwarded to Django on :8000
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
