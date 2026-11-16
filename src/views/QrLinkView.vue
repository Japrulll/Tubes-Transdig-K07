<script setup>
// Deep link dari QR papan spot (dipindai dengan kamera ponsel biasa): #/qr/P04
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPoi } from '../stores/content'
import { fireTrigger } from '../stores/geofence'
import { settings } from '../stores/settings'
import { parsePoiCode } from '../lib/qr'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const poi = getPoi(parsePoiCode(`SETARA:${route.params.id}`))
  if (!poi) return router.replace('/explore')
  settings.onboarded = true
  fireTrigger(poi, { source: 'qr' })
  router.replace('/explore')
})
</script>

<template>
  <main class="grid place-items-center bg-canvas text-sm text-muted">Membuka spot…</main>
</template>
