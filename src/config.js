// Konfigurasi publik aplikasi.
// Kunci "anon/publishable" Supabase memang dirancang untuk dipakai di sisi klien;
// keamanan data dijaga oleh Row Level Security (hanya-baca untuk konten).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://diyjdxwjuparfmdrqxcp.supabase.co'
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VJcmNLdLSqd3VbqcSyxI9A_3xpIEuYd'

// URL publik aplikasi (GitHub Pages) — dipakai untuk isi QR code di papan spot,
// sehingga kamera ponsel biasa pun membuka SETARA langsung ke POI tersebut.
export const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_URL || 'https://japrulll.github.io/Tubes-Transdig-K07/'

// Parameter geofence (PRD §4.2)
export const GEO = {
  maxAccuracyM: 30, // pembacaan lebih buruk dari 30 m diabaikan
  hysteresisM: 10, // reset status "di dalam" setelah keluar radius + 10 m
  approachExtraM: 35, // tampilkan state "mendekati" bila jarak ≤ radius + 35 m
  updateMs: 3000, // target pembaruan ±3 detik
}
