<script setup>
// UI12 Ringkasan Kunjungan — A01, F08
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '../components/TopBar.vue'
import Icon from '../components/Icon.vue'
import ParkMap from '../components/ParkMap.vue'
import PoiThumb from '../components/PoiThumb.vue'
import { content } from '../stores/content'
import { visits, endSession } from '../stores/visits'
import { location } from '../stores/location'
import { formatKm, formatDuration, formatDistance, haversine } from '../lib/geo'
import { now } from '../lib/time'

const router = useRouter()
const s = computed(() => visits.session)
const ended = ref(null)
const view = computed(() => ended.value || { ...s.value, endedAt: null })
const duration = computed(() => (view.value.startedAt ? (view.value.endedAt || now.value) - view.value.startedAt : 0))
const visitedCount = computed(() => view.value.visited.length)
const notVisited = computed(() => {
  const from = location.position || null
  return content.pois
    .filter((p) => !view.value.visited.includes(p.id))
    .map((p) => ({ poi: p, d: from ? haversine(from, p) : null }))
    .sort((a, b) => (a.d ?? 0) - (b.d ?? 0))
})
const trailsToday = computed(() => visits.trailsDone.filter((t) => view.value.startedAt && t.at >= view.value.startedAt))
const shareText = computed(
  () =>
    `Petualanganku di Kiara Artha Park bersama SETARA: ${visitedCount.value} dari ${content.pois.length} spot, ${formatKm(view.value.distanceM)} km, ${formatDuration(duration.value)}.`
)
const copied = ref(false)

async function share() {
  try {
    if (navigator.share) await navigator.share({ title: 'Ringkasan Kunjungan SETARA', text: shareText.value })
    else {
      await navigator.clipboard.writeText(shareText.value)
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
    }
  } catch {
    /* dibatalkan */
  }
}
function finish() {
  ended.value = { ...s.value, visited: [...s.value.visited], endedAt: Date.now() }
  endSession()
}
</script>

<template>
  <main class="flex flex-col bg-white">
    <TopBar title="Ringkasan Kunjungan" />
    <div class="min-h-0 flex-1 overflow-y-auto pb-8">
      <div class="relative h-44 bg-mint">
        <ParkMap :show-pois="true" />
        <span class="pill absolute bottom-3 right-3 z-[500]"><Icon name="user" :size="13" /> {{ visitedCount }} spot</span>
      </div>
      <div class="relative -mt-6 flex justify-center">
        <span class="z-[500] grid size-12 place-items-center rounded-full border-4 border-white bg-brand-500 text-white"><Icon name="check" :size="22" :stroke="3" /></span>
      </div>

      <div class="px-5 text-center">
        <p class="eyebrow mt-3">Petualangan hari ini</p>
        <h2 class="mt-2 text-[24px] font-medium leading-tight text-ink">Terima kasih<br />sudah berkunjung!</h2>
        <p class="mx-auto mt-2 max-w-[280px] text-[12px] leading-relaxed text-muted">Perjalanan yang seru di Kiara Artha Park. Sampai jumpa di petualangan berikutnya.</p>
      </div>

      <div class="mt-5 grid grid-cols-3 gap-2 px-5">
        <div class="card flex flex-col items-center py-3">
          <span class="text-[18px] font-bold text-ink">{{ visitedCount }}</span><span class="stat-label">Spot</span>
        </div>
        <div class="card flex flex-col items-center py-3">
          <span class="text-[18px] font-bold text-ink">{{ formatKm(view.distanceM) }}<span class="stat-unit">km</span></span><span class="stat-label">Jarak</span>
        </div>
        <div class="card flex flex-col items-center py-3">
          <span class="text-[18px] font-bold text-ink">{{ formatDuration(duration) }}</span><span class="stat-label">Durasi</span>
        </div>
      </div>
      <p v-if="!view.startedAt" class="mx-5 mt-3 rounded-xl bg-mint p-3 text-center text-[12px] text-muted">Kunjungan dimulai otomatis saat stempel pertama atau Wellness Trail dimulai.</p>

      <section v-if="trailsToday.length" class="mt-6 px-5">
        <p class="eyebrow">Wellness Trail</p>
        <ul class="mt-2 space-y-2">
          <li v-for="t in trailsToday" :key="t.at" class="flex items-center justify-between rounded-2xl bg-mint px-4 py-3 text-[12px]">
            <span class="font-semibold text-ink">{{ content.trails.find((x) => x.id === t.trailId)?.name }}</span>
            <span class="text-muted">{{ formatKm(t.distanceM) }} km · {{ formatDuration(t.durationMs) }} {{ t.complete ? '✓' : '' }}</span>
          </li>
        </ul>
      </section>

      <section class="mt-6 px-5">
        <div class="flex items-baseline justify-between">
          <p class="text-[14px] font-semibold text-ink">Spot yang belum dikunjungi</p>
          <span class="text-[11px] text-muted">{{ notVisited.length }} spot</span>
        </div>
        <ul class="mt-2 divide-y divide-line">
          <li v-for="n in notVisited.slice(0, 5)" :key="n.poi.id">
            <button class="flex w-full items-center gap-3 py-3 text-left" @click="router.push(`/poi/${n.poi.id}`)">
              <PoiThumb :poi="n.poi" size="size-10" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[13px] font-semibold text-ink">{{ n.poi.name }}</span>
                <span class="block truncate text-[11px] text-muted">{{ location.position ? `${formatDistance(n.d)} dari Anda` : n.poi.location_label }}</span>
              </span>
              <Icon name="arrow-right" :size="18" class="text-ink" />
            </button>
          </li>
        </ul>
        <p v-if="!notVisited.length" class="rounded-xl bg-mint p-3 text-center text-[12px] text-brand-800">Semua spot sudah dikunjungi!</p>
      </section>

      <div class="mt-6 grid gap-2 px-5">
        <button class="btn-primary" @click="share"><Icon name="share" :size="17" /> {{ copied ? 'Ringkasan disalin' : 'Bagikan ringkasan' }}</button>
        <button v-if="!ended && view.startedAt" class="btn-outline" @click="finish">Akhiri kunjungan</button>
        <button class="btn-ghost" @click="router.push('/explore')">Kembali ke Explore</button>
      </div>
    </div>
  </main>
</template>
