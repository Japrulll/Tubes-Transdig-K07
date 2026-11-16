// F02 Location-Based Trigger + F04 Eyes-Free Interaction.
// Haversine ke tiap POI, radius 20–40 m, anti-trigger berulang dengan hysteresis (radius + 10 m).
import { reactive, computed } from 'vue'
import { GEO } from '../config'
import { haversine } from '../lib/geo'
import { speak, chime, vibrate, stopSpeech } from '../lib/audio'
import { load, save } from '../lib/storage'
import { content } from './content'
import { onPosition } from './location'
import { settings } from './settings'
import { addStamp } from './visits'
import { trail, activeTrail } from './trail'

export const geofence = reactive({
  inside: {}, // { P03: true }
  distances: {}, // { P03: 42.1 }
  active: null, // { poi, source, distance, at, isNewStamp }
  log: load('triggerLog', []), // bukti uji: waktu, POI, jarak, akurasi (hanya di perangkat)
  suppress: null, // id POI tujuan navigasi: kedatangan ditangani layar navigasi (UI08)
})

const sorted = computed(() =>
  content.pois
    .map((p) => ({ poi: p, distance: geofence.distances[p.id] }))
    .filter((x) => x.distance != null)
    .sort((a, b) => a.distance - b.distance)
)
export const nearest = computed(() => sorted.value[0] || null)

/** UI03: POI yang sedang didekati (di luar radius, ≤ radius + 35 m) */
export const approaching = computed(() => {
  const n = sorted.value.find((x) => !geofence.inside[x.poi.id])
  if (!n) return null
  return n.distance <= n.poi.radius_m + GEO.approachExtraM && n.distance > n.poi.radius_m ? n : null
})

/** POI tempat pengguna berada saat ini (di dalam radius) */
export const currentPoi = computed(() => sorted.value.find((x) => geofence.inside[x.poi.id] && x.distance <= x.poi.radius_m + GEO.hysteresisM) || null)

function logTrigger(entry) {
  geofence.log.unshift(entry)
  geofence.log.splice(50)
  save('triggerLog', geofence.log)
}

onPosition((pos) => {
  const candidates = []
  for (const p of content.pois) {
    const d = haversine(pos, p)
    geofence.distances[p.id] = d
    if (geofence.inside[p.id]) {
      if (d > p.radius_m + GEO.hysteresisM) delete geofence.inside[p.id] // reset (hysteresis)
    } else if (d <= p.radius_m) {
      candidates.push({ poi: p, distance: d })
    }
  }
  if (!candidates.length || geofence.active) return
  // Di dalam lebih dari satu radius → POI terdekat yang dipilih
  candidates.sort((a, b) => a.distance - b.distance)
  const { poi, distance } = candidates[0]
  geofence.inside[poi.id] = true
  fireTrigger(poi, { source: pos.simulated ? 'simulasi' : 'gps', distance, accuracy: pos.accuracy })
})

/** Dipanggil oleh geofence GPS maupun scan QR (UI10) */
export function fireTrigger(poi, { source = 'gps', distance = null, accuracy = null } = {}) {
  const isNewStamp = addStamp(poi.id, source === 'qr' ? 'qr' : 'gps')
  logTrigger({
    at: Date.now(),
    poi: poi.id,
    source,
    distance: distance != null ? Math.round(distance) : null,
    accuracy: accuracy != null ? Math.round(accuracy) : null,
  })

  if (geofence.suppress === poi.id && source !== 'qr') return
  // Saat Wellness Trail berjalan, checkpoint memakai panduan audio trail (tidak dobel)
  if (source !== 'qr' && trail.status === 'running' && activeTrail.value?.checkpoints.some((c) => c.poi_id === poi.id)) return
  geofence.active = { poi, source, distance, at: Date.now(), isNewStamp }

  // Respons multimodal: getar + nada + prompt suara (≤3 detik)
  vibrate([220, 120, 220])
  chime()
  const prompt = settings.audioMode
    ? `Anda sedang mendekati ${poi.name}.`
    : `Anda sedang mendekati ${poi.name}. Ingin mendengarkan ceritanya?`
  setTimeout(() => {
    speak(prompt, { key: 'prompt' }).then(() => {
      // Mode Audio: narasi langsung diputar tanpa menyentuh layar
      if (settings.audioMode && geofence.active?.poi.id === poi.id) {
        geofence.active.autoplay = true
      }
    })
  }, 450)
}

export function dismissTrigger() {
  geofence.active = null
}

export function clearTriggerState() {
  geofence.inside = {}
  geofence.active = null
  stopSpeech()
}
