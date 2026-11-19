// Umpan balik ANONIM ke Supabase (rating, laporan info salah, hasil kuis, pertanyaan yang belum
// terjawab Kia). Tabel hanya-tulis: aplikasi tidak bisa membaca kembali, tidak ada ID perangkat,
// tidak ada lokasi. Saat offline, baris disimpan di antrean lokal lalu dikirim ketika online.
import { load, save } from './storage'
import { getSupabase, supabaseEnabled } from './supabase'

const KEY = 'outbox'
const TABLES = ['visitor_rating', 'content_report', 'quiz_result', 'kia_question_log']
let queue = load(KEY, [])
let flushing = false

export function sendFeedback(table, row) {
  if (!TABLES.includes(table)) return
  queue.push({ table, row })
  queue = queue.slice(-200)
  save(KEY, queue)
  flush()
}

export async function flush() {
  if (flushing || !queue.length || !supabaseEnabled) return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return
  flushing = true
  try {
    const sb = await getSupabase()
    while (queue.length) {
      const table = queue[0].table
      const batch = queue.filter((x) => x.table === table).slice(0, 25)
      const { error } = await sb.from(table).insert(batch.map((x) => x.row))
      // Galat jaringan → coba lagi nanti. Galat database (mis. tabel belum dimigrasi,
      // data tidak lolos validasi) → buang agar antrean tidak macet.
      if (error && !error.code) break
      queue = queue.filter((x) => !batch.includes(x))
      save(KEY, queue)
    }
  } catch {
    /* jaringan tidak tersedia */
  } finally {
    flushing = false
  }
}

export const pendingFeedback = () => queue.length

if (typeof window !== 'undefined') {
  window.addEventListener('online', flush)
  setTimeout(flush, 4000)
}
