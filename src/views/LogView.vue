<script setup>
// Log trigger & alat uji lapangan (bukti PB06/PB07, uji skenario rekomendasi F07)
import { computed } from 'vue'
import TopBar from '../components/TopBar.vue'
import Icon from '../components/Icon.vue'
import { geofence, clearTriggerState } from '../stores/geofence'
import { location } from '../stores/location'
import { content, getPoi } from '../stores/content'
import { save } from '../lib/storage'
import { timeOverride, timeSlot, SLOTS } from '../lib/time'
import { formatDistance } from '../lib/geo'

const fmt = (t) => new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const rows = computed(() =>
  content.pois
    .map((p) => ({ p, d: geofence.distances[p.id], inside: !!geofence.inside[p.id] }))
    .sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9))
)
const scenarios = [
  { label: 'Jam asli', h: null },
  { label: 'Pagi 07.00', h: 7 },
  { label: 'Siang 12.00', h: 12 },
  { label: 'Sore 16.00', h: 16 },
  { label: 'Malam 19.00', h: 19 },
]
function clearLog() {
  geofence.log = []
  save('triggerLog', [])
}
function exportCsv() {
  const head = 'waktu,poi,sumber,jarak_m,akurasi_m'
  const body = geofence.log.map((l) => [new Date(l.at).toISOString(), l.poi, l.source, l.distance ?? '', l.accuracy ?? ''].join(','))
  const blob = new Blob([[head, ...body].join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `setara-trigger-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}
</script>

<template>
  <main class="flex flex-col bg-canvas">
    <TopBar title="Log Trigger & Uji" />
    <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
      <section class="card p-4">
        <p class="eyebrow">Status GPS</p>
        <div class="mt-2 grid grid-cols-3 gap-2 text-center">
          <div class="stat"><span class="stat-value text-[15px]">{{ location.position ? `±${Math.round(location.position.accuracy)}` : '–' }}<span class="stat-unit">m</span></span><span class="stat-label">Akurasi</span></div>
          <div class="stat"><span class="stat-value text-[15px]">{{ location.updates }}</span><span class="stat-label">Pembaruan</span></div>
          <div class="stat">
            <span class="stat-value text-[15px]">{{ location.firstFixAt && location.requestedAt ? ((location.firstFixAt - location.requestedAt) / 1000).toFixed(1) : '–' }}<span class="stat-unit">dtk</span></span>
            <span class="stat-label">Fix pertama</span>
          </div>
        </div>
        <p class="mt-2 text-[11px] text-muted">Pembacaan dengan akurasi &gt; 30 m diabaikan. {{ location.weak ? 'Sinyal saat ini lemah.' : '' }}</p>
      </section>

      <section class="mt-4 card p-4">
        <p class="eyebrow">Skenario waktu (uji F07)</p>
        <p class="mt-1 text-[11px] text-muted">Slot saat ini: <b class="text-ink">{{ SLOTS[timeSlot()].label }}</b>. Rekomendasi & jadwal mengikuti jam yang dipilih.</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button v-for="s in scenarios" :key="s.label" class="chip" :class="timeOverride === s.h ? 'chip-active' : ''" @click="timeOverride = s.h">{{ s.label }}</button>
        </div>
      </section>

      <section class="mt-4 card p-4">
        <p class="eyebrow">Jarak ke tiap POI</p>
        <table class="mt-2 w-full text-[12px]">
          <thead class="text-left text-subtle"><tr><th class="py-1 font-semibold">POI</th><th class="font-semibold">Radius</th><th class="font-semibold">Jarak</th><th class="font-semibold">Status</th></tr></thead>
          <tbody>
            <tr v-for="r in rows" :key="r.p.id" class="border-t border-line">
              <td class="py-1.5 font-semibold text-ink">{{ r.p.id }} <span class="font-normal text-muted">{{ r.p.short_name }}</span></td>
              <td>{{ r.p.radius_m }} m</td>
              <td class="tabular-nums">{{ r.d != null ? formatDistance(r.d) : '–' }}</td>
              <td><span v-if="r.inside" class="font-bold text-brand-600">di dalam</span><span v-else class="text-subtle">di luar</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="mt-4 card p-4">
        <div class="flex items-center justify-between">
          <p class="eyebrow">Riwayat trigger ({{ geofence.log.length }})</p>
          <div class="flex gap-1">
            <button class="icon-btn size-9" aria-label="Unduh CSV" :disabled="!geofence.log.length" @click="exportCsv"><Icon name="arrow-right" :size="16" class="rotate-90" /></button>
            <button class="icon-btn size-9" aria-label="Hapus log" @click="clearLog"><Icon name="x" :size="16" /></button>
          </div>
        </div>
        <ul class="mt-2 divide-y divide-line text-[12px]">
          <li v-for="(l, i) in geofence.log" :key="i" class="flex justify-between py-2">
            <span><b>{{ l.poi }}</b> {{ getPoi(l.poi)?.short_name }}</span>
            <span class="text-muted">{{ fmt(l.at) }} · {{ l.source }}<template v-if="l.distance != null"> · {{ l.distance }} m</template><template v-if="l.accuracy != null"> · ±{{ l.accuracy }} m</template></span>
          </li>
          <li v-if="!geofence.log.length" class="py-3 text-muted">Belum ada trigger.</li>
        </ul>
        <button class="btn-ghost mt-2 min-h-10 w-full text-[12px]" @click="clearTriggerState">Reset status "di dalam" semua POI</button>
      </section>
    </div>
  </main>
</template>
