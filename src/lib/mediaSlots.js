// Slot foto yang dibundel di aplikasi (public/media). Daftar berkas dibuat oleh
// scripts/import-media.mjs → src/data/media.json. Slot kosong memakai ilustrasi.
//   foto/p05_1, foto/p05_2   → foto spot (2 per spot)
//   onboarding/1 … /3        → slide pengenalan
//   trail/t01, trail/t02     → sampul Wellness Trail
import manifest from '../data/media.json'

const BASE = import.meta.env.BASE_URL || './'
const files = manifest.files || {}
const url = (key, suffix = '') => `${BASE}media/${key}${suffix}.webp`

export function slotImage(key) {
  const f = files[key]
  return f ? { url: url(key), thumb: f.thumb ? url(key, '-thumb') : url(key), credit: f.credit || null, w: f.w, h: f.h } : null
}

export function bundledPhotos(poiId) {
  const id = String(poiId).toLowerCase()
  return [1, 2].map((n) => slotImage(`foto/${id}_${n}`)).filter(Boolean)
}

export const photoCredits = () =>
  Object.entries(files)
    .filter(([, f]) => f.credit)
    .map(([key, f]) => ({ key, credit: f.credit }))
