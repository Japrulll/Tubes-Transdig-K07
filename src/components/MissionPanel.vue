<script setup>
// Misi di lokasi: confirm ("Sudah!"), timer (aktivitas berpemandu suara), photo (kamera → Jurnal di ponsel).
// Misi hanya bisa dimulai di dalam radius spot, setelah scan QR spot, atau dalam Mode Simulasi.
import { computed, onBeforeUnmount, ref } from 'vue'
import Icon from './Icon.vue'
import { speak, stopSpeech, vibrate, chime } from '../lib/audio'
import { formatDistance } from '../lib/geo'
import { resizeImage, savePhoto } from '../lib/photoStore'
import { geofence, currentPoi } from '../stores/geofence'
import { settings } from '../stores/settings'
import { location, startLocation } from '../stores/location'

const props = defineProps({
  poi: { type: Object, required: true },
})
const emit = defineEmits(['done', 'skip', 'mood', 'navigate', 'go'])
const m = computed(() => props.poi.mission)

// Kehadiran di spot
const viaQr = computed(() => geofence.log.some((e) => e.poi === props.poi.id && e.source === 'qr' && Date.now() - e.at < 45 * 60000))
const here = computed(() => currentPoi.value?.poi.id === props.poi.id || geofence.distances[props.poi.id] <= props.poi.radius_m + 10)
const present = computed(() => here.value || viaQr.value || settings.simulation)
const distance = computed(() => geofence.distances[props.poi.id])

// Timer
const running = ref(false)
const remaining = ref(m.value?.seconds || 60)
let timer = null
let spoken = new Set()
function startTimer() {
  running.value = true
  emit('mood', 'cheer')
  const total = m.value.seconds || 60
  const t0 = Date.now()
  spoken = new Set()
  const tick = () => {
    const el = (Date.now() - t0) / 1000
    remaining.value = Math.max(0, Math.ceil(total - el))
    for (const c of m.value.cues || []) {
      if (el >= c.at && !spoken.has(c.at)) {
        spoken.add(c.at)
        speak(c.text, { key: 'mission' })
      }
    }
    if (el >= total) {
      clearInterval(timer)
      running.value = false
      chime()
      vibrate([180, 90, 180])
      speak('Selesai! Kerja bagus.', { key: 'mission' })
      emit('done', { type: 'timer' })
    }
  }
  tick()
  timer = setInterval(tick, 250)
}
function stopTimer() {
  clearInterval(timer)
  running.value = false
  remaining.value = m.value.seconds || 60
  stopSpeech()
}
onBeforeUnmount(() => {
  clearInterval(timer)
  if (running.value) stopSpeech()
})
const ring = computed(() => 1 - remaining.value / (m.value?.seconds || 60))

// Foto
const fileInput = ref(null)
const preview = ref(null)
const blob = ref(null)
const saving = ref(false)
const photoError = ref('')
async function onFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  photoError.value = ''
  try {
    blob.value = await resizeImage(file)
  } catch {
    blob.value = file
  }
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = URL.createObjectURL(blob.value)
  emit('mood', 'happy')
}
async function keepPhoto() {
  saving.value = true
  let photoId = null
  try {
    photoId = await savePhoto(props.poi.id, blob.value)
  } catch {
    photoError.value = 'Foto tidak bisa disimpan di perangkat ini, tapi misimu tetap tercatat.'
  }
  saving.value = false
  emit('done', { type: 'photo', photoId })
}
onBeforeUnmount(() => preview.value && URL.revokeObjectURL(preview.value))
</script>

