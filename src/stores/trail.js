// F08 Wellness Trail — checkpoint berpemandu audio, pencatat jarak & durasi, stempel penyelesaian.
import { reactive, computed, watch } from 'vue'
import { haversine } from '../lib/geo'
import { speak, chime, vibrate, stopSpeech } from '../lib/audio'
import { load, save } from '../lib/storage'
import { now } from '../lib/time'
import { trailById } from './content'
import { location, onPosition } from './location'
import { visits, ensureSession } from './visits'
import { trailFinished } from './play'

const empty = () => ({
  trailId: null,
  status: 'idle', // idle | running | paused | done
  startedAt: null,
  elapsedMs: 0, // akumulasi saat dijeda
  resumedAt: null,
  distanceM: 0,
  lastPos: null,
  reached: [], // nomor checkpoint yang sudah dicapai
  result: null,
})

export const trail = reactive(load('activeTrail', empty()))
watch(trail, (v) => save('activeTrail', v), { deep: true })

export const activeTrail = computed(() => trailById.value[trail.trailId] || null)
export const elapsed = computed(() => trail.elapsedMs + (trail.status === 'running' && trail.resumedAt ? now.value - trail.resumedAt : 0))
export const nextCheckpoint = computed(() => {
  const t = activeTrail.value
  if (!t) return null
  return t.checkpoints.find((c) => !trail.reached.includes(c.seq)) || null
})
export const lastCheckpoint = computed(() => {
  const t = activeTrail.value
  if (!t || !trail.reached.length) return null
  return t.checkpoints.find((c) => c.seq === trail.reached[trail.reached.length - 1])
})

export function startTrail(id) {
  Object.assign(trail, empty(), { trailId: id, status: 'running', startedAt: Date.now(), resumedAt: Date.now() })
  ensureSession()
  const t = trailById.value[id]
  speak(`Yuk mulai ${t.name}! Aku temani, ya. Checkpoint pertama: ${t.checkpoints[0].name}.`, { key: 'trail' })
  // Pengguna mungkin sudah berdiri di checkpoint pertama
  if (location.position && !location.position.coarse) {
    trail.lastPos = { lat: location.position.lat, lng: location.position.lng, ts: Date.now() }
    setTimeout(() => location.position && checkCheckpoint(location.position), 2500)
  }
}

export function pauseTrail() {
  if (trail.status !== 'running') return
  trail.elapsedMs += Date.now() - trail.resumedAt
  trail.resumedAt = null
  trail.status = 'paused'
  trail.lastPos = null
  stopSpeech()
}

export function resumeTrail() {
  if (trail.status !== 'paused') return
  trail.status = 'running'
  trail.resumedAt = Date.now()
}

export function finishTrail() {
  if (trail.status === 'running') {
    trail.elapsedMs += Date.now() - trail.resumedAt
    trail.resumedAt = null
  }
  const t = activeTrail.value
  const complete = !!t && trail.reached.length >= t.checkpoints.length
  trail.result = {
    trailId: trail.trailId,
    at: Date.now(),
    distanceM: Math.round(trail.distanceM),
    durationMs: trail.elapsedMs,
    reached: trail.reached.length,
    total: t?.checkpoints.length || 0,
    complete,
  }
  visits.trailsDone.unshift(trail.result)
  trail.result.xp = trailFinished(trail.result)
  trail.status = 'done'
}

export function closeTrail() {
  Object.assign(trail, empty())
}

/** Tandai checkpoint (dipakai GPS; juga tombol manual saat uji) */
export function reachCheckpoint(cp) {
  if (trail.reached.includes(cp.seq)) return
  trail.reached.push(cp.seq)
  vibrate([180, 90, 180])
  chime()
  const t = activeTrail.value
  const next = nextCheckpoint.value
  const tail = next ? ` Berikutnya: ${next.name}.` : ''
  speak(`${cp.coaching}${tail}`, { key: `cp:${cp.seq}` })
  if (!next && t) setTimeout(() => trail.status === 'running' && finishTrail(), 1500)
}

function checkCheckpoint(pos) {
  const cp = nextCheckpoint.value
  if (cp && haversine(pos, { lat: cp.coords[0], lng: cp.coords[1] }) <= cp.radius_m) reachCheckpoint(cp)
}

onPosition((pos) => {
  if (trail.status !== 'running') return
  if (!trail.lastPos) trail.lastPos = { lat: pos.lat, lng: pos.lng, ts: pos.ts }
  else {
    const d = haversine(trail.lastPos, pos)
    const dt = Math.max(1, (pos.ts - trail.lastPos.ts) / 1000)
    // Abaikan jitter GPS (< 3 m) dan lonjakan tidak wajar (> 7 m/s)
    if (d >= 3) {
      if (pos.simulated || d / dt <= 7) trail.distanceM += d
      trail.lastPos = { lat: pos.lat, lng: pos.lng, ts: pos.ts }
    }
  }
  checkCheckpoint(pos)
})
