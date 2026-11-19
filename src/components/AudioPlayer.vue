<script setup>
// Pemutar narasi POI (F03/F04): putar, jeda, ulang.
// Memakai berkas audio (audio_url dari Supabase) bila ada; jika tidak, TTS bahasa Indonesia.
import { ref, computed, onBeforeUnmount, watch } from 'vue'
import Icon from './Icon.vue'
import { speak, stopSpeech, speakingKey, estimateSeconds, ttsSupported } from '../lib/audio'
import { formatClock } from '../lib/geo'
import { audioBroken, markAudioBroken } from '../lib/media'

const props = defineProps({
  text: { type: String, required: true },
  audioUrl: { type: String, default: null },
  id: { type: String, required: true },
  title: { type: String, default: 'Narasi audio' },
  compact: { type: Boolean, default: false },
  duration: { type: Number, default: null },
})
const emit = defineEmits(['ended'])

// Rekaman dari Supabase Storage dipakai bila ada; jika berkas belum diunggah → TTS
const recordingUrl = computed(() => (props.audioUrl && !audioBroken(props.audioUrl) ? props.audioUrl : null))
const usingRecording = ref(false)

const key = computed(() => `narasi:${props.id}`)
const state = ref('idle') // idle | playing | paused | ended
const offset = ref(0) // indeks karakter untuk melanjutkan TTS setelah dijeda
const boundary = ref(0)
const elapsedMs = ref(0)
const durationS = ref(estimateSeconds(props.text))
let tick = null
let audio = null
let lastT = 0

const progress = computed(() => {
  if (state.value === 'ended') return 1
  if (audio && audio.duration) return Math.min(1, audio.currentTime / audio.duration)
  const byChar = boundary.value / props.text.length
  const byTime = elapsedMs.value / 1000 / Math.max(1, durationS.value)
  return Math.min(0.99, Math.max(byChar, byTime))
})
const elapsedLabel = computed(() => formatClock(progress.value * durationS.value * 1000))
const totalLabel = computed(() => formatClock(durationS.value * 1000))

function startTick() {
  clearInterval(tick)
  lastT = Date.now()
  tick = setInterval(() => {
    const t = Date.now()
    elapsedMs.value += t - lastT
    lastT = t
  }, 250)
}

function playTts(from = 0) {
  state.value = 'playing'
  const chunk = props.text.slice(from)
  startTick()
  speak(chunk, {
    key: key.value,
    onBoundary: (i) => {
      boundary.value = from + i
    },
  }).then((ok) => {
    if (state.value !== 'playing') return
    clearInterval(tick)
    if (ok) state.value = 'ended'
    else {
      // dipotong oleh suara lain → bisa dilanjutkan
      offset.value = Math.max(0, boundary.value - 1)
      state.value = 'paused'
    }
  })
}

function play() {
  if (recordingUrl.value) {
    if (!audio) {
      audio = new Audio(recordingUrl.value)
      audio.onloadedmetadata = () => {
        usingRecording.value = true
        durationS.value = Math.round(audio.duration)
      }
      audio.onended = () => (state.value = 'ended')
      audio.ontimeupdate = () => (elapsedMs.value = audio.currentTime * 1000)
      audio.onerror = () => {
        // Berkas belum ada di bucket → narasi TTS
        markAudioBroken(recordingUrl.value)
        audio = null
        usingRecording.value = false
        durationS.value = estimateSeconds(props.text)
        if (state.value === 'playing') playTts(0)
      }
    }
    stopSpeech()
    state.value = 'playing'
    audio.play().catch(() => {})
    return
  }
  if (!ttsSupported) return
  if (state.value === 'paused') return playTts(offset.value)
  boundary.value = 0
  elapsedMs.value = 0
  playTts(0)
}

function pause() {
  if (audio) {
    audio.pause()
    state.value = 'paused'
    return
  }
  // Lanjutkan dari awal kalimat terakhir agar konsisten di Android (pause() tidak didukung)
  const upto = props.text.slice(0, boundary.value)
  const lastStop = Math.max(upto.lastIndexOf('. '), upto.lastIndexOf(', '))
  offset.value = lastStop > 0 ? lastStop + 2 : 0
  state.value = 'paused'
  clearInterval(tick)
  stopSpeech()
}

function replay() {
  if (audio) {
    audio.currentTime = 0
    audio.play()
    state.value = 'playing'
    return
  }
  stopSpeech()
  state.value = 'idle'
  setTimeout(() => {
    boundary.value = 0
    elapsedMs.value = 0
    playTts(0)
  }, 60)
}

function toggle() {
  state.value === 'playing' ? pause() : state.value === 'ended' ? replay() : play()
}

// Narasi selesai → bintang "dengar cerita" (lihat stores/play.js)
watch(state, (s) => s === 'ended' && emit('ended'))

// Bila suara lain mengambil alih (prompt/navigasi), tandai sebagai dijeda
watch(speakingKey, (k) => {
  if (!audio && state.value === 'playing' && k && k !== key.value) {
    state.value = 'paused'
    clearInterval(tick)
  }
})

onBeforeUnmount(() => {
  clearInterval(tick)
  if (audio) audio.pause()
  if (speakingKey.value === key.value || state.value === 'playing') stopSpeech()
})

defineExpose({ play, pause, replay, state })
</script>

<template>
  <div class="flex items-center gap-3 rounded-2xl bg-mint p-3" :class="compact ? '' : 'sm:p-4'">
    <button
      class="grid size-14 shrink-0 place-items-center rounded-full bg-brand-500 text-white shadow-[0_6px_16px_-6px_rgb(47_133_119/0.9)] transition active:scale-95"
      :aria-label="state === 'playing' ? 'Jeda narasi' : 'Putar narasi'"
      @click="toggle"
    >
      <Icon :name="state === 'playing' ? 'pause' : 'play'" :size="22" :stroke="2.6" />
    </button>
    <div class="min-w-0 flex-1">
      <div class="flex items-baseline justify-between gap-2">
        <p class="truncate text-[13px] font-bold text-ink">{{ title }}</p>
        <p class="shrink-0 text-[11px] font-semibold tabular-nums text-muted">{{ elapsedLabel }} / {{ totalLabel }}</p>
      </div>
      <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
        <div class="h-full rounded-full bg-brand-500 transition-[width] duration-300" :style="{ width: `${progress * 100}%` }" />
      </div>
      <p v-if="!ttsSupported && !recordingUrl" class="mt-1.5 text-[11px] text-coral-600">Perangkat tidak mendukung suara; baca teks di bawah.</p>
      <p v-else class="mt-1.5 text-[11px] text-muted">{{ usingRecording ? 'Rekaman narasi' : 'Narasi suara bahasa Indonesia' }}</p>
    </div>
    <button class="icon-btn shrink-0 text-brand-700" aria-label="Ulangi narasi" @click="replay">
      <Icon name="replay" :size="20" />
    </button>
  </div>
</template>
