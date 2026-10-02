import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // La app se sirve bajo /plan-medios/ (nginx del core), igual que /adquisiciones/.
  base: '/plan-medios/',
  server: {
    // Desarrollo local: el API del core corre en :3000
    proxy: { '/api': 'http://localhost:3000' },
  },
})
