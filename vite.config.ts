import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 0.0.0.0
    port: 5173,
    proxy: {
      "/telegram": {
        target: "https://api.telegram.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/telegram/, ""),
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
  },
});
