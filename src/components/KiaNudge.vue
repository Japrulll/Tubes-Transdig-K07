<script setup>
// Kia di peta: tombol Tanya Kia + ajakan kontekstual (spot saat ini, air mancur,
// Tantangan Hari Ini, badge terdekat, kunjungan mingguan). Mode tenang menyembunyikan ajakan.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Kia from './Kia.vue'
import Icon from './Icon.vue'
import { settings } from '../stores/settings'
import { currentPoi } from '../stores/geofence'
import { getPoi } from '../stores/content'
import { location, requestCompass } from '../stores/location'
import { startNavigation } from '../stores/navigation'
import { play, level, daily, nextBadge, streak, starsOf, dayKey, weekKey } from '../stores/play'
import { ui, openKia, openChallenge } from '../stores/ui'
import { nextSchedule, countdownLabel, now } from '../lib/time'

const router = useRouter()
const HIDE_MS = 6 * 3600 * 1000
const dismissedRecently = (key) => play.dismissed[key] && now.value - play.dismissed[key] < HIDE_MS

const nudge = computed(() => {
  if (settings.quiet) return null
  const list = []
  const here = currentPoi.value?.poi
  if (here && starsOf(here.id) < 3)
    list.push({ key: `here:${here.id}:${dayKey(now.value)}`, mood: 'wave', text: `Kamu di ${here.short_name}. Masih ada ${3 - starsOf(here.id)} bintang di sini!`, cta: 'Ikut tantangan', run: () => openChallenge(here.id) })
  const show = nextSchedule(getPoi('P03'))
  if (show && (show.ongoing || show.minutesUntil <= 45))
    list.push({ key: `show:${dayKey(now.value)}:${show.start}`, mood: 'cheer', text: show.ongoing ? 'Air mancur menari sedang tampil sekarang!' : `Air mancur menari ${countdownLabel(show).toLowerCase()}!`, cta: 'Ke danau', run: () => go('P03') })
  const d = daily.value
  if (d && !d.done && !d.expired)
    list.push({ key: `daily:${dayKey(now.value)}`, mood: 'happy', text: `Tantangan hari ini: ${d.title} (${d.progress}/${d.goal_count}). ${d.description}`, cta: 'Tanya Kia', run: () => openKia('Tantangan hari ini apa?') })
  const b = nextBadge.value
  if (b && b.progress >= 0.5 && b.need - b.have > 0)
    list.push({ key: `badge:${b.id}:${b.have}`, mood: 'happy', text: `${b.need - b.have} lagi menuju badge ${b.name}.`, cta: 'Lihat koleksi', run: () => router.push('/stamps') })
  if (streak.value.weeks >= 2 && streak.value.thisWeek)
    list.push({ key: `streak:${weekKey(now.value)}`, mood: 'cheer', text: `Kunjungan ${streak.value.weeks} minggu berturut-turut. Pertahankan, ya!`, cta: 'Lihat progres', run: () => router.push('/stamps') })
  if (!play.xp) list.push({ key: 'hello', mood: 'wave', text: 'Halo, aku Kia! Ketuk aku untuk bertanya apa saja soal taman.', cta: 'Tanya Kia', run: () => openKia() })
  return list.find((n) => !dismissedRecently(n.key)) || null
})

function go(id) {
  if (!location.position) return router.push(`/poi/${id}`)
  requestCompass()
  startNavigation(id)
  router.push(`/navigate/${id}`)
}
function run() {
  const n = nudge.value
  play.dismissed[n.key] = now.value
  n.run()
}
function dismiss() {
  play.dismissed[nudge.value.key] = now.value
}
</script>

<template>
  <div class="flex items-end gap-2">
    <button
      class="pointer-events-auto grid size-14 shrink-0 place-items-center rounded-full border-2 border-white bg-mint shadow-[var(--shadow-float)] transition active:scale-95"
      aria-label="Tanya Kia"
      @click="openKia()"
    >
      <Kia :mood="nudge?.mood || 'happy'" :stage="level.level" :size="46" />
    </button>
    <Transition name="fade">
      <div v-if="nudge && !ui.kiaOpen" :key="nudge.key" class="pointer-events-auto mb-1 flex w-[min(250px,calc(100vw-150px))] items-start gap-1 rounded-2xl rounded-bl-md border border-line bg-white py-2 pl-3 pr-1 shadow-[var(--shadow-float)]">
        <button class="min-w-0 flex-1 text-left" @click="run">
          <span class="block text-[12px] font-semibold leading-snug text-ink">{{ nudge.text }}</span>
          <span class="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-bold text-brand-700">{{ nudge.cta }} <Icon name="chevron-right" :size="13" :stroke="2.6" /></span>
        </button>
        <button class="grid size-7 shrink-0 place-items-center rounded-full text-subtle hover:bg-canvas" aria-label="Tutup ajakan Kia" @click="dismiss"><Icon name="x" :size="14" /></button>
      </div>
    </Transition>
  </div>
</template>
