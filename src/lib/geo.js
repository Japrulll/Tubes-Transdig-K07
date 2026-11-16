// Perhitungan lokasi — seluruhnya dijalankan di perangkat (A03).

const R = 6371000
const toRad = (d) => (d * Math.PI) / 180
const toDeg = (r) => (r * 180) / Math.PI

/** Jarak Haversine dalam meter. a, b: {lat, lng} */
export function haversine(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Arah (0–360°, 0 = utara) dari a ke b */
export function bearing(a, b) {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng))
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

const CARDINAL = ['utara', 'timur laut', 'timur', 'tenggara', 'selatan', 'barat daya', 'barat', 'barat laut']
export const cardinal = (deg) => CARDINAL[Math.round(deg / 45) % 8]

/** Instruksi belok relatif terhadap arah hadap pengguna */
export function turnInstruction(targetBearing, heading) {
  if (heading == null || Number.isNaN(heading)) return `Menuju arah ${cardinal(targetBearing)}`
  const rel = ((targetBearing - heading + 540) % 360) - 180 // -180..180
  const a = Math.abs(rel)
  if (a <= 20) return 'Lurus terus'
  if (a >= 150) return 'Putar balik'
  const side = rel > 0 ? 'kanan' : 'kiri'
  return a < 60 ? `Serong ${side}` : `Belok ${side}`
}

// Kecepatan jalan kaki ±4,2 km/jam
export const WALK_M_PER_MIN = 70
export const walkMinutes = (m) => Math.max(1, Math.round(m / WALK_M_PER_MIN))

export function formatDistance(m) {
  if (m == null || Number.isNaN(m)) return '–'
  if (m < 1000) return `${Math.round(m / 5) * 5 || Math.round(m)} m`
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`
}

export function formatKm(m) {
  return (m / 1000).toFixed(m < 10000 ? 2 : 1).replace('.', ',')
}

export function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}j ${String(m).padStart(2, '0')}m`
  return `${m}m`
}

export function formatClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  return `${h ? h + ':' : ''}${mm}:${String(sec).padStart(2, '0')}`
}

/** Titik di sekitar `p` berjarak `m` meter pada arah `deg` (untuk simulasi) */
export function offset(p, m, deg) {
  const d = m / R
  const br = toRad(deg)
  const lat1 = toRad(p.lat)
  const lng1 = toRad(p.lng)
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(br))
  const lng2 = lng1 + Math.atan2(Math.sin(br) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2))
  return { lat: toDeg(lat2), lng: toDeg(lng2) }
}

// Hanya koordinat tujuan (POI) yang dikirim; asal rute ditentukan Google Maps
// sendiri di perangkat sehingga posisi pengguna tidak ikut di URL (A03).
export const googleMapsWalkUrl = (to) =>
  `https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=${to.lat},${to.lng}`
