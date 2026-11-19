// SETARA service worker — A02 Mode Offline
// - Aplikasi (HTML/JS/CSS/gambar): cache-first setelah kunjungan pertama
// - Konten Supabase: network-first, jatuh ke cache saat offline
// - Tile peta & font: stale-while-revalidate (tile yang pernah dilihat tersedia offline)
const VERSION = 'setara-v3'
const APP = `${VERSION}-app`
const RUNTIME = `${VERSION}-runtime`
const TILES = `${VERSION}-tiles`

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(APP).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './favicon.svg']).catch(() => {})))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

// Halaman mengirim daftar aset yang sudah dimuat agar langsung tersimpan
self.addEventListener('message', (e) => {
  if (e.data?.type !== 'CACHE_URLS') return
  const urls = (e.data.urls || []).filter((u) => u.startsWith(self.location.origin) || /tile\.openstreetmap|fonts\.(googleapis|gstatic)/.test(u))
  e.waitUntil(
    caches.open(APP).then((c) => Promise.all(urls.map((u) => c.add(new Request(u, { mode: u.startsWith(self.location.origin) ? 'same-origin' : 'no-cors' })).catch(() => {}))))
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (url.hostname.endsWith('supabase.co')) {
    e.respondWith(networkFirst(req, RUNTIME))
    return
  }
  if (url.hostname.includes('tile.openstreetmap')) {
    e.respondWith(staleWhileRevalidate(req, TILES, 600))
    return
  }
  if (url.hostname.startsWith('fonts.')) {
    e.respondWith(staleWhileRevalidate(req, RUNTIME))
    return
  }
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') e.respondWith(networkFirst(req, APP, './index.html'))
    else e.respondWith(cacheFirst(req, APP))
  }
})

async function cacheFirst(req, name) {
  const hit = await caches.match(req, { ignoreVary: true })
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) (await caches.open(name)).put(req, res.clone())
  return res
}

async function networkFirst(req, name, fallbackUrl) {
  try {
    const res = await fetch(req)
    if (res.ok) (await caches.open(name)).put(req, res.clone())
    return res
  } catch {
    return (await caches.match(req, { ignoreVary: true })) || (fallbackUrl && (await caches.match(fallbackUrl, { ignoreVary: true }))) || Response.error()
  }
}

async function staleWhileRevalidate(req, name, maxEntries) {
  const cache = await caches.open(name)
  const hit = await cache.match(req, { ignoreVary: true })
  const net = fetch(req)
    .then(async (res) => {
      if (res.ok || res.type === 'opaque') {
        await cache.put(req, res.clone())
        if (maxEntries) {
          const keys = await cache.keys()
          if (keys.length > maxEntries) await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)))
        }
      }
      return res
    })
    .catch(() => hit)
  return hit || net
}
