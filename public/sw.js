// SETARA tidak lagi memakai mode offline. Berkas ini tetap ada agar service worker lama di
// ponsel pengguna terganti oleh versi ini, yang menghapus semua cache lalu melepas dirinya.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach((c) => c.navigate(c.url))
    })()
  )
})
