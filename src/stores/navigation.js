// F06 Navigation — garis arah, jarak, estimasi waktu, penunjuk arah real-time, notifikasi tiba.
import { reactive, computed } from 'vue'
import { haversine, bearing, walkMinutes, turnInstruction, formatDistance } from '../lib/geo'
import { speak, chime, vibrate } from '../lib/audio'
import { getPoi } from './content'
import { location, onPosition } from './location'
import { settings } from './settings'
import { geofence } from './geofence'
import { addStamp } from './visits'

export const nav = reactive({
  targetId: null,
  startedAt: null,
  startDistance: null,
  arrived: false,
  arrivedAt: null,
  lastSpokenAt: 0,
  lastSpokenDistance: null,
  lastInstruction: null,
})

export const target = computed(() => getPoi(nav.targetId))

export const navInfo = computed(() => {
  const t = target.value
  const p = location.position
  if (!t || !p) return null
  const distance = haversine(p, t)
  const brg = bearing(p, t)
  return {
    distance,
    bearing: brg,
    minutes: walkMinutes(distance),
    instruction: turnInstruction(brg, location.heading),
    relative: location.heading == null ? null : ((brg - location.heading + 360) % 360),
    progress: nav.startDistance ? Math.min(1, Math.max(0, 1 - distance / nav.startDistance)) : 0,
  }
})

export function startNavigation(poiId) {
  nav.targetId = poiId
  nav.startedAt = Date.now()
  nav.arrived = false
  nav.arrivedAt = null
  nav.lastSpokenAt = 0
  nav.lastSpokenDistance = null
  nav.lastInstruction = null
  nav.startDistance = location.position ? haversine(location.position, getPoi(poiId)) : null
  geofence.suppress = poiId
  geofence.active = null // kartu spot yang masih terbuka ditutup saat navigasi dimulai
  if (location.position && settings.navVoice) {
    const info = navInfo.value
    speak(`Menuju ${getPoi(poiId).name}. ${formatDistance(info.distance)}, sekitar ${info.minutes} menit berjalan kaki. ${info.instruction}.`, { key: 'nav' })
    nav.lastSpokenAt = Date.now()
    nav.lastSpokenDistance = info.distance
  }
}

export function stopNavigation() {
  nav.targetId = null
  nav.arrived = false
  geofence.suppress = null
}

onPosition((pos) => {
  const t = target.value
  if (!t || nav.arrived) return
  if (nav.startDistance == null) nav.startDistance = haversine(pos, t)
  const info = navInfo.value
  if (!info) return
  if (info.distance <= t.radius_m) {
    nav.arrived = true
    nav.arrivedAt = Date.now()
    addStamp(t.id, 'gps')
    vibrate([300, 120, 300, 120, 300])
    chime()
    speak(`Kamu sudah sampai di ${t.name}!`, { key: 'nav' })
    return
  }
  // Panduan suara berkala: tiap ±40 m progres atau saat instruksi belok berubah
  if (!settings.navVoice) return
  const now = Date.now()
  const progressed = nav.lastSpokenDistance == null || nav.lastSpokenDistance - info.distance >= 40
  const turnChanged = info.instruction !== nav.lastInstruction && /Belok|Putar/.test(info.instruction)
  if ((progressed || turnChanged) && now - nav.lastSpokenAt > 12000) {
    speak(`${info.instruction}. ${formatDistance(info.distance)} lagi.`, { key: 'nav', interrupt: false })
    nav.lastSpokenAt = now
    nav.lastSpokenDistance = info.distance
  }
  nav.lastInstruction = info.instruction
})
