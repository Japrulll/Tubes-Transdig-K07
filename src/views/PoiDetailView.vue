<script setup>
// UI05 POI Detail — F03 (foto, deskripsi, trivia, jadwal, narasi), F04 (audio), F07 (rekomendasi).
import { computed, ref, watchEffect } from 'vue'
import { probeImage, imageReady } from '../lib/media'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import PoiArt from '../components/PoiArt.vue'
import AudioPill from '../components/AudioPill.vue'
import AudioPlayer from '../components/AudioPlayer.vue'
import RecommendationList from '../components/RecommendationList.vue'
import { getPoi, categoryById } from '../stores/content'
import { location, requestCompass } from '../stores/location'
import { geofence } from '../stores/geofence'
import { visits } from '../stores/visits'
import { startNavigation } from '../stores/navigation'
import { formatDistance, walkMinutes, googleMapsWalkUrl } from '../lib/geo'
import { openStatus, nextSchedule, countdownLabel, daysLabel, fmtTime } from '../lib/time'

const route = useRoute()
const router = useRouter()
const poi = computed(() => getPoi(route.params.id))
const cat = computed(() => categoryById.value[poi.value?.category_id])
const distance = computed(() => (poi.value && location.position ? geofence.distances[poi.value.id] : null))
const stamp = computed(() => visits.stamps[poi.value?.id])
const status = computed(() => openStatus(poi.value))
const sched = computed(() => nextSchedule(poi.value))
const slide = ref(0)
watchEffect(() => poi.value?.photo_urls.forEach(probeImage))
const photos = computed(() => {
  const p = poi.value
  if (!p) return []
  // Foto survei dari Supabase Storage dipakai bila berkasnya sudah diunggah
  const real = p.photo_urls.map((url, i) => ({ url, caption: p.photo_captions?.[i] })).filter((x) => imageReady(x.url))
  // Minimal 2 visual per POI; ilustrasi mengisi sampai foto survei tersedia
  const art = [0, 1].map((v) => ({ art: p.art, variant: v, caption: p.photo_captions?.[v] }))
  return real.length >= 2 ? real : [...real, ...art].slice(0, Math.max(2, real.length + 1))
})
let sx = null
const onTs = (e) => (sx = e.touches[0].clientX)
const onTe = (e) => {
  if (sx == null) return
  const dx = e.changedTouches[0].clientX - sx
  if (dx < -40) slide.value = Math.min(photos.value.length - 1, slide.value + 1)
  if (dx > 40) slide.value = Math.max(0, slide.value - 1)
  sx = null
}

function navigate() {
  requestCompass()
  startNavigation(poi.value.id)
  router.push(`/navigate/${poi.value.id}`)
}
function back() {
  if (window.history.state?.back) router.back()
  else router.push('/explore')
}
</script>