<template>
  <div v-if="m">
    <p class="eyebrow">Misi di sini</p>
    <p class="mt-1.5 text-[17px] font-semibold leading-snug text-ink">{{ m.title }}</p>
    <p class="mt-1 text-[14px] leading-relaxed text-muted">{{ m.prompt }}</p>

    <!-- Belum di lokasi -->
    <div v-if="!present" class="mt-4 rounded-2xl border border-dashed border-brand-300 bg-mint p-4 text-[13px] text-ink">
      <p class="flex items-center gap-2 font-bold"><Icon name="pin" :size="17" class="text-coral-500" /> Misi terbuka saat kamu di spot ini</p>
      <p class="mt-1 text-muted">
        <template v-if="distance != null">Kamu sekitar {{ formatDistance(Math.max(0, distance - poi.radius_m)) }} dari area {{ poi.short_name }}.</template>
        <template v-else>Aktifkan lokasi atau scan QR di papan spot untuk membuka misi.</template>
      </p>
      <div class="mt-3 flex gap-2">
        <button class="btn-outline min-h-10 flex-1 text-[13px]" :disabled="!location.position" @click="emit('navigate')">Arahkan ke sini</button>
        <button class="btn-ghost min-h-10 border border-line text-[13px]" @click="emit('go', '/qr')"><Icon name="qr" :size="15" /> Scan QR</button>
        <button v-if="!location.position && location.status !== 'active' && location.status !== 'requesting'" class="btn-ghost min-h-10 border border-line text-[13px]" @click="startLocation()">Lokasi</button>
      </div>
    </div>

    <!-- Konfirmasi -->
    <button v-else-if="m.type === 'confirm'" class="btn-primary mt-4 min-h-14 w-full text-base" @click="emit('done', { type: 'confirm' })">
      <Icon name="check" :size="20" :stroke="2.6" /> {{ m.done_label || 'Sudah!' }}
    </button>

    <!-- Timer -->
    <div v-else-if="m.type === 'timer'" class="mt-4 flex flex-col items-center">
      <div class="relative grid size-36 place-items-center">
        <svg viewBox="0 0 100 100" class="absolute inset-0 -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#e2ece9" stroke-width="8" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#3f9e8e" stroke-width="8" stroke-linecap="round" :stroke-dasharray="276.5" :stroke-dashoffset="276.5 * (1 - ring)" class="transition-[stroke-dashoffset] duration-300" />
        </svg>
        <span class="text-[34px] font-bold tabular-nums text-ink">{{ remaining }}<span class="text-[14px] font-semibold text-muted">dtk</span></span>
      </div>
      <button v-if="!running" class="btn-primary mt-4 min-h-13 w-full" @click="startTimer"><Icon name="play" :size="18" /> Mulai bareng Kia</button>
      <button v-else class="btn-outline mt-4 min-h-13 w-full" @click="stopTimer">Berhenti</button>
    </div>

    <!-- Foto -->
    <div v-else-if="m.type === 'photo'" class="mt-4">
      <input ref="fileInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onFile" />
      <div v-if="preview" class="overflow-hidden rounded-2xl bg-mint">
        <img :src="preview" alt="Foto misi" class="max-h-64 w-full object-cover" />
      </div>
      <p v-if="photoError" class="mt-2 text-[12px] text-coral-600">{{ photoError }}</p>
      <div class="mt-3 grid gap-2" :class="preview ? 'grid-cols-[1fr_auto]' : ''">
        <button v-if="preview" class="btn-primary min-h-13" :disabled="saving" @click="keepPhoto"><Icon name="check" :size="18" :stroke="2.6" /> Simpan ke Jurnal</button>
        <button :class="preview ? 'btn-outline min-h-13 px-4' : 'btn-primary min-h-14 text-base'" @click="fileInput.click()">
          <Icon name="camera" :size="19" /> {{ preview ? 'Ulang' : 'Buka kamera' }}
        </button>
      </div>
      <p class="mt-2 text-center text-[11px] text-muted">Foto hanya disimpan di ponselmu, tidak diunggah.</p>
    </div>

    <button class="mx-auto mt-3 block min-h-10 px-3 text-[13px] font-bold text-muted" @click="emit('skip')">Lewati misi</button>
  </div>
</template>
