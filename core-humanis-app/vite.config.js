import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// Configuración de Vite según Modalidad B de denuncias-scsp
export default defineConfig({
  base: "/core-humanis/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      clientPort: 8080,
    },
    proxy: {
      "/api": {
        target: "http://core_humanis_api:5000",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
});

