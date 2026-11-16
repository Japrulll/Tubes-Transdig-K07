<script setup>
// UI11 Koleksi Stempel — A01
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '../components/TopBar.vue'
import Icon from '../components/Icon.vue'
import { content, getPoi } from '../stores/content'
import { visits, stampCount, badgeProgress, nextBadge } from '../stores/visits'

const router = useRouter()
const total = computed(() => content.pois.length)
const pct = computed(() => Math.round((stampCount.value / total.value) * 100))
const fmtDate = (t) => new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const missingText = (b) => {
  const left = b.need - b.have
  const names = b.missing.slice(0, 2).map((id) => getPoi(id)?.short_name).filter(Boolean).join(', ')
  if (left <= 0 && b.requires_trail) return 'Selesaikan satu Wellness Trail untuk membuka badge ini.'
  return `Kunjungi ${left} spot lagi${names ? `: ${names}${b.missing.length > 2 ? ', …' : ''}` : ''}.`
}
</script>

<template>
  <main class="flex flex-col bg-canvas">
    <TopBar title="Koleksi Stempel" back="/explore" />
    <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
      <p class="eyebrow">Progres kunjungan</p>
      <div class="mt-1 flex items-end justify-between">
        <p class="text-[26px] font-semibold leading-none text-ink">{{ stampCount }} <span class="text-[14px] font-medium text-muted">/ {{ total }} spot</span></p>
        <p class="text-[13px] font-bold text-brand-600">{{ pct }}%</p>
      </div>
      <div class="mt-3 h-2 overflow-hidden rounded-full bg-line">
        <div class="h-full rounded-full bg-brand-500 transition-[width] duration-500" :style="{ width: `${pct}%` }" />
      </div>

      <ul class="mt-6 grid grid-cols-4 gap-x-3 gap-y-4">
        <li v-for="p in content.pois" :key="p.id">
          <button class="flex w-full flex-col items-center gap-1.5" :aria-label="`${p.name}: ${visits.stamps[p.id] ? 'sudah dikunjungi' : 'belum dikunjungi'}`" @click="router.push(`/poi/${p.id}`)">
            <span
              class="relative grid aspect-square w-full max-w-[64px] place-items-center rounded-full text-[12px] font-extrabold"
              :class="visits.stamps[p.id] ? 'border-2 border-brand-300 bg-brand-100 text-brand-800' : 'border-2 border-dashed border-line text-subtle'"
            >
              {{ p.id }}
              <span v-if="visits.stamps[p.id]" class="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-canvas bg-brand-500 text-white">
                <Icon name="check" :size="10" :stroke="3.5" />
              </span>
            </span>
            <span class="w-full truncate text-center text-[10px]" :class="visits.stamps[p.id] ? 'font-semibold text-ink' : 'text-subtle'">
              {{ visits.stamps[p.id] ? p.short_name : 'Belum' }}
            </span>
          </button>
        </li>
      </ul>

      <div v-if="nextBadge" class="mt-6 flex gap-3 rounded-2xl border border-sun-300/60 bg-sun-100 p-4">
        <span class="grid size-14 shrink-0 place-items-center rounded-full bg-sun-400 text-white shadow-[inset_0_-3px_0_rgb(0_0_0/0.08)]"><Icon name="award" :size="26" /></span>
        <div class="min-w-0 flex-1">
          <p class="text-[9px] font-extrabold uppercase tracking-[0.12em] text-sun-600">Badge berikutnya</p>
          <p class="mt-0.5 text-[15px] font-semibold text-ink">{{ nextBadge.name }}</p>
          <p class="mt-0.5 text-[11px] text-muted">{{ missingText(nextBadge) }}</p>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
            <div class="h-full rounded-full bg-sun-400" :style="{ width: `${nextBadge.progress * 100}%` }" />
          </div>
        </div>
      </div>

      <section class="mt-6">
        <p class="eyebrow">Semua badge</p>
        <ul class="mt-2 grid grid-cols-2 gap-2">
          <li v-for="b in badgeProgress" :key="b.id" class="card flex items-center gap-2.5 p-3" :class="b.done ? '' : 'opacity-70'">
            <span class="grid size-9 shrink-0 place-items-center rounded-full" :class="b.done ? 'bg-sun-400 text-white' : 'bg-line text-subtle'"><Icon name="award" :size="17" /></span>
            <span class="min-w-0">
              <span class="block truncate text-[12px] font-bold text-ink">{{ b.name }}</span>
              <span class="block text-[10px] text-muted">{{ b.done ? 'Diperoleh' : `${b.have}/${b.need} spot${b.requires_trail ? ' + trail' : ''}` }}</span>
            </span>
          </li>
        </ul>
      </section>

      <section v-if="stampCount" class="mt-6">
        <p class="eyebrow">Riwayat stempel</p>
        <ul class="mt-2 divide-y divide-line rounded-2xl border border-line bg-white">
          <li v-for="[id, s] in Object.entries(visits.stamps).sort((a, b) => b[1].at - a[1].at)" :key="id" class="flex items-center justify-between px-4 py-2.5 text-[12px]">
            <span class="font-semibold text-ink">{{ id }} · {{ getPoi(id)?.short_name }}</span>
            <span class="text-muted">{{ fmtDate(s.at) }} · {{ s.source === 'qr' ? 'QR' : 'GPS' }}</span>
          </li>
        </ul>
      </section>

      <button class="mx-auto mt-6 flex items-center gap-1.5 text-[13px] font-bold text-brand-700" @click="router.push('/summary')">
        Lihat ringkasan kunjungan <Icon name="arrow-right" :size="16" />
      </button>
    </div>
  </main>
</template>
