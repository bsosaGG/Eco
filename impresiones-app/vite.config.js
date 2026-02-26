import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/impresiones/',
  plugins: [
    vue(),
    tailwindcss(),
  ],
  server: {
    port: 5174, // O el que tengas libre (solo para desarrollo local si no se usa docker-compose directo al inicio)
  }
})
