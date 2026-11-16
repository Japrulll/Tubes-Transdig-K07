// F01 Location Awareness — Geolocation API (watchPosition, akurasi tinggi).
// Posisi hanya disimpan di memori perangkat; tidak pernah dikirim ke server (A03).
import { reactive, computed } from 'vue'
import { GEO } from '../config'
import { settings } from './settings'
import { bearing, haversine } from '../lib/geo'

export const location = reactive({
  status: 'idle', // idle | requesting | active | denied | unavailable | error
  message: '',
  position: null, // {lat, lng, accuracy, ts, simulated}
  lastRaw: null, // pembacaan terakhir apa pun akurasinya
  weak: false, // akurasi > 30 m
  heading: null, // arah hadap (kompas/GPS), derajat
  firstFixAt: null,
  requestedAt: null,
  updates: 0,
})

const listeners = new Set()
export const onPosition = (fn) => (listeners.add(fn), () => listeners.delete(fn))
const emit = (pos) => listeners.forEach((fn) => fn(pos))

let watchId = null
let prevAccepted = null

export const hasFix = computed(() => !!location.position)
export const geoSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator

function accept(pos) {
  if (prevAccepted && !pos.simulated) {
    const moved = haversine(prevAccepted, pos)
    // Arah gerak dari GPS bila kompas tidak tersedia
    if (moved > 4 && !compassActive) location.heading = bearing(prevAccepted, pos)
  }
  prevAccepted = pos
  location.position = pos
  location.updates++
  if (!location.firstFixAt) location.firstFixAt = Date.now()
  emit(pos)
}

function onSuccess(p) {
  if (settings.simulation) return
  const pos = {
    lat: p.coords.latitude,
    lng: p.coords.longitude,
    accuracy: p.coords.accuracy,
    ts: p.timestamp || Date.now(),
    simulated: false,
  }
  location.lastRaw = pos
  location.status = 'active'
  location.message = ''
  if (p.coords.heading != null && !Number.isNaN(p.coords.heading) && !compassActive) location.heading = p.coords.heading
  if (pos.accuracy > GEO.maxAccuracyM) {
    location.weak = true
    // Tampilkan posisi kasar di peta bila belum ada fix yang baik, tetapi jangan dipakai untuk trigger
    if (!location.position) location.position = { ...pos, coarse: true }
    return
  }
  location.weak = false
  accept(pos)
}

function onError(err) {
  if (err.code === 1) {
    location.status = 'denied'
    location.message = 'Izin lokasi ditolak. Anda tetap bisa menjelajah dengan Mode QR.'
  } else if (err.code === 2) {
    location.status = 'unavailable'
    location.message = 'Sinyal GPS tidak tersedia. Coba ke area terbuka atau gunakan scan QR.'
  } else {
    location.status = location.position ? 'active' : 'error'
    location.message = 'Menunggu sinyal GPS…'
  }
}

export function startLocation() {
  if (settings.simulation) {
    location.status = 'active'
    return
  }
  if (!geoSupported) {
    location.status = 'unavailable'
    location.message = 'Perangkat ini tidak mendukung GPS. Gunakan Mode QR.'
    return
  }
  if (watchId != null) return
  location.status = location.position ? 'active' : 'requesting'
  location.requestedAt = Date.now()
  watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
    enableHighAccuracy: true,
    maximumAge: GEO.updateMs,
    timeout: 15000,
  })
  startCompass()
}

export function stopLocation() {
  if (watchId != null) navigator.geolocation.clearWatch(watchId)
  watchId = null
}

/** Cek izin yang sudah pernah diberikan (tanpa memunculkan prompt) */
export async function permissionState() {
  try {
    const r = await navigator.permissions?.query({ name: 'geolocation' })
    return r?.state || 'prompt'
  } catch {
    return 'prompt'
  }
}

// ---- Mode simulasi (uji & demo di luar taman) ----
export function setSimulatedPosition(latlng) {
  const pos = { lat: latlng.lat, lng: latlng.lng, accuracy: 5, ts: Date.now(), simulated: true }
  location.status = 'active'
  location.weak = false
  location.lastRaw = pos
  accept(pos)
}

export function setSimulation(on) {
  settings.simulation = on
  if (on) {
    stopLocation()
    location.status = 'active'
  } else {
    location.position = null
    prevAccepted = null
    startLocation()
  }
}

// ---- Kompas (arah hadap) ----
let compassActive = false
function onOrientation(e) {
  let h = null
  if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading
  else if (e.absolute && typeof e.alpha === 'number') h = (360 - e.alpha) % 360
  if (h != null) {
    compassActive = true
    location.heading = h
  }
}
function startCompass() {
  if (typeof window === 'undefined') return
  if ('ondeviceorientationabsolute' in window) window.addEventListener('deviceorientationabsolute', onOrientation)
  else window.addEventListener('deviceorientation', onOrientation)
}

/** iOS memerlukan izin eksplisit untuk kompas (dipanggil dari ketukan pengguna) */
export async function requestCompass() {
  try {
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      const r = await DeviceOrientationEvent.requestPermission()
      if (r === 'granted') startCompass()
    }
  } catch {
    /* abaikan */
  }
}
