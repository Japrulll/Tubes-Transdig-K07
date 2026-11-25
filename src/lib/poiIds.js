// ID POI yang pernah berganti. QR/tautan yang sudah dicetak, stempel, dan progres lama
// tetap memakai ID lama, jadi semua pencarian POI melewati peta ini.
//   P12 → P10 : Musala & Toilet (dipindah ke P10 pada 24 Nov 2026)
//   P04       : Kampung Korea, sudah tidak ditampilkan (tutup permanen)
export const POI_ALIASES = { P12: 'P10' }
export const RETIRED_POIS = { P04: 'Kampung Korea sudah tutup permanen, jadi spot ini tidak lagi ada di SETARA.' }

/** ID resmi untuk sebuah ID (lama maupun baru), huruf besar */
export function canonicalPoiId(id) {
  const s = String(id || '').trim().toUpperCase()
  return POI_ALIASES[s] || s
}

/** Ganti kunci objek ber-ID lama ke ID baru (stempel, bintang per spot) */
export function migrateKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj
  let changed = false
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    const c = canonicalPoiId(k)
    if (c !== k) changed = true
    if (!(c in out) || c === k) out[c] = v
  }
  return changed ? out : obj
}

/** Ganti ID lama dalam daftar ID */
export const migrateList = (list) => (Array.isArray(list) ? [...new Set(list.map(canonicalPoiId))] : list)
