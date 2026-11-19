<script setup>
// UI04 POI Trigger Notification — pop-up + getar + nada + sapaan suara Kia.
// Setelah cerita selesai, Kia mengajak ikut "Tantangan di sini" (kuis, misi, nilai).
// Tombol respons besar (≥48 dp) agar mudah diketuk sambil berjalan (F04).
import { computed, ref, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Icon from './Icon.vue'
import PoiThumb from './PoiThumb.vue'
import Kia from './Kia.vue'
import StarRow from './StarRow.vue'
import AudioPlayer from './AudioPlayer.vue'
import { geofence, dismissTrigger } from '../stores/geofence'
import { categoryById } from '../stores/content'
import { settings } from '../stores/settings'
import { level, starsOf, markListened, spotState } from '../stores/play'
import { openChallenge } from '../stores/ui'
import { speak, stopSpeech } from '../lib/audio'
import { formatDistance } from '../lib/geo'
import { nextSchedule, countdownLabel } from '../lib/time'

const router = useRouter()
const route = useRoute()
const active = computed(() => geofence.active)
const poi = computed(() => active.value?.poi)
const listening = ref(false)
const listened = ref(false)
const player = ref(null)
const sched = computed(() => (poi.value ? nextSchedule(poi.value) : null))
const hidden = computed(() => route.name === 'onboarding' || (route.name === 'poi' && route.params.id === poi.value?.id))
const stars = computed(() => (poi.value ? starsOf(poi.value.id) : 0))
const challengeLeft = computed(() => (poi.value ? !spotState(poi.value.id).quiz?.done || !spotState(poi.value.id).mission?.done : false))

const kiaLine = computed(() => {
  if (!poi.value) return ''
  if (listened.value) return challengeLeft.value ? 'Seru, kan? Ada kuis dan misi kecil di sini. Ikut, yuk!' : 'Kamu sudah menaklukkan spot ini. Mantap!'
  if (listening.value) return 'Dengarkan baik-baik, nanti ada kuisnya, lho.'
  return active.value.isNewStamp ? `Hai! Kamu sampai di ${poi.value.short_name}. Mau dengar ceritanya?` : `Balik lagi ke ${poi.value.short_name}! Mau dengar ceritanya lagi?`
})

watch(
  () => active.value?.at,
  () => {
    listening.value = false
    listened.value = false
  }
)

// Mode Audio: narasi diputar otomatis setelah sapaan suara
watch(
  () => active.value?.autoplay,
  async (auto) => {
    if (!auto) return
    listening.value = true
    await nextTick()
    player.value?.play()
  }
)

async function listen() {
  listening.value = true
  await nextTick()
  player.value?.play()
}
function onListened() {
  listened.value = true
  markListened(poi.value.id)
  // Ajakan dua arah lewat suara (pengguna tidak harus melihat layar)
  if (!settings.quiet && challengeLeft.value) setTimeout(() => speak('Ada kuis dan misi kecil di sini. Buka layar kalau mau ikut, ya!', { key: 'kia' }), 600)
}
function challenge() {
  const id = poi.value.id
  stopSpeech()
  dismissTrigger()
  openChallenge(id)
}
function detail() {
  const id = poi.value.id
  dismissTrigger()
  router.push(`/poi/${id}`)
}
function later() {
  stopSpeech()
  dismissTrigger()
}
</script>

<template>
  <Transition name="sheet-up">
    <div v-if="active && !hidden" class="absolute inset-x-0 bottom-0 z-[900]" role="dialog" aria-live="assertive" :aria-label="`Kamu sampai di ${poi.name}`">
      <div class="sheet safe-bottom px-5 pb-5">
        <div class="sheet-handle" />
        <div class="flex items-start gap-3">
          <PoiThumb :poi="poi" size="size-16" class="rounded-2xl" />
          <div class="min-w-0 flex-1">
            <p class="eyebrow flex items-center gap-1.5">
              <span class="relative flex size-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral-400 opacity-75" />
                <span class="relative inline-flex size-2 rounded-full bg-coral-500" />
              </span>
              {{ active.source === 'qr' ? 'Spot dari scan QR' : 'Kamu sampai di' }}
            </p>
            <h2 class="mt-1 text-xl font-semibold leading-tight text-ink">{{ poi.name }}</h2>
            <p class="mt-0.5 text-xs text-muted">
              {{ categoryById[poi.category_id]?.label }} · {{ poi.id }}
              <template v-if="active.distance != null"> · {{ formatDistance(active.distance) }}</template>
            </p>
          </div>
          <button class="icon-btn -mr-2 -mt-1 text-muted" aria-label="Tutup" @click="later"><Icon name="x" /></button>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">
            <Icon name="check" :size="12" :stroke="3" />
            {{ active.isNewStamp ? `Stempel ${poi.id} tersimpan` : 'Sudah ada di koleksi' }}
          </span>
          <span v-if="sched" class="inline-flex items-center gap-1 rounded-full bg-sun-100 px-2.5 py-1 text-[11px] font-bold text-sun-600">
            <Icon name="clock" :size="12" :stroke="2.6" /> {{ sched.title.replace('Pertunjukan ', '') }} · {{ countdownLabel(sched) }}
          </span>
          <StarRow :count="stars" :size="14" class="ml-auto" />
        </div>

        <div class="mt-3 flex items-end gap-2">
          <Kia :mood="listened ? 'cheer' : listening ? 'happy' : 'wave'" :stage="level.level" :size="46" class="shrink-0" />
          <p class="mb-1 flex-1 rounded-2xl rounded-bl-md bg-mint px-3 py-2 text-[14px] font-medium leading-snug text-brand-900">{{ kiaLine }}</p>
        </div>

        <div v-if="listening" class="mt-3">
          <AudioPlayer ref="player" :id="poi.id" :text="poi.narration" :audio-url="poi.audio_url" :title="`Cerita ${poi.short_name}`" compact @ended="onListened" />
        </div>

        <div class="mt-4 grid gap-2.5">
          <button v-if="!listening" class="btn-primary min-h-14 text-base" @click="listen">
            <Icon name="volume" :size="20" /> Dengarkan
          </button>
          <button v-else-if="listened && challengeLeft" class="btn-primary min-h-14 text-base" @click="challenge">
            <Icon name="star" :size="19" :fill="true" /> Mulai tantangan
          </button>
          <div class="grid grid-cols-2 gap-2.5">
            <button v-if="!listened && challengeLeft" class="btn-outline min-h-13" @click="challenge"><Icon name="star" :size="16" /> Tantangan</button>
            <button v-else class="btn-outline min-h-13" @click="detail">Lihat detail</button>
            <button class="btn-ghost min-h-13 border border-line" @click="later">{{ listening ? 'Tutup' : 'Nanti' }}</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
