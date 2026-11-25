<script setup>
// UI07 Navigation + UI08 Arrival & Rekomendasi — F06, F04, F07
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ParkMap from '../components/ParkMap.vue'
import Icon from '../components/Icon.vue'
import AudioPill from '../components/AudioPill.vue'
import RecommendationList from '../components/RecommendationList.vue'
import { nav, navInfo, target, startNavigation, stopNavigation } from '../stores/navigation'
import { location, setSimulatedPosition, requestCompass } from '../stores/location'
import { settings } from '../stores/settings'
import { formatDistance, googleMapsWalkUrl, cardinal } from '../lib/geo'
import { stopSpeech } from '../lib/audio'

const route = useRoute()
const router = useRouter()
const mapRef = ref(null)
const follow = ref(true)

onMounted(() => {
  if (nav.targetId !== route.params.id) startNavigation(route.params.id)
})
onBeforeUnmount(() => {
  if (!nav.arrived) stopSpeech()
})

const arrowRotation = computed(() => {
  const i = navInfo.value
  if (!i) return 0
  return i.relative != null ? i.relative : i.bearing
})

function end() {
  stopNavigation()
  stopSpeech()
  router.push('/explore')
}
function detail() {
  const id = nav.targetId
  stopNavigation()
  router.push(`/poi/${id}`)
}
function onMapClick(ll) {
  if (settings.simulation) setSimulatedPosition(ll)
}
watch(
  () => nav.arrived,
  (a) => a && setTimeout(() => mapRef.value?.flyTo(target.value.lat, target.value.lng, 19), 200)
)
</script>

<template>
  <main class="overflow-hidden" @click.once="requestCompass">
    <div class="absolute inset-0">
      <ParkMap
        v-if="target"
        ref="mapRef"
        :user="location.position"
        :route-to="nav.arrived ? null : target"
        :active-id="target.id"
        :dim-pois="true"
        :follow="follow && !nav.arrived"
        :pad-bottom="230"
        @map-click="onMapClick"
        @user-pan="follow = false"
      />
    </div>

    <!-- Header + kartu arah -->
    <div class="safe-top absolute inset-x-0 top-0 z-[500] px-4">
      <div class="flex items-center justify-between pt-2">
        <button class="grid size-11 place-items-center rounded-full bg-white text-ink shadow-[var(--shadow-card)]" aria-label="Kembali" @click="end">
          <Icon name="chevron-left" :size="22" />
        </button>
        <AudioPill />
      </div>
      <div v-if="!nav.arrived" class="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-[var(--shadow-float)]" aria-live="polite">
        <span class="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <svg width="26" height="26" viewBox="0 0 24 24" :style="{ transform: `rotate(${arrowRotation}deg)` }" class="transition-transform duration-500">
            <path d="M12 3 19 20 12 16 5 20Z" fill="currentColor" />
          </svg>
        </span>
        <div v-if="navInfo" class="min-w-0">
          <p class="text-[17px] font-semibold text-ink">
            {{ formatDistance(navInfo.distance) }} <span class="ml-1 font-medium text-muted">±{{ navInfo.minutes }} menit</span>
          </p>
          <p class="truncate text-[12px] text-muted">{{ navInfo.instruction }}<template v-if="navInfo.relative != null"> · arah {{ cardinal(navInfo.bearing) }}</template></p>
        </div>
        <div v-else class="min-w-0">
          <p class="text-[15px] font-semibold text-ink">Menunggu posisi Anda…</p>
          <p class="text-[12px] text-muted">Pastikan GPS aktif</p>
        </div>
      </div>
      <div v-if="navInfo && !nav.arrived" class="mx-1 mt-2 h-1 overflow-hidden rounded-full bg-white/80">
        <div class="h-full rounded-full bg-brand-500 transition-[width] duration-500" :style="{ width: `${navInfo.progress * 100}%` }" />
      </div>
    </div>

    <!-- Panel bawah: navigasi -->
    <Transition name="sheet-up" mode="out-in">
      <section v-if="target && !nav.arrived" key="nav" class="sheet safe-bottom absolute inset-x-0 bottom-0 z-[600] px-4 pb-4">
        <div class="sheet-handle" />
        <div class="flex items-center gap-3">
          <span class="grid size-11 place-items-center rounded-full bg-coral-500/10 text-coral-500"><Icon name="locate" :size="20" /></span>
          <div class="min-w-0 flex-1">
            <p class="eyebrow text-subtle">Menuju</p>
            <p class="truncate text-[18px] font-medium text-ink">{{ target.name }}</p>
          </div>
          <span class="pill shadow-none"><Icon name="walk" :size="14" /> Jalan kaki</span>
        </div>
        <label class="mt-3 flex items-center gap-3 rounded-2xl bg-mint px-3.5 py-3">
          <span class="size-2 rounded-full" :class="settings.navVoice ? 'bg-brand-500' : 'bg-subtle'" />
          <span class="min-w-0 flex-1">
            <span class="block text-[13px] font-bold text-ink">Panduan suara {{ settings.navVoice ? 'aktif' : 'nonaktif' }}</span>
            <span class="block text-[11px] text-muted">Arahan berikutnya diputar otomatis</span>
          </span>
          <input v-model="settings.navVoice" type="checkbox" class="sr-only" />
          <Icon :name="settings.navVoice ? 'volume' : 'volume-off'" :size="20" class="text-brand-700" />
        </label>
        <div class="mt-3 grid grid-cols-2 gap-2.5">
          <a class="btn-outline min-h-13" :href="googleMapsWalkUrl(target)" target="_blank" rel="noopener">Google Maps</a>
          <button class="btn-dark min-h-13" @click="end">Akhiri</button>
        </div>
      </section>

      <!-- UI08 Kedatangan -->
      <section v-else-if="target && nav.arrived" key="arrived" class="sheet safe-bottom absolute inset-x-0 bottom-0 z-[600] max-h-[72%] overflow-y-auto px-4 pb-4" role="status" aria-live="assertive">
        <div class="sheet-handle" />
        <div class="flex items-center gap-3">
          <span class="grid size-12 shrink-0 place-items-center rounded-full bg-brand-500 text-white"><Icon name="check" :size="24" :stroke="3" /></span>
          <div class="min-w-0">
            <p class="eyebrow">Anda telah tiba di</p>
            <p class="truncate text-[22px] font-medium leading-tight text-ink">{{ target.name }}</p>
          </div>
        </div>
        <p class="mt-3 flex items-center gap-2 rounded-xl bg-mint px-3 py-2 text-[11px] text-muted">
          <Icon name="vibrate" :size="14" class="text-brand-600" /> Notifikasi getar + suara saat masuk radius tujuan · Stempel spot {{ target.number }} tersimpan
        </p>
        <div class="mt-5">
          <RecommendationList :from="target" />
        </div>
        <div class="mt-4 grid grid-cols-2 gap-2.5">
          <button class="btn-outline min-h-12" @click="detail">Lihat detail</button>
          <button class="btn-primary min-h-12" @click="end">Lanjut Explore</button>
        </div>
      </section>
    </Transition>
  </main>
</template>
