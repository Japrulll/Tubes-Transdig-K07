import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { syncContent } from './stores/content'
import { initAuth } from './stores/auth'

createApp(App).use(router).mount('#app')

// Pulihkan sesi login (juga menyelesaikan login Google setelah redirect) lalu sinkronkan progres
initAuth()

// Ambil konten terbaru dari Supabase (dataset bawaan tetap jadi cadangan offline)
syncContent()
window.addEventListener('online', syncContent)

// A02 Mode Offline: service worker menyimpan aplikasi, konten, dan tile peta yang pernah dibuka.
const isNative = !!window.Capacitor?.isNativePlatform?.()
if (import.meta.env.PROD && !isNative && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
      await navigator.serviceWorker.ready
      const urls = [location.href.split('#')[0], ...performance.getEntriesByType('resource').map((e) => e.name)]
      ;(reg.active || navigator.serviceWorker.controller)?.postMessage({ type: 'CACHE_URLS', urls })
    } catch {
      /* SW tidak tersedia */
    }
  })
}
