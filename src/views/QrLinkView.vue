<script setup>
// Deep link dari QR papan spot (dipindai dengan kamera ponsel biasa): #/qr/P05
// ID lama (mis. P12 → P10) tetap dikenali; kode yang tidak ada lagi diberi penjelasan.
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import { getPoi } from '../stores/content'
import { fireTrigger } from '../stores/geofence'
import { settings } from '../stores/settings'
import { parsePoiCode } from '../lib/qr'
import { RETIRED_POIS } from '../lib/poiIds'

const route = useRoute()
const router = useRouter()
const problem = ref(null)

onMounted(() => {
  const id = parsePoiCode(`SETARA:${route.params.id}`)
  const poi = getPoi(id)
  if (!poi) {
    problem.value = {
      code: String(route.params.id || '').toUpperCase(),
      text: RETIRED_POIS[id] || 'Kode spot ini tidak dikenali. Mungkin QR-nya sudah lama atau salah cetak.',
    }
    return
  }
  settings.onboarded = true
  fireTrigger(poi, { source: 'qr' })
  router.replace('/explore')
})
</script>

<template>
  <main class="grid place-items-center bg-canvas px-6 text-center">
    <p v-if="!problem" class="text-sm text-muted">Membuka spot…</p>
    <div v-else class="max-w-xs" role="alert">
      <span class="mx-auto grid size-14 place-items-center rounded-2xl bg-coral-500/10 text-coral-600"><Icon name="info" :size="26" /></span>
      <h1 class="mt-4 text-lg font-bold text-ink">Spot {{ problem.code }} tidak ditemukan</h1>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">{{ problem.text }}</p>
      <div class="mt-6 flex flex-col gap-2">
        <button class="btn-primary min-h-12 w-full" @click="router.replace('/explore')"><Icon name="compass" :size="18" /> Lihat semua spot</button>
        <button class="btn-ghost min-h-12 w-full" @click="router.replace('/qr')"><Icon name="qr" :size="18" /> Scan QR lain</button>
      </div>
    </div>
  </main>
</template>
