import { PUBLIC_APP_URL } from '../config'

/** Ambil ID POI dari isi QR: "SETARA:POI:P04" (kolom poi.qr_code), URL ".../#/qr/P04", atau "P04" */
export function parsePoiCode(text) {
  const s = String(text || '').trim()
  const m = s.match(/(?:SETARA:(?:POI:)?|#\/qr\/|#\/poi\/|^)(P\d{2})\b/i)
  return m ? m[1].toUpperCase() : null
}

/** Isi QR untuk papan spot: URL sehingga kamera ponsel biasa pun membuka SETARA */
export const qrPayload = (poiId) => `${PUBLIC_APP_URL.replace(/\/?$/, '/')}#/qr/${poiId}`
