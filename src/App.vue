<script setup>
import { computed, onMounted, ref, provide } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import TriggerSheet from './components/TriggerSheet.vue'
import SideMenu from './components/SideMenu.vue'
import Icon from './components/Icon.vue'
import { settings } from './stores/settings'
import { startLocation, permissionState, location } from './stores/location'
import { unlockAudio } from './lib/audio'
import './stores/geofence'
import './stores/navigation'
import './stores/trail'

const route = useRoute()
const showTabs = computed(() => route.meta.tabs)
const menuOpen = ref(false)
provide('openMenu', () => (menuOpen.value = true))

const online = ref(navigator.onLine)
window.addEventListener('online', () => (online.value = true))
window.addEventListener('offline', () => (online.value = false))

// Buka kunci audio (TTS/nada) pada ketukan pertama — wajib di iOS/Android
window.addEventListener('pointerdown', unlockAudio, { once: true })

onMounted(async () => {
  // Lanjutkan pelacakan lokasi bila izin sudah pernah diberikan
  if (settings.onboarded && (settings.simulation || (await permissionState()) === 'granted')) startLocation()
})
</script>

<template>
  <div class="mx-auto flex h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-canvas shadow-[0_0_60px_-20px_rgb(13_79_74/0.35)] sm:my-0">
    <div class="relative min-h-0 flex-1">
      <!-- Animasi masuk murni CSS: perpindahan halaman tidak pernah menunggu frame animasi -->
      <RouterView v-slot="{ Component }">
        <component :is="Component" :key="route.path" class="view-enter absolute inset-0" />
      </RouterView>

      <div
        v-if="!online && route.name !== 'onboarding'"
        class="pointer-events-none absolute left-1/2 top-[calc(env(safe-area-inset-top)+64px)] z-[700] -translate-x-1/2 rounded-full bg-brand-950/85 px-3 py-1.5 text-[11px] font-semibold text-white"
      >
        <span class="inline-flex items-center gap-1.5"><Icon name="wifi-off" :size="13" /> Mode offline: konten tersimpan tetap berfungsi</span>
      </div>

      <TriggerSheet />
      <SideMenu :open="menuOpen" @close="menuOpen = false" />
    </div>
    <BottomNav v-if="showTabs" />
    <span class="sr-only" aria-live="polite">{{ location.message }}</span>
  </div>
</template>
