<script setup>
// Tombol Mode Audio (F04) — sama seperti pill "Audio" di Figma
import Icon from './Icon.vue'
import { settings } from '../stores/settings'
import { speak, stopSpeech, unlockAudio } from '../lib/audio'

function toggle() {
  unlockAudio()
  settings.audioMode = !settings.audioMode
  if (settings.audioMode) speak('Mode Audio aktif. Narasi akan diputar otomatis saat Anda mendekati spot.', { key: 'mode' })
  else stopSpeech()
}
</script>

<template>
  <button
    class="inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold shadow-[var(--shadow-card)] transition active:scale-95"
    :class="settings.audioMode ? 'border-brand-500 bg-brand-500 text-white' : 'border-line bg-white text-brand-800'"
    :aria-pressed="settings.audioMode"
    aria-label="Mode Audio"
    @click="toggle"
  >
    <Icon :name="settings.audioMode ? 'volume' : 'volume-off'" :size="15" :stroke="2.4" />
    Audio
  </button>
</template>
