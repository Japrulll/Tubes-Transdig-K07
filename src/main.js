import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { syncContent } from './stores/content'
import { initAuth } from './stores/auth'

createApp(App).use(router).mount('#app')

// Pulihkan sesi login lalu sinkronkan progres
initAuth()

// Ambil konten terbaru dari Supabase (dataset bawaan dipakai bila database belum diperbarui)
syncContent()
window.addEventListener('online', syncContent)

// Mode offline sudah dihapus: lepas service worker & cache lama yang masih terpasang di browser
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {})
}
if ('caches' in window) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {})
