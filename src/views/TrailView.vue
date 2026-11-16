<script setup>
// UI09 Wellness Trail — F08 (checkpoint audio, pencatat jarak/durasi, stempel penyelesaian), F04
import { computed, inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import ParkMap from '../components/ParkMap.vue'
import Icon from '../components/Icon.vue'
import AudioPill from '../components/AudioPill.vue'
import { content } from '../stores/content'
import { location, setSimulatedPosition, startLocation } from '../stores/location'
import { settings } from '../stores/settings'
import { trail, activeTrail, elapsed, nextCheckpoint, lastCheckpoint, startTrail, pauseTrail, resumeTrail, finishTrail, closeTrail } from '../stores/trail'
import { formatKm, formatClock, formatDistance, haversine } from '../lib/geo'
import { speak, speakingKey, unlockAudio } from '../lib/audio'
import { timeSlot } from '../lib/time'

const router = useRouter()
const openMenu = inject('openMenu')
const pickedId = ref(content.trails.find((t) => t.best_times.includes(timeSlot()))?.id || content.trails[0]?.id)
const picked = computed(() => content.trails.find((t) => t.id === pickedId.value))
const running = computed(() => trail.status === 'running' || trail.status === 'paused')
const shown = computed(() => (running.value || trail.status === 'done' ? activeTrail.value : picked.value))
const mapTrail = computed(() => shown.value && { path: shown.value.path, checkpoints: shown.value.checkpoints, reached: running.value || trail.status === 'done' ? trail.reached : [] })
const cpCard = computed(() => lastCheckpoint.value || nextCheckpoint.value)
const distToNext = computed(() => {
  const c = nextCheckpoint.value
  if (!c || !location.position) return null
  return haversine(location.position, { lat: c.coords[0], lng: c.coords[1] })
})
const result = computed(() => trail.result)

function start(id) {
  unlockAudio()
  if (!location.position) startLocation()
  startTrail(id)
}
function replayCoaching() {
  const c = cpCard.value
  if (c) speak(trail.reached.includes(c.seq) ? c.coaching : `Menuju ${c.name}.`, { key: `cp:${c.seq}` })
}
function onMapClick(ll) {
  if (settings.simulation) setSimulatedPosition(ll)
}
</script>

<template>
  <main class="flex flex-col bg-canvas">
    <!-- Peta rute -->
    <div class="relative h-[42%] min-h-[230px] shrink-0">
      <ParkMap
        v-if="shown"
        :key="shown.id"
        :user="location.position"
        :trail="mapTrail"
        :show-pois="false"
        :follow="trail.status === 'running'"
        @map-click="onMapClick"
      />
      <div class="safe-top pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-center justify-between px-4 pt-2">
        <button class="pointer-events-auto grid size-11 place-items-center rounded-full bg-white text-ink shadow-[var(--shadow-card)]" aria-label="Buka menu" @click="openMenu()">
          <Icon name="menu" :size="21" />
        </button>
        <span class="pill pointer-events-auto">
          <Icon name="walk" :size="14" />
          {{ running ? (trail.status === 'paused' ? 'Rute dijeda' : 'Rute aktif') : trail.status === 'done' ? 'Trail selesai' : 'Pratinjau rute' }}
        </span>
        <span class="pointer-events-auto"><AudioPill /></span>
      </div>
    </div>

    <!-- Konten -->
    <div class="relative -mt-5 min-h-0 flex-1 overflow-y-auto rounded-t-[1.75rem] bg-white px-5 pb-6 pt-5">
      <!-- Selesai -->
      <template v-if="trail.status === 'done' && result">
        <div class="flex flex-col items-center text-center">
          <div class="grid size-20 place-items-center rounded-full border-4 border-brand-200 text-white" :class="result.complete ? 'bg-brand-500' : 'bg-subtle'">
            <Icon :name="result.complete ? 'award' : 'flag'" :size="34" />
          </div>
          <p class="eyebrow mt-4">{{ result.complete ? 'Stempel Wellness diperoleh' : 'Trail diakhiri' }}</p>
          <h2 class="mt-1 text-[22px] font-medium text-ink">{{ activeTrail?.name }}</h2>
          <p class="mt-1 text-[13px] text-muted">{{ result.complete ? 'Semua checkpoint tercapai. Kerja bagus!' : `${result.reached} dari ${result.total} checkpoint tercapai.` }}</p>
        </div>
        <div class="mt-5 grid grid-cols-3 gap-2">
          <div class="stat"><span class="stat-value">{{ formatKm(result.distanceM) }}<span class="stat-unit">km</span></span><span class="stat-label">Jarak</span></div>
          <div class="stat"><span class="stat-value">{{ formatClock(result.durationMs) }}</span><span class="stat-label">Durasi</span></div>
          <div class="stat"><span class="stat-value">{{ result.reached }}/{{ result.total }}</span><span class="stat-label">Checkpoint</span></div>
        </div>
        <div class="mt-5 grid gap-2.5">
          <button class="btn-primary" @click="closeTrail(); router.push('/summary')">Lihat ringkasan kunjungan</button>
          <button class="btn-outline" @click="closeTrail()">Pilih trail lain</button>
        </div>
      </template>

      <!-- Trail aktif -->
      <template v-else-if="running && activeTrail">
        <p class="eyebrow">Rute wellness</p>
        <h2 class="mt-1 text-[20px] font-medium text-ink">{{ activeTrail.name }}</h2>
        <p class="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
          <Icon name="trail" :size="14" /> {{ formatKm(activeTrail.distance_m) }} km · sekitar {{ activeTrail.est_minutes }} menit
        </p>
        <div class="mt-4 grid grid-cols-3 gap-2" aria-live="polite">
          <div class="stat"><span class="stat-value">{{ formatKm(trail.distanceM) }}<span class="stat-unit">km</span></span><span class="stat-label">Jarak</span></div>
          <div class="stat"><span class="stat-value tabular-nums">{{ formatClock(elapsed) }}</span><span class="stat-label">Durasi</span></div>
          <div class="stat"><span class="stat-value">{{ trail.reached.length }}/{{ activeTrail.checkpoints.length }}</span><span class="stat-label">Checkpoint</span></div>
        </div>

        <div v-if="cpCard" class="mt-4 flex items-center gap-3 rounded-2xl border border-line p-3">
          <button class="grid size-11 shrink-0 place-items-center rounded-full bg-brand-500 text-white" :aria-label="`Putar panduan ${cpCard.name}`" @click="replayCoaching">
            <Icon :name="speakingKey?.startsWith('cp:') ? 'pause' : 'play'" :size="18" />
          </button>
          <div class="min-w-0 flex-1">
            <p class="eyebrow text-[9px]">
              Checkpoint {{ cpCard.seq }} · {{ trail.reached.includes(cpCard.seq) ? 'tercapai' : distToNext != null ? `${formatDistance(distToNext)} lagi` : 'berikutnya' }}
            </p>
            <p class="truncate text-[14px] font-semibold text-ink">{{ cpCard.name }}</p>
            <p class="truncate text-[11px] italic text-muted">“{{ cpCard.exercise }}: {{ cpCard.coaching.split('. ').slice(1, 2).join('') || cpCard.coaching }}”</p>
          </div>
          <Icon name="volume" :size="20" class="shrink-0 text-brand-700" />
        </div>

        <ol class="mt-4 space-y-1.5">
          <li v-for="c in activeTrail.checkpoints" :key="c.seq" class="flex items-center gap-3 text-[13px]">
            <span class="cp-dot shrink-0" :class="trail.reached.includes(c.seq) ? 'is-done' : ''">{{ c.seq }}</span>
            <span :class="trail.reached.includes(c.seq) ? 'text-muted line-through' : 'text-ink'">{{ c.name }}</span>
            <span class="ml-auto text-[11px] text-subtle">{{ c.exercise }}</span>
          </li>
        </ol>

        <div class="mt-5 grid grid-cols-2 gap-2.5">
          <button v-if="trail.status === 'running'" class="btn-outline min-h-13" @click="pauseTrail"><Icon name="pause" :size="16" /> Jeda</button>
          <button v-else class="btn-outline min-h-13" @click="resumeTrail"><Icon name="play" :size="16" /> Lanjut</button>
          <button class="btn-primary min-h-13" @click="finishTrail">Selesai</button>
        </div>
        <p v-if="settings.simulation" class="mt-3 text-center text-[11px] text-coral-600">Mode simulasi: ketuk peta di dekat checkpoint untuk berpindah.</p>
      </template>

      <!-- Pilih trail -->
      <template v-else>
        <p class="eyebrow">Wellness Trail</p>
        <h2 class="mt-1 text-[20px] font-medium text-ink">Jalan & jogging berpemandu audio</h2>
        <p class="mt-1 text-[13px] leading-relaxed text-muted">Setiap checkpoint memutar info spot dan ajakan peregangan. Jarak dan durasi tercatat otomatis.</p>
        <div class="mt-4 space-y-3">
          <button
            v-for="t in content.trails"
            :key="t.id"
            class="card w-full p-4 text-left transition"
            :class="pickedId === t.id ? 'border-brand-400 ring-2 ring-brand-100' : ''"
            @click="pickedId = t.id"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-[15px] font-semibold text-ink">{{ t.name }}</p>
              <span class="rounded-full px-2 py-0.5 text-[10px] font-bold" :style="{ background: t.color + '1f', color: t.color }">{{ t.level }}</span>
            </div>
            <p class="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
              <Icon name="trail" :size="13" /> {{ formatKm(t.distance_m) }} km · sekitar {{ t.est_minutes }} menit · {{ t.checkpoints.length }} checkpoint
            </p>
            <p v-if="pickedId === t.id" class="mt-2 text-[12px] leading-relaxed text-muted">{{ t.description }}</p>
            <div v-if="pickedId === t.id" class="mt-3 flex flex-wrap gap-1.5">
              <span v-for="c in t.checkpoints" :key="c.seq" class="rounded-full bg-mint px-2 py-1 text-[10px] font-semibold text-brand-800">{{ c.seq }}. {{ c.name }}</span>
            </div>
          </button>
        </div>
        <button class="btn-primary mt-5 min-h-14 w-full" :disabled="!picked" @click="start(pickedId)"><Icon name="play" :size="16" /> Mulai {{ picked?.name }}</button>
        <p class="mt-2 text-center text-[11px] text-muted">Mulai dari checkpoint 1. Trail bisa dijeda kapan saja.</p>
      </template>
    </div>
  </main>
</template>
