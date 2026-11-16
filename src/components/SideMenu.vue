<script setup>
import { useRouter } from 'vue-router'
import Icon from "./Icon.vue"
import iconLocate from "../assets/icon-locate.png"
import { settings } from '../stores/settings'
import { setSimulation } from '../stores/location'
import { stampCount } from '../stores/visits'
import { content } from '../stores/content'

defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const router = useRouter()

const go = (to) => {
  emit('close')
  router.push(to)
}
const items = [
  { to: '/stamps', icon: 'award', label: 'Koleksi Stempel' },
  { to: '/summary', icon: 'flag', label: 'Ringkasan Kunjungan' },
  { to: '/trail', icon: 'trail', label: 'Wellness Trail' },
  { to: '/qr', icon: 'qr', label: 'Scan QR Spot' },
  { to: '/privacy', icon: 'shield', label: 'Privasi Lokasi' },
  { to: '/about', icon: 'info', label: 'Tentang & Sumber Data' },
]
const tools = [
  { to: '/log', icon: 'list', label: 'Log Trigger & Uji' },
  { to: '/print-qr', icon: 'printer', label: 'Cetak QR Spot' },
]
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="absolute inset-0 z-[950] bg-brand-950/40" @click="emit('close')" />
  </Transition>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="-translate-x-full"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="-translate-x-full"
  >
    <aside v-if="open" class="safe-top absolute inset-y-0 left-0 z-[960] flex w-[82%] max-w-[320px] flex-col bg-canvas shadow-2xl" aria-label="Menu">
      <div class="flex items-center justify-between px-5 pt-5">
        <div class="flex items-center gap-2 text-brand-900">
          <img :src="iconLocate" alt="" class="size-9" />
          <span class="text-lg font-extrabold tracking-[0.18em]">SETARA</span>
        </div>
        <button class="icon-btn" aria-label="Tutup menu" @click="emit('close')"><Icon name="x" /></button>
      </div>
      <p class="px-5 pt-1 text-xs text-muted">Sekitar Kiara Artha · {{ stampCount }}/{{ content.pois.length }} stempel</p>

      <nav class="mt-4 flex-1 overflow-y-auto px-3 pb-6">
        <button v-for="i in items" :key="i.to" class="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-ink hover:bg-white" @click="go(i.to)">
          <Icon :name="i.icon" :size="19" class="text-brand-600" /> {{ i.label }}
        </button>

        <div class="mx-3 my-3 border-t border-line" />
        <label class="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold">
          <Icon name="volume" :size="19" class="text-brand-600" />
          <span class="flex-1">Mode Audio<br /><span class="text-[11px] font-normal text-muted">Narasi otomatis saat trigger</span></span>
          <input v-model="settings.audioMode" type="checkbox" class="size-5 accent-brand-500" />
        </label>
        <label class="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold">
          <Icon name="walk" :size="19" class="text-brand-600" />
          <span class="flex-1">Panduan suara navigasi</span>
          <input v-model="settings.navVoice" type="checkbox" class="size-5 accent-brand-500" />
        </label>
        <label class="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold">
          <Icon name="pin" :size="19" class="text-coral-500" />
          <span class="flex-1">Mode Simulasi Lokasi<br /><span class="text-[11px] font-normal text-muted">Ketuk peta untuk berpindah (uji/demo)</span></span>
          <input :checked="settings.simulation" type="checkbox" class="size-5 accent-coral-500" @change="setSimulation($event.target.checked)" />
        </label>

        <div class="mx-3 my-3 border-t border-line" />
        <p class="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-subtle">Untuk tim & pengelola</p>
        <button v-for="i in tools" :key="i.to" class="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-ink hover:bg-white" @click="go(i.to)">
          <Icon :name="i.icon" :size="19" class="text-brand-600" /> {{ i.label }}
        </button>
      </nav>
    </aside>
  </Transition>
</template>
