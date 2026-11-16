<script setup>
// Peta taman (Leaflet + OpenStreetMap) dengan gaya skematis Figma:
// lingkar jalan putih, danau biru muda, pin koral bernomor, titik posisi + lingkaran akurasi.
import { onMounted, onBeforeUnmount, ref, watch, shallowRef } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { content } from '../stores/content'
import { visits } from '../stores/visits'

const props = defineProps({
  user: { type: Object, default: null }, // {lat,lng,accuracy,simulated}
  activeId: { type: String, default: null },
  approachingId: { type: String, default: null },
  routeTo: { type: Object, default: null }, // POI tujuan navigasi
  trail: { type: Object, default: null }, // { path, checkpoints, reached: [] }
  showPois: { type: Boolean, default: true },
  dimPois: { type: Boolean, default: false },
  follow: { type: Boolean, default: false },
  padBottom: { type: Number, default: 0 },
})
const emit = defineEmits(['select', 'map-click', 'user-pan'])

const el = ref(null)
const map = shallowRef(null)
let poiLayer, userMarker, accCircle, routeLine, trailLayer
const markers = {}

const pinHtml = (p, { active, visited, approaching, dim }) => `
  <div class="poi-pin ${active ? 'is-active' : ''}" style="opacity:${dim && !active ? 0.45 : 1}">
    ${approaching ? '<div class="poi-pulse"></div>' : ''}
    <svg width="30" height="38" viewBox="0 0 30 38"><path d="M15 37s13-12.3 13-22A13 13 0 0 0 2 15c0 9.7 13 22 13 22z" fill="${visited ? '#3f9e8e' : '#ee7b5b'}" stroke="#fff" stroke-width="2"/></svg>
    <span>${p.number}</span>
    ${visited ? '<i class="pin-check"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4"><path d="M20 6 9 17l-5-5"/></svg></i>' : ''}
  </div>`

function renderPois() {
  if (!map.value) return
  poiLayer.clearLayers()
  if (!props.showPois) return
  for (const p of content.pois) {
    const icon = L.divIcon({
      className: '',
      html: pinHtml(p, {
        active: props.activeId === p.id || props.routeTo?.id === p.id,
        visited: !!visits.stamps[p.id],
        approaching: props.approachingId === p.id,
        dim: props.dimPois,
      }),
      iconSize: [30, 38],
      iconAnchor: [15, 37],
    })
    const m = L.marker([p.lat, p.lng], { icon, keyboard: true, title: p.name, riseOnHover: true })
    m.on('click', () => emit('select', p.id))
    m.addTo(poiLayer)
    markers[p.id] = m
  }
}

