// Waktu kunjungan: slot waktu, jam buka, dan jadwal atraksi.
import { ref } from 'vue'

/** Jam "sekarang" yang reaktif (diperbarui tiap detik). Bisa ditimpa untuk uji skenario. */
export const now = ref(Date.now())
export const timeOverride = ref(null) // jam (0–23) untuk menguji skenario pagi/sore/malam
setInterval(() => (now.value = Date.now()), 1000)

export function currentDate() {
  const d = new Date(now.value)
  if (timeOverride.value != null) d.setHours(timeOverride.value, 0, 0, 0)
  return d
}

export const SLOTS = {
  pagi: { label: 'Pagi', range: '05.00–10.00' },
  siang: { label: 'Siang', range: '10.00–15.00' },
  sore: { label: 'Sore', range: '15.00–18.00' },
  malam: { label: 'Malam', range: '18.00–05.00' },
}

export function timeSlot(d = currentDate()) {
  const h = d.getHours()
  if (h >= 5 && h < 10) return 'pagi'
  if (h >= 10 && h < 15) return 'siang'
  if (h >= 15 && h < 18) return 'sore'
  return 'malam'
}

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export const fmtTime = (hhmm) => hhmm.replace(':', '.')

/** Status buka/tutup POI berdasarkan `hours` [{days, open, close}] */
export function openStatus(poi, d = currentDate()) {
  const rules = poi?.hours || []
  if (!rules.length) return { open: true, label: 'Jam buka belum tersedia', known: false }
  const day = d.getDay()
  const mins = d.getHours() * 60 + d.getMinutes()
  const today = rules.find((r) => r.days.includes(day))
  if (today && mins >= toMin(today.open) && mins < toMin(today.close)) {
    return { open: true, label: `Buka · tutup ${fmtTime(today.close)}`, known: true, opensAt: today.open, closesAt: today.close }
  }
  if (today && mins < toMin(today.open)) {
    return { open: false, label: `Tutup · buka ${fmtTime(today.open)}`, known: true, opensAt: today.open }
  }
  for (let i = 1; i <= 7; i++) {
    const r = rules.find((x) => x.days.includes((day + i) % 7))
    if (r) return { open: false, label: `Tutup · buka ${i === 1 ? 'besok' : ''} ${fmtTime(r.open)}`.replace('  ', ' '), known: true, opensAt: r.open }
  }
  return { open: false, label: 'Tutup', known: true }
}

/** Jadwal atraksi berikutnya (atau yang sedang berlangsung) hari ini */
export function nextSchedule(poi, d = currentDate()) {
  const list = poi?.schedules || []
  if (!list.length) return null
  const day = d.getDay()
  const mins = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
  const today = list.filter((s) => s.days.includes(day)).sort((a, b) => toMin(a.start) - toMin(b.start))
  for (const s of today) {
    const start = toMin(s.start)
    const end = s.end ? toMin(s.end) : start + 15
    if (mins >= start && mins < end) return { ...s, ongoing: true, minutesUntil: 0 }
    if (mins < start) return { ...s, ongoing: false, minutesUntil: start - mins }
  }
  return null
}

export function countdownLabel(sched) {
  if (!sched) return null
  if (sched.ongoing) return 'Sedang berlangsung'
  const m = Math.ceil(sched.minutesUntil)
  if (m < 60) return `Mulai ${m} menit lagi`
  const h = Math.floor(m / 60)
  return `Mulai ${h} jam ${m % 60} menit lagi`
}

export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export function daysLabel(days) {
  if (days.length === 7) return 'Setiap hari'
  const s = [...days].sort().join(',')
  if (s === '1,2,3,4,5') return 'Senin–Jumat'
  if (s === '0,6') return 'Sabtu–Minggu'
  return days.map((x) => DAY_NAMES[x]).join(', ')
}
