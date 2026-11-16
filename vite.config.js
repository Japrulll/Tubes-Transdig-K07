import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Path relatif: build yang sama berjalan di GitHub Pages (subpath) dan Capacitor (.apk)
  base: './',
  plugins: [vue(), tailwindcss()],
  server: { host: true },
  build: {
    chunkSizeWarningLimit: 900,
  },
})
