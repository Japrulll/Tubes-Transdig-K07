<script setup>
// Lembar QR untuk dipasang di papan tiap POI (PB11)
import { onMounted, ref } from 'vue'
import TopBar from '../components/TopBar.vue'
import Icon from '../components/Icon.vue'
import { content, categoryById } from '../stores/content'
import { qrPayload } from '../lib/qr'

const codes = ref({})
const printPage = () => window.print()
onMounted(async () => {
  const QRCode = (await import('qrcode')).default
  for (const p of content.pois) {
    codes.value[p.id] = await QRCode.toString(qrPayload(p.id), { type: 'svg', margin: 1, color: { dark: '#0d4f4a', light: '#ffffff' } })
  }
})
</script>

<template>
  <main class="flex flex-col bg-canvas print:bg-white">
    <TopBar title="Cetak QR Spot" class="no-print">
      <template #right>
        <button class="icon-btn" aria-label="Cetak" @click="printPage"><Icon name="printer" /></button>
      </template>
    </TopBar>
    <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4 print:overflow-visible">
      <p class="no-print mb-3 text-[12px] leading-relaxed text-muted">
        Setiap QR berisi tautan <code class="rounded bg-white px-1">{{ qrPayload('P01').replace('P01', 'Pxx') }}</code>. Dapat dipindai dengan menu Scan QR di SETARA maupun kamera ponsel biasa.
      </p>
      <ul class="grid grid-cols-2 gap-3 print:grid-cols-3">
        <li v-for="p in content.pois" :key="p.id" class="card flex break-inside-avoid flex-col items-center p-3 text-center">
          <p class="text-[9px] font-extrabold uppercase tracking-[0.14em] text-brand-700">SETARA · Spot {{ p.number }}</p>
          <div class="mt-2 w-full max-w-[150px] [&_svg]:h-auto [&_svg]:w-full" v-html="codes[p.id] || ''" />
          <p class="mt-2 text-[12px] font-bold leading-tight text-ink">{{ p.name }}</p>
          <p class="text-[10px] text-muted">{{ categoryById[p.category_id]?.label }} · Pindai untuk cerita & stempel</p>
        </li>
      </ul>
    </div>
  </main>
</template>