<template>
  <main v-if="poi" class="overflow-y-auto bg-canvas">
    <!-- Foto / ilustrasi -->
    <div class="relative" @touchstart.passive="onTs" @touchend="onTe">
      <div class="aspect-[4/3] w-full overflow-hidden bg-mint">
        <template v-for="(ph, i) in photos" :key="i">
          <div v-show="slide === i" class="h-full w-full">
            <img v-if="ph.url" :src="ph.url" :alt="`${poi.name} — foto ${i + 1}`" class="h-full w-full object-cover" />
            <PoiArt v-else :art="ph.art" :variant="ph.variant" :label="`${poi.name} — ilustrasi ${i + 1}`" />
          </div>
        </template>
      </div>
      <div class="safe-top absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-2">
        <button class="grid size-11 place-items-center rounded-full bg-white/95 text-ink shadow-[var(--shadow-card)]" aria-label="Kembali" @click="back">
          <Icon name="chevron-left" :size="22" />
        </button>
        <AudioPill />
      </div>
      <div class="absolute inset-x-0 bottom-9 flex justify-center gap-1.5">
        <button
          v-for="(_, i) in photos"
          :key="i"
          class="h-1.5 rounded-full bg-white transition-all"
          :class="slide === i ? 'w-5' : 'w-1.5 opacity-60'"
          :aria-label="`Foto ${i + 1}`"
          @click="slide = i"
        />
      </div>
      <span class="absolute bottom-8 left-3 right-3 truncate text-[10px] font-semibold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.5)]">
        {{ photos[slide]?.url ? photos[slide]?.caption : `Ilustrasi${photos[slide]?.caption ? ' · ' + photos[slide].caption : ''}` }}
      </span>
    </div>

    <div class="relative -mt-6 rounded-t-[1.75rem] bg-canvas px-5 pb-10 pt-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="eyebrow" :style="{ color: cat?.color }">{{ cat?.label }} · {{ poi.id }}</p>
          <h1 class="mt-1.5 text-[26px] font-medium leading-tight tracking-tight text-ink">{{ poi.name }}</h1>
          <p class="mt-1 text-[12px] text-muted">{{ poi.location_label }}</p>
        </div>
        <div
          class="grid size-16 shrink-0 place-items-center rounded-full border-2 text-center text-[10px] font-extrabold leading-tight"
          :class="stamp ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-dashed border-line text-subtle'"
          :title="stamp ? 'Stempel tersimpan' : 'Belum dikunjungi'"
        >
          <span>{{ poi.id }}<br /><span class="text-[8px] font-bold uppercase tracking-wider">{{ stamp ? 'Stempel ✓' : 'Belum' }}</span></span>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-3 gap-2">
        <div class="stat">
          <span class="stat-value">{{ distance != null ? formatDistance(distance) : '–' }}</span>
          <span class="stat-label">Jarak</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ distance != null ? `±${walkMinutes(distance)}` : '–' }}<span class="stat-unit">mnt</span></span>
          <span class="stat-label">Jalan kaki</span>
        </div>
        <div class="stat" :class="status.open ? '' : 'bg-coral-500/10'">
          <span class="stat-value text-[15px]" :class="status.open ? 'text-brand-700' : 'text-coral-600'">{{ status.open ? 'Buka' : 'Tutup' }}</span>
          <span class="stat-label normal-case tracking-normal">{{ status.label.split('· ')[1] || '' }}</span>
        </div>
      </div>

      <div v-if="sched" class="mt-3 flex items-center gap-3 rounded-2xl bg-sun-100 p-3.5">
        <span class="grid size-10 shrink-0 place-items-center rounded-full bg-sun-400 text-white"><Icon name="clock" :size="20" /></span>
        <div class="min-w-0">
          <p class="text-[13px] font-bold text-ink">{{ sched.title }} · {{ fmtTime(sched.start) }}</p>
          <p class="text-[12px] font-semibold text-sun-600">{{ countdownLabel(sched) }}</p>
        </div>
      </div>

      <div class="mt-5">
        <AudioPlayer :id="poi.id" :text="poi.narration" :audio-url="poi.audio_url" :duration="poi.audio_duration" :title="`Narasi ${poi.short_name}`" />
      </div>

      <div class="mt-4 grid grid-cols-[1fr_auto] gap-2.5">
        <button class="btn-primary min-h-13" :disabled="!location.position" @click="navigate"><Icon name="directions" :size="19" /> Arahkan</button>
        <a class="btn-outline min-h-13 px-4" :href="googleMapsWalkUrl(poi)" target="_blank" rel="noopener" aria-label="Buka rute jalan kaki di Google Maps">
          <Icon name="external" :size="17" /> Maps
        </a>
      </div>
      <p v-if="!location.position" class="mt-2 text-center text-[11px] text-muted">Aktifkan lokasi untuk navigasi dalam aplikasi.</p>

      <section class="mt-7">
        <p class="eyebrow">Tentang spot</p>
        <p class="mt-2 text-[14px] leading-relaxed text-ink/90">{{ poi.description }}</p>
      </section>

      <section class="mt-6">
        <p class="eyebrow">Tahukah Anda?</p>
        <ul class="mt-2 space-y-2">
          <li v-for="(t, i) in poi.trivia" :key="i" class="flex gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-3.5">
            <Icon name="bulb" :size="19" class="mt-0.5 shrink-0 text-brand-600" />
            <p class="text-[13px] leading-relaxed text-ink">{{ t }}</p>
          </li>
        </ul>
      </section>

      <section class="mt-6 grid gap-3">
        <div class="card p-4">
          <p class="eyebrow">Aktivitas</p>
          <ul class="mt-2 space-y-1.5 text-[13px] text-ink">
            <li v-for="a in poi.activities" :key="a" class="flex gap-2"><Icon name="check" :size="15" :stroke="2.6" class="mt-0.5 shrink-0 text-brand-500" />{{ a }}</li>
          </ul>
        </div>
        <div class="card p-4">
          <p class="eyebrow">Jam & jadwal</p>
          <ul class="mt-2 space-y-1.5 text-[13px] text-ink">
            <li v-for="(h, i) in poi.hours" :key="'h' + i" class="flex justify-between gap-3">
              <span class="text-muted">{{ daysLabel(h.days) }}</span><span class="font-semibold">{{ fmtTime(h.open) }}–{{ fmtTime(h.close) }}</span>
            </li>
            <li v-for="(s, i) in poi.schedules" :key="'s' + i" class="flex justify-between gap-3">
              <span class="text-muted">{{ s.title.replace('Pertunjukan ', '') }}</span><span class="font-semibold">{{ fmtTime(s.start) }}</span>
            </li>
          </ul>
          <p v-if="poi.status_note" class="mt-3 rounded-xl bg-canvas p-2.5 text-[11px] leading-relaxed text-muted">
            <Icon name="info" :size="12" class="mr-1 inline -translate-y-px" />{{ poi.status_note }}
          </p>
        </div>
        <div v-if="poi.tips.length" class="card p-4">
          <p class="eyebrow">Tips</p>
          <ul class="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink">
            <li v-for="t in poi.tips" :key="t" class="flex gap-2"><Icon name="sparkle" :size="14" class="mt-0.5 shrink-0 text-sun-600" />{{ t }}</li>
          </ul>
        </div>
      </section>

      <details class="mt-4 rounded-2xl border border-line bg-white p-4 text-[13px]">
        <summary class="cursor-pointer font-bold text-brand-800">Teks narasi audio</summary>
        <p class="mt-2 leading-relaxed text-muted">{{ poi.narration }}</p>
      </details>

      <div class="mt-8">
        <RecommendationList :from="poi" title="Spot berikutnya untuk Anda" />
      </div>
    </div>
  </main>
  <main v-else class="grid place-items-center p-8 text-center">
    <div>
      <p class="text-lg font-semibold">Spot tidak ditemukan</p>
      <button class="btn-primary mt-4" @click="router.push('/explore')">Kembali ke Explore</button>
    </div>
  </main>
</template>
