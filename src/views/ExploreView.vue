<script setup>
// UI02 Explore Map (di luar area POI) & UI03 Explore Map (mendekati POI) — F01, F02
import { computed, inject, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import ParkMap from '../components/ParkMap.vue'
import Icon from '../components/Icon.vue'
import AudioPill from '../components/AudioPill.vue'
import PoiThumb from '../components/PoiThumb.vue'
import RecommendationList from '../components/RecommendationList.vue'
import { location, startLocation, setSimulatedPosition } from '../stores/location'
import { settings } from '../stores/settings'
import { nearest, approaching, currentPoi, geofence } from '../stores/geofence'
import { getPoi, categoryById } from '../stores/content'
import { formatDistance, walkMinutes } from '../lib/geo'
import { timeSlot, SLOTS } from '../lib/time'
import { startNavigation } from '../stores/navigation'
import { requestCompass } from '../stores/location'

const router = useRouter()
const openMenu = inject('openMenu')
const mapRef = ref(null)
const selectedId = ref(null)
const expanded = ref(false)
const follow = ref(true)
const sheetEl = ref(null)
const sheetH = ref(170)
let ro = null
onMounted(() => {
  ro = new ResizeObserver(() => (sheetH.value = sheetEl.value?.offsetHeight || 170))
  ro.observe(sheetEl.value)
})
onBeforeUnmount(() => ro?.disconnect())

const selected = computed(() => getPoi(selectedId.value))
const mode = computed(() => {
  if (selected.value) return 'selected'
  if (!location.position) return location.status === 'denied' || location.status === 'unavailable' ? 'denied' : 'waiting'
  if (approaching.value) return 'approaching'
  if (currentPoi.value) return 'inside'
  return 'nearest'
})
const focus = computed(() => {
  if (mode.value === 'selected') return { poi: selected.value, distance: geofence.distances[selected.value.id] }
  if (mode.value === 'approaching') return approaching.value
  if (mode.value === 'inside') return currentPoi.value
  if (mode.value === 'nearest') return nearest.value
  return null
})
const eyebrow = computed(
  () =>
    ({
      selected: 'Spot dipilih',
      approaching: 'Mendekati area POI',
      inside: 'Anda berada di area POI',
      nearest: 'Di luar area POI · Spot terdekat',
    })[mode.value]
)
const meta = (f) => {
  const c = categoryById.value[f.poi.category_id]?.label
  if (f.distance == null) return `${c} · ${f.poi.location_label}`
  return `${c} · ${formatDistance(f.distance)} · ±${walkMinutes(f.distance)} menit`
}

function onSelect(id) {
  selectedId.value = id
  follow.value = false
}
function onMapClick(latlng) {
  if (settings.simulation) {
    setSimulatedPosition(latlng)
    return
  }
  selectedId.value = null
}
function locateMe() {
  follow.value = true
  if (!location.position && location.status !== 'active') startLocation()
  mapRef.value?.recenter(18)
}
function navigate(id) {
  requestCompass()
  startNavigation(id)
  router.push(`/navigate/${id}`)
}

// Saat posisi pertama didapat, arahkan peta ke pengguna
watch(
  () => !!location.position,
  (has) => has && mapRef.value?.recenter(18)
)
watch(expanded, () => setTimeout(() => mapRef.value?.invalidate(), 300))
</script>

<template>
  <main class="overflow-hidden">
    <div class="absolute inset-0">
      <ParkMap
        ref="mapRef"
        :user="location.position"
        :active-id="selectedId || focus?.poi?.id"
        :approaching-id="approaching?.poi.id"
        :follow="follow"
        :pad-bottom="200"
        @select="onSelect"
        @map-click="onMapClick"
        @user-pan="follow = false"
      />
    </div>

    <!-- Header -->
    <div class="safe-top pointer-events-none absolute inset-x-0 top-0 z-[500] px-4">
      <div class="pointer-events-auto flex items-center justify-between pt-2">
        <button class="grid size-11 place-items-center rounded-full bg-white text-ink shadow-[var(--shadow-card)]" aria-label="Buka menu" @click="openMenu()">
          <Icon name="menu" :size="21" />
        </button>
        <AudioPill />
      </div>
      <div class="pointer-events-auto mt-3 flex items-center gap-2 rounded-2xl border border-line bg-white px-3.5 shadow-[var(--shadow-float)]">
        <Icon name="search" :size="19" class="text-muted" />
        <button class="min-h-12 flex-1 text-left text-[14px] text-subtle" @click="router.push('/search')">Cari spot, fasilitas…</button>
        <button class="icon-btn size-10 text-brand-700" aria-label="Cari dengan suara" @click="router.push('/search?voice=1')">
          <Icon name="mic" :size="19" />
        </button>
      </div>

      <!-- Status lokasi -->
      <div class="pointer-events-auto mt-2 flex flex-wrap gap-2">
        <span v-if="location.status === 'requesting' && !location.position" class="pill">
          <span class="size-2 animate-pulse rounded-full bg-brand-500" /> Mencari lokasi Anda…
        </span>
        <button v-if="location.weak" class="pill border-sun-300 bg-sun-100 text-sun-600" @click="router.push('/qr')">
          <Icon name="qr" :size="14" /> Sinyal GPS lemah (±{{ Math.round(location.lastRaw?.accuracy || 0) }} m) · Scan QR
        </button>
        <span v-if="settings.simulation" class="pill border-coral-300 text-coral-600">
          <Icon name="pin" :size="14" /> Mode simulasi: ketuk peta untuk berpindah
        </span>
      </div>
    </div>

    <!-- Tombol mengambang -->
    <div class="pointer-events-none absolute inset-x-0 z-[500] flex items-end justify-between px-4 transition-all" :style="{ bottom: expanded ? 'calc(60% + 12px)' : `${sheetH + 12}px` }">
      <button class="pointer-events-auto grid size-12 place-items-center rounded-full bg-white text-brand-800 shadow-[var(--shadow-float)]" aria-label="Scan QR spot" @click="router.push('/qr')">
        <Icon name="qr" :size="21" />
      </button>
      <button class="pill pointer-events-auto min-h-11 px-4 text-[13px]" @click="locateMe">
        <Icon name="locate" :size="16" :stroke="2.4" class="text-brand-600" /> Lokasi saya
      </button>
    </div>

    <!-- Bottom sheet -->
    <section ref="sheetEl" class="sheet absolute inset-x-0 bottom-0 z-[600] flex flex-col px-4 pb-4" :class="expanded ? 'h-[60%]' : ''">
      <button class="sheet-handle block w-12 py-1.5" :aria-label="expanded ? 'Perkecil panel' : 'Perluas panel'" @click="expanded = !expanded" />

      <!-- Izin lokasi ditolak / tidak tersedia -->
      <div v-if="mode === 'denied'" class="pb-1">
        <p class="eyebrow text-coral-600">Lokasi tidak aktif</p>
        <p class="mt-1 text-[13px] leading-relaxed text-muted">{{ location.message || 'Izinkan lokasi agar info spot muncul otomatis.' }}</p>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <button class="btn-primary min-h-11 text-sm" @click="router.push('/qr')"><Icon name="qr" :size="17" /> Mode QR</button>
          <button class="btn-outline min-h-11 text-sm" @click="startLocation()">Coba lagi</button>
        </div>
      </div>

      <div v-else-if="mode === 'waiting'" class="pb-1">
        <p class="eyebrow">Menunggu posisi Anda</p>
        <p class="mt-1 text-[13px] text-muted">Pastikan GPS aktif. Sambil menunggu, ketuk pin di peta untuk melihat info spot.</p>
        <button v-if="location.status === 'idle'" class="btn-primary mt-3 min-h-11 w-full text-sm" @click="startLocation()"><Icon name="locate" :size="17" /> Aktifkan lokasi</button>
      </div>

      <div v-else-if="focus">
        <div class="flex items-center justify-between">
          <p class="eyebrow" :class="mode === 'approaching' ? 'text-coral-600' : ''">{{ eyebrow }}</p>
          <button v-if="mode === 'selected'" class="text-[11px] font-bold text-muted" @click="selectedId = null">Tutup</button>
        </div>
        <div class="mt-2 flex items-center gap-3">
          <button class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="router.push(`/poi/${focus.poi.id}`)">
            <PoiThumb :poi="focus.poi" />
            <span class="min-w-0">
              <span class="block truncate text-[15px] font-semibold text-ink">{{ focus.poi.name }}</span>
              <span class="block truncate text-[11px] text-muted">{{ meta(focus) }}</span>
            </span>
          </button>
          <button v-if="mode !== 'inside'" class="btn-outline min-h-10 shrink-0 px-4 text-[13px]" :disabled="!location.position" @click="navigate(focus.poi.id)">Arahkan</button>
          <button v-else class="btn-outline min-h-10 shrink-0 px-4 text-[13px]" @click="router.push(`/poi/${focus.poi.id}`)">Detail</button>
        </div>
        <p v-if="mode === 'approaching'" class="mt-2.5 rounded-xl bg-coral-500/10 px-3 py-2 text-[12px] font-medium text-coral-600">
          Info spot muncul otomatis dalam {{ formatDistance(Math.max(0, focus.distance - focus.poi.radius_m)) }} lagi.
        </p>
      </div>

      <div v-if="expanded" class="mt-4 min-h-0 flex-1 overflow-y-auto pb-2">
        <RecommendationList :title="`Rekomendasi ${SLOTS[timeSlot()].label.toLowerCase()} ini`" eyebrow="Sesuai waktu kunjungan" :exclude="focus ? [focus.poi.id] : []" />
      </div>
      <button v-else class="mt-3 flex items-center justify-center gap-1 text-[12px] font-bold text-brand-700" @click="expanded = true">
        Rekomendasi {{ SLOTS[timeSlot()].label.toLowerCase() }} ini <Icon name="chevron-down" :size="15" class="rotate-180" />
      </button>
    </section>
  </main>
</template>
