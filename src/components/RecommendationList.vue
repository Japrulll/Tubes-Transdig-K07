<script setup>
// F07: 2–3 rekomendasi POI berikutnya (kartu seperti "Lanjut Jelajah" di Figma)
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Icon from './Icon.vue'
import PoiThumb from './PoiThumb.vue'
import { recommend } from '../lib/recommend'
import { location } from '../stores/location'
import { visits } from '../stores/visits'
import { now, timeOverride } from '../lib/time'

const props = defineProps({
  from: { type: Object, default: null }, // POI asal
  exclude: { type: Array, default: () => [] },
  title: { type: String, default: 'Rekomendasi untuk Anda' },
  eyebrow: { type: String, default: 'Lanjut jelajah' },
})
const router = useRouter()

const items = computed(() => {
  // dependensi reaktif: jam, stempel, posisi
  void now.value
  void timeOverride.value
  void Object.keys(visits.stamps).length
  const origin = location.position || props.from
  return recommend({ from: origin, exclude: [...props.exclude, props.from?.id].filter(Boolean), limit: 3 })
})
</script>

<template>
  <section v-if="items.length">
    <p class="eyebrow">{{ eyebrow }}</p>
    <h3 class="mt-1 text-[15px] font-semibold text-ink">{{ title }}</h3>
    <ul class="mt-3 space-y-2">
      <li v-for="r in items" :key="r.poi.id">
        <button
          class="card flex w-full items-center gap-3 p-2.5 pr-3 text-left transition hover:border-brand-200 active:scale-[0.99]"
          @click="router.push(`/poi/${r.poi.id}`)"
        >
          <PoiThumb :poi="r.poi" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13px] font-bold text-ink">{{ r.poi.name }}</p>
            <p class="truncate text-[11px] text-muted">{{ r.meta }}</p>
          </div>
          <Icon name="arrow-right" :size="18" class="text-brand-700" />
        </button>
      </li>
    </ul>
  </section>
  <p v-else class="rounded-2xl bg-mint p-4 text-[13px] text-muted">Semua spot sudah Anda kunjungi. Hebat!</p>
</template>