function renderUser() {
  if (!map.value) return
  const u = props.user
  if (!u) {
    userMarker?.remove()
    accCircle?.remove()
    userMarker = accCircle = null
    return
  }
  const ll = [u.lat, u.lng]
  if (!userMarker) {
    accCircle = L.circle(ll, { radius: u.accuracy || 10, color: '#3f9e8e', weight: 1, fillColor: '#3f9e8e', fillOpacity: 0.12, interactive: false }).addTo(map.value)
    userMarker = L.marker(ll, {
      icon: L.divIcon({ className: '', html: `<div class="user-dot ${u.simulated ? 'is-sim' : ''}"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] }),
      interactive: false,
      zIndexOffset: 1000,
    }).addTo(map.value)
  } else {
    userMarker.setLatLng(ll)
    accCircle.setLatLng(ll).setRadius(u.accuracy || 10)
  }
  if (props.follow) map.value.panTo(ll, { animate: true })
}

function renderRoute() {
  routeLine?.remove()
  routeLine = null
  if (!map.value || !props.routeTo || !props.user) return
  routeLine = L.polyline(
    [
      [props.user.lat, props.user.lng],
      [props.routeTo.lat, props.routeTo.lng],
    ],
    { color: '#2f8577', weight: 6, dashArray: '1 12', lineCap: 'round', interactive: false }
  ).addTo(map.value)
}

function renderTrail() {
  trailLayer.clearLayers()
  const t = props.trail
  if (!map.value || !t) return
  L.polyline(t.path, { color: '#17524b', weight: 4, dashArray: '8 10', lineCap: 'round', interactive: false }).addTo(trailLayer)
  const seen = new Set()
  t.checkpoints.forEach((c) => {
    const key = c.coords.join(',')
    if (seen.has(key)) return // start & finish di titik yang sama
    seen.add(key)
    const done = t.reached.includes(c.seq)
    L.marker(c.coords, {
      icon: L.divIcon({ className: '', html: `<div class="cp-dot ${done ? 'is-done' : ''}">${c.seq}</div>`, iconSize: [24, 24], iconAnchor: [12, 12] }),
      interactive: false,
    }).addTo(trailLayer)
  })
}

function recenter(zoom) {
  if (!map.value) return
  if (props.user) map.value.setView([props.user.lat, props.user.lng], zoom || Math.max(map.value.getZoom(), 18), { animate: true })
  else fitPark()
}
function fitPark() {
  if (!map.value) return
  const pts = content.pois.map((p) => [p.lat, p.lng])
  const small = map.value.getSize().y < 420
  map.value.fitBounds(L.latLngBounds(pts), { paddingTopLeft: small ? [16, 16] : [24, 140], paddingBottomRight: small ? [16, 16] : [24, 24 + props.padBottom], maxZoom: 18 })
}
function fitRoute() {
  if (!map.value || !props.routeTo) return
  const pts = [[props.routeTo.lat, props.routeTo.lng]]
  if (props.user) pts.push([props.user.lat, props.user.lng])
  map.value.fitBounds(L.latLngBounds(pts), { paddingTopLeft: [40, 120], paddingBottomRight: [40, 40 + props.padBottom], maxZoom: 19 })
}
function fitTrail() {
  if (!map.value || !props.trail) return
  map.value.fitBounds(L.latLngBounds(props.trail.path), { paddingTopLeft: [16, 52], paddingBottomRight: [16, 20 + props.padBottom], maxZoom: 18.5 })
}
function flyTo(lat, lng, zoom = 19) {
  map.value?.flyTo([lat, lng], zoom, { duration: 0.6 })
}
function invalidate() {
  map.value?.invalidateSize()
}
defineExpose({ recenter, fitPark, fitRoute, fitTrail, flyTo, invalidate })

onMounted(() => {
  const park = content.park
  const m = L.map(el.value, {
    zoomControl: false,
    attributionControl: true,
    center: park.center,
    zoom: park.zoom || 18,
    minZoom: 15,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    maxZoom: 20,
    maxBounds: L.latLngBounds(park.bounds).pad(1.5),
    tap: true,
  })
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxNativeZoom: 19,
    maxZoom: 20,
    className: 'setara-tiles',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(m)
  m.attributionControl.setPrefix(false)

  // Denah: lingkar Jl. Kiara Artha + danau (tetap tampil walau tile peta offline)
  if (park.ring?.length) {
    L.polyline(park.ring, { color: '#c9dcd7', weight: 14, opacity: 0.9, interactive: false }).addTo(m)
    L.polyline(park.ring, { color: '#ffffff', weight: 10, opacity: 0.95, interactive: false }).addTo(m)
  }
  if (park.lake) {
    L.circle(park.lake.center, { radius: park.lake.radius_m, color: '#8ccbd6', weight: 2, fillColor: '#bfe6ec', fillOpacity: 0.95, interactive: false }).addTo(m)
    L.marker(park.lake.center, { icon: L.divIcon({ className: '', html: '<div class="map-label">danau</div>', iconSize: [0, 0] }), interactive: false }).addTo(m)
  }

  poiLayer = L.layerGroup().addTo(m)
  trailLayer = L.layerGroup().addTo(m)
  m.on('click', (e) => emit('map-click', e.latlng))
  m.on('dragstart', () => emit('user-pan'))
  map.value = m

  renderPois()
  renderTrail()
  renderUser()
  renderRoute()
  const initialFit = () => {
    m.invalidateSize()
    if (props.routeTo) fitRoute()
    else if (props.trail) fitTrail()
    else if (props.user) recenter(18)
    else fitPark()
  }
  initialFit()
  // Ukuran kontainer baru final setelah transisi halaman selesai
  setTimeout(initialFit, 260)
  resizeObs = new ResizeObserver(() => m.invalidateSize())
  resizeObs.observe(el.value)
})
let resizeObs = null

onBeforeUnmount(() => {
  resizeObs?.disconnect()
  map.value?.remove()
  map.value = null
})

watch(() => [props.activeId, props.approachingId, props.showPois, props.dimPois, props.routeTo?.id, { ...visits.stamps }, content.pois], renderPois, { deep: true })
watch(() => props.user && [props.user.lat, props.user.lng, props.user.accuracy, props.user.simulated], () => {
  if (props.user?.simulated !== undefined && userMarker) {
    // ganti warna titik saat beralih simulasi/GPS
    userMarker.setIcon(L.divIcon({ className: '', html: `<div class="user-dot ${props.user.simulated ? 'is-sim' : ''}"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] }))
  }
  renderUser()
  renderRoute()
})
watch(() => props.routeTo?.id, () => {
  renderRoute()
  if (props.routeTo) fitRoute()
})
watch(() => props.trail && [props.trail.path, [...props.trail.reached]], renderTrail, { deep: true })
</script>

<template>
  <div ref="el" class="h-full w-full" />
</template>
