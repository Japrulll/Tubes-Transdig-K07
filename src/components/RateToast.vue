<script setup>
// Ajakan rating singkat saat pengguna meninggalkan spot yang tantangannya dilewati.
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Kia from './Kia.vue'
import Icon from './Icon.vue'
import { ui } from '../stores/ui'
import { getPoi } from '../stores/content'
import { geofence } from '../stores/geofence'
import { rateSpot, level } from '../stores/play'

const route = useRoute()
const poi = computed(() => (ui.ratePrompt ? getPoi(ui.ratePrompt) : null))
const show = computed(() => poi.value && !ui.challenge && !geofence.active && route.name !== 'onboarding')
const thanks = ref(null)
let timer = null

watch(
  () => ui.ratePrompt,
  () => {
    thanks.value = null
    clearTimeout(timer)
    timer = setTimeout(() => (ui.ratePrompt = null), 25000) // hilang sendiri bila diabaikan
  }
)

function rate(n) {
  const { xp } = rateSpot(poi.value.id, n)
  thanks.value = xp
  clearTimeout(timer)
  timer = setTimeout(() => (ui.ratePrompt = null), 1600)
}
</script>

<template>
  <Transition name="sheet-up">
    <div v-if="show" class="absolute inset-x-3 bottom-3 z-[880] rounded-[1.5rem] border border-line bg-white p-3.5 shadow-[var(--shadow-float)]" role="dialog" :aria-label="`Nilai ${poi.short_name}`">
      <div class="flex items-center gap-2.5">
        <Kia :mood="thanks != null ? 'cheer' : 'think'" :stage="level.level" :size="42" class="shrink-0" />
        <p class="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-ink">
          <template v-if="thanks != null">Hatur nuhun!<span v-if="thanks" class="text-brand-600"> +{{ thanks }} XP</span></template>
          <template v-else>Gimana {{ poi.short_name }} tadi? Kasih nilai, yuk.</template>
        </p>
        <button class="icon-btn -mr-1 size-9 shrink-0 text-muted" aria-label="Tutup" @click="ui.ratePrompt = null"><Icon name="x" :size="18" /></button>
      </div>
      <div v-if="thanks == null" class="mt-2 flex justify-between gap-1">
        <button v-for="n in 5" :key="n" class="grid h-11 flex-1 place-items-center rounded-xl bg-mint text-sun-400 transition active:scale-90" :aria-label="`${n} bintang`" @click="rate(n)">
          <Icon name="star" :size="22" :stroke="1.8" />
        </button>
      </div>
    </div>
  </Transition>
</template>
