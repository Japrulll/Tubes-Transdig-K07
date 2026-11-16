// A01 Koleksi Stempel & Ringkasan Kunjungan — disimpan di perangkat (localStorage).
import { reactive, computed, watch } from 'vue'
import { load, save } from '../lib/storage'
import { haversine } from '../lib/geo'
import { content } from './content'
import { onPosition } from './location'

const newSession = () => ({ startedAt: null, endedAt: null, distanceM: 0, visited: [], lastPos: null })

export const visits = reactive({
  stamps: load('stamps', {}), // { P01: { at, source } }
  session: load('session', newSession()),
  history: load('history', []), // ringkasan kunjungan sebelumnya
  trailsDone: load('trailsDone', []), // [{ trailId, at, distanceM, durationMs, complete }]
})

watch(() => visits.stamps, (v) => save('stamps', v), { deep: true })
watch(() => visits.session, (v) => save('session', v), { deep: true })
watch(() => visits.history, (v) => save('history', v), { deep: true })
watch(() => visits.trailsDone, (v) => save('trailsDone', v), { deep: true })

export const isVisited = (id) => !!visits.stamps[id]
export const visitedInSession = (id) => visits.session.visited.includes(id)

export function ensureSession() {
  if (!visits.session.startedAt) visits.session.startedAt = Date.now()
}

/** Tambah stempel; mengembalikan true bila stempel baru */
export function addStamp(poiId, source = 'gps') {
  ensureSession()
  if (!visits.session.visited.includes(poiId)) visits.session.visited.push(poiId)
  if (visits.stamps[poiId]) return false
  visits.stamps[poiId] = { at: Date.now(), source }
  return true
}

// Akumulasi jarak kunjungan dari pembacaan GPS yang valid
onPosition((pos) => {
  if (!visits.session.startedAt) return
  const last = visits.session.lastPos
  if (last) {
    const d = haversine(last, pos)
    const dt = Math.max(1, (pos.ts - last.ts) / 1000)
    // Abaikan jitter (< 3 m) dan lonjakan tidak wajar (> 7 m/s)
    if (d < 3) return
    if (pos.simulated || d / dt <= 7) visits.session.distanceM += d
  }
  visits.session.lastPos = { lat: pos.lat, lng: pos.lng, ts: pos.ts }
})

export function endSession() {
  const s = visits.session
  if (s.startedAt) {
    visits.history.unshift({
      startedAt: s.startedAt,
      endedAt: Date.now(),
      distanceM: Math.round(s.distanceM),
      visited: [...s.visited],
    })
    visits.history.splice(10)
  }
  visits.session = newSession()
}

export function resetAll() {
  visits.stamps = {}
  visits.session = newSession()
  visits.history = []
  visits.trailsDone = []
}

export const stampCount = computed(() => Object.keys(visits.stamps).length)

export const badgeProgress = computed(() => {
  const trailComplete = visits.trailsDone.some((t) => t.complete)
  return content.badges.map((b) => {
    const pool = b.poi_ids.length ? b.poi_ids : content.pois.map((p) => p.id)
    const have = pool.filter((id) => visits.stamps[id]).length
    const need = Math.min(b.min_count, pool.length)
    const done = have >= need && (!b.requires_trail || trailComplete)
    const missing = pool.filter((id) => !visits.stamps[id])
    return { ...b, have: Math.min(have, need), need, done, missing, progress: Math.min(1, have / need) * (b.requires_trail && !trailComplete ? 0.9 : 1) }
  })
})

export const nextBadge = computed(() => badgeProgress.value.filter((b) => !b.done).sort((a, b) => b.progress - a.progress)[0] || null)
