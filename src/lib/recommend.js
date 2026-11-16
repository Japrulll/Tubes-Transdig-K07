// F07 Contextual Recommendation — jarak, POI yang belum dikunjungi, dan waktu kunjungan.
import { content } from '../stores/content'
import { visits } from '../stores/visits'
import { haversine, formatDistance } from './geo'
import { currentDate, timeSlot, openStatus, nextSchedule, SLOTS } from './time'

const SLOT_REASON = {
  pagi: 'Cocok untuk pagi',
  siang: 'Cocok untuk siang',
  sore: 'Cocok untuk sore',
  malam: 'Cocok untuk malam',
}

/**
 * @param {object} opts
 * @param {{lat,lng}|null} opts.from   titik asal (posisi pengguna atau POI saat ini)
 * @param {string[]} opts.exclude      id POI yang tidak boleh direkomendasikan
 * @param {number} opts.limit          2–3 rekomendasi
 */
export function recommend({ from = null, exclude = [], limit = 3, date = currentDate() } = {}) {
  const slot = timeSlot(date)
  const items = []
  for (const p of content.pois) {
    if (exclude.includes(p.id)) continue
    if (visits.stamps[p.id]) continue // POI yang sudah dikunjungi tidak direkomendasikan lagi
    const d = from ? haversine(from, p) : null
    const status = openStatus(p, date)
    const sched = nextSchedule(p, date)

    let score = 0
    const reasons = []
    if (p.best_times.includes(slot)) {
      score += 3
      reasons.push(SLOT_REASON[slot])
    }
    if (d != null) score += Math.max(0, 2.5 - d / 150) // makin dekat makin tinggi
    if (!status.open) score -= 4
    if (sched) {
      if (sched.ongoing) {
        score += 4
        reasons.unshift(`${sched.title} berlangsung`)
      } else if (sched.minutesUntil <= 120) {
        score += 3.5
        reasons.unshift(`Mulai ${sched.start.replace(':', '.')}`)
      }
    }
    // Aktivitas spesifik waktu (PRD: jogging pagi, air mancur malam)
    if (slot === 'pagi' && p.category_id === 'wellness') score += 1.5
    if (slot === 'malam' && p.id === 'P03') score += 2
    if (p.category_id === 'akses') score -= 2.5

    const meta = [reasons[0] || (status.open ? 'Buka' : status.label), d != null ? formatDistance(d) : null].filter(Boolean).join(' · ')
    items.push({ poi: p, score, distance: d, meta, slot, open: status.open })
  }
  items.sort((a, b) => b.score - a.score)
  return items.slice(0, Math.max(2, Math.min(3, limit)))
}

export const slotLabel = () => SLOTS[timeSlot()].label
