<script setup>
// UI04 POI Trigger Notification — pop-up + getar + nada + prompt suara.
// Tombol respons besar (≥48 dp) agar mudah diketuk sambil berjalan (F04).
import { computed, ref, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Icon from './Icon.vue'
import PoiArt from './PoiArt.vue'
import AudioPlayer from './AudioPlayer.vue'
import { geofence, dismissTrigger } from '../stores/geofence'
import { categoryById } from '../stores/content'
import { stopSpeech } from '../lib/audio'
import { formatDistance } from '../lib/geo'
import { nextSchedule, countdownLabel } from '../lib/time'

const router = useRouter()
const route = useRoute()
const active = computed(() => geofence.active)
const poi = computed(() => active.value?.poi)
const listening = ref(false)
const player = ref(null)
const sched = computed(() => (poi.value ? nextSchedule(poi.value) : null))
const hidden = computed(() => route.name === 'onboarding' || (route.name === 'poi' && route.params.id === poi.value?.id))

watch(
  () => active.value?.at,
  () => (listening.value = false)
)

// Mode Audio: narasi diputar otomatis setelah prompt suara
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
    <div v-if="active && !hidden" class="absolute inset-x-0 bottom-0 z-[900]" role="dialog" aria-live="assertive" :aria-label="`Anda mendekati ${poi.name}`">
      <div class="sheet safe-bottom px-5 pb-5">
        <div class="sheet-handle" />
        <div class="flex items-start gap-3">
          <div class="relative size-16 shrink-0 overflow-hidden rounded-2xl">
            <PoiArt :art="poi.art" :label="poi.name" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="eyebrow flex items-center gap-1.5">
              <span class="relative flex size-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral-400 opacity-75" />
                <span class="relative inline-flex size-2 rounded-full bg-coral-500" />
              </span>
              {{ active.source === 'qr' ? 'Spot dari scan QR' : 'Anda mendekati' }}
            </p>
            <h2 class="mt-1 text-xl font-semibold leading-tight text-ink">{{ poi.name }}</h2>
            <p class="mt-0.5 text-xs text-muted">
              {{ categoryById[poi.category_id]?.label }} · {{ poi.id }}
              <template v-if="active.distance != null"> · {{ formatDistance(active.distance) }}</template>
            </p>
          </div>
          <button class="icon-btn -mr-2 -mt-1 text-muted" aria-label="Tutup" @click="later"><Icon name="x" /></button>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <span class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">
            <Icon name="check" :size="12" :stroke="3" />
            {{ active.isNewStamp ? `Stempel ${poi.id} tersimpan` : 'Sudah ada di koleksi' }}
          </span>
          <span v-if="sched" class="inline-flex items-center gap-1 rounded-full bg-sun-100 px-2.5 py-1 text-[11px] font-bold text-sun-600">
            <Icon name="clock" :size="12" :stroke="2.6" /> {{ sched.title.replace('Pertunjukan ', '') }} · {{ countdownLabel(sched) }}
          </span>
        </div>

        <div v-if="listening" class="mt-4">
          <AudioPlayer ref="player" :id="poi.id" :text="poi.narration" :audio-url="poi.audio_url" :title="`Cerita ${poi.short_name}`" compact />
        </div>
        <p v-else class="mt-4 text-[15px] font-medium text-ink">Ingin mendengarkan ceritanya?</p>

        <div class="mt-4 grid gap-2.5">
          <button v-if="!listening" class="btn-primary min-h-14 text-base" @click="listen">
            <Icon name="volume" :size="20" /> Dengarkan
          </button>
          <div class="grid grid-cols-2 gap-2.5">
            <button class="btn-outline min-h-13" @click="detail">Lihat detail</button>
            <button class="btn-ghost min-h-13 border border-line" @click="later">{{ listening ? 'Tutup' : 'Nanti' }}</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
