<script setup>
// UI11 Koleksi Stempel & Progres — A01 + interaksi dua arah (bintang, level Kia, tantangan harian, badge)
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '../components/TopBar.vue'
import Icon from '../components/Icon.vue'
import Kia from '../components/Kia.vue'
import StarRow from '../components/StarRow.vue'
import { content, getPoi } from '../stores/content'
import { visits } from '../stores/visits'
import { play, LEVELS, level, totalStars, starsOf, daily, streak, stampCount, badgeProgress, nextBadge } from '../stores/play'
import { openKia } from '../stores/ui'

const router = useRouter()
const total = computed(() => content.pois.length)
const pct = computed(() => Math.round((stampCount.value / total.value) * 100))
const fmtDate = (t) => new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const KIND_LABEL = { quiz: 'spot kuis', mission: 'spot misi', photo: 'misi foto', streak: 'minggu' }
const missingText = (b) => {
  const left = b.need - b.have
  if (b.kind !== 'stamp') return `${left} ${KIND_LABEL[b.kind]} lagi. ${b.description}`
  const names = b.missing.slice(0, 2).map((id) => getPoi(id)?.short_name).filter(Boolean).join(', ')
  if (left <= 0 && b.requires_trail) return 'Selesaikan satu Wellness Trail untuk membuka badge ini.'
  return `Kunjungi ${left} spot lagi${names ? `: ${names}${b.missing.length > 2 ? ', …' : ''}` : ''}.`
}
const badgeMeta = (b) => (b.done ? 'Diperoleh' : b.kind === 'stamp' ? `${b.have}/${b.need} spot${b.requires_trail ? ' + trail' : ''}` : `${b.have}/${b.need} ${KIND_LABEL[b.kind]}`)
</script>

<template>
  <main class="flex flex-col bg-canvas">
    <TopBar title="Koleksi & Progres" back="/explore" />
    <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
      <!-- Level & Kia -->
      <section class="card overflow-hidden">
        <div class="flex items-center gap-4 bg-gradient-to-b from-[#c8eee9] to-[#a9ddd6] px-4 pb-3 pt-4">
          <Kia mood="happy" :stage="level.level" :size="92" />
          <div class="min-w-0 flex-1">
            <p class="eyebrow text-brand-800">Level {{ level.level }}</p>
            <p class="text-[22px] font-semibold leading-tight text-ink">Kia si {{ level.name }}</p>
            <p class="mt-0.5 text-[12px] font-semibold text-brand-800">{{ play.xp }} XP</p>
          </div>
        </div>
        <div class="px-4 pb-4 pt-3">
          <div class="h-2 overflow-hidden rounded-full bg-line">
            <div class="h-full rounded-full bg-brand-500 transition-[width] duration-500" :style="{ width: `${level.progress * 100}%` }" />
          </div>
          <p class="mt-1.5 text-[11px] text-muted">{{ level.next ? `${level.toNext} XP lagi, Kia tumbuh jadi ${level.next.name}.` : 'Kia sudah jadi Kiara Agung. Luar biasa!' }}</p>
          <ol class="mt-3 grid grid-cols-5 gap-1" aria-label="Tahap tumbuh Kia">
            <li v-for="l in LEVELS" :key="l.level" class="flex flex-col items-center gap-0.5" :class="l.level <= level.level ? '' : 'opacity-35 grayscale'">
              <span class="grid size-11 place-items-center rounded-full" :class="l.level === level.level ? 'bg-brand-100 ring-2 ring-brand-400' : 'bg-mint'">
                <Kia mood="happy" :stage="l.level" :size="38" still />
              </span>
              <span class="text-[9px] font-bold text-muted">{{ l.name }}</span>
            </li>
          </ol>
        </div>
      </section>

      <div class="mt-3 grid grid-cols-3 gap-2">
        <div class="stat bg-white">
          <span class="stat-value flex items-center gap-1"><Icon name="star" :size="16" :fill="true" class="text-sun-400" />{{ totalStars }}</span>
          <span class="stat-label">dari {{ total * 3 }} bintang</span>
        </div>
        <div class="stat bg-white">
          <span class="stat-value">{{ stampCount }}<span class="stat-unit">/{{ total }}</span></span>
          <span class="stat-label">Stempel</span>
        </div>
        <div class="stat bg-white">
          <span class="stat-value flex items-center gap-1"><Icon name="flame" :size="16" class="text-coral-500" />{{ streak.weeks }}</span>
          <span class="stat-label">Minggu beruntun</span>
        </div>
      </div>

      <!-- Tantangan Hari Ini -->
      <section v-if="daily" class="mt-3 flex gap-3 rounded-2xl border p-4" :class="daily.done ? 'border-brand-200 bg-brand-50' : 'border-sun-300/60 bg-sun-100'">
        <span class="grid size-12 shrink-0 place-items-center rounded-full text-white" :class="daily.done ? 'bg-brand-500' : 'bg-sun-400'"><Icon :name="daily.done ? 'check' : 'target'" :size="22" :stroke="daily.done ? 3 : 2" /></span>
        <div class="min-w-0 flex-1">
          <p class="text-[9px] font-extrabold uppercase tracking-[0.12em]" :class="daily.done ? 'text-brand-700' : 'text-sun-600'">Tantangan hari ini · +{{ daily.xp }} XP</p>
          <p class="mt-0.5 text-[15px] font-semibold text-ink">{{ daily.title }}</p>
          <p class="mt-0.5 text-[12px] text-muted">{{ daily.done ? 'Selesai! Datang lagi besok untuk tantangan baru.' : daily.expired ? 'Waktunya sudah lewat. Besok ada tantangan baru.' : daily.description }}</p>
          <div v-if="!daily.done" class="mt-2 flex items-center gap-2">
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
              <div class="h-full rounded-full bg-sun-400" :style="{ width: `${(daily.progress / daily.goal_count) * 100}%` }" />
            </div>
            <span class="text-[11px] font-bold text-sun-600">{{ daily.progress }}/{{ daily.goal_count }}</span>
          </div>
        </div>
      </section>

      <!-- Stempel & bintang per spot -->
      <div class="mt-6 flex items-end justify-between">
        <p class="eyebrow">Stempel spot</p>
        <p class="text-[12px] font-bold text-brand-600">{{ pct }}% · {{ stampCount }}/{{ total }}</p>
      </div>
      <ul class="mt-3 grid grid-cols-4 gap-x-3 gap-y-4">
        <li v-for="p in content.pois" :key="p.id">
          <button class="flex w-full flex-col items-center gap-1" :aria-label="`${p.name}: ${visits.stamps[p.id] ? 'sudah dikunjungi' : 'belum dikunjungi'}, ${starsOf(p.id)} bintang`" @click="router.push(`/poi/${p.id}`)">
            <span
              class="relative grid aspect-square w-full max-w-[64px] place-items-center rounded-full text-[12px] font-extrabold"
              :class="visits.stamps[p.id] ? 'border-2 border-brand-300 bg-brand-100 text-brand-800' : 'border-2 border-dashed border-line text-subtle'"
            >
              {{ p.id }}
              <span v-if="visits.stamps[p.id]" class="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-canvas bg-brand-500 text-white">
                <Icon name="check" :size="10" :stroke="3.5" />
              </span>
            </span>
            <StarRow :count="starsOf(p.id)" :size="11" />
            <span class="w-full truncate text-center text-[10px]" :class="visits.stamps[p.id] ? 'font-semibold text-ink' : 'text-subtle'">
              {{ visits.stamps[p.id] ? p.short_name : 'Belum' }}
            </span>
          </button>
        </li>
      </ul>
      <p class="mt-3 rounded-xl bg-white p-3 text-[11px] leading-relaxed text-muted">
        <Icon name="star" :size="12" :fill="true" class="mr-0.5 inline -translate-y-px text-sun-400" /> Dengarkan cerita ·
        <Icon name="star" :size="12" :fill="true" class="mr-0.5 inline -translate-y-px text-sun-400" /> Jawab kuis ·
        <Icon name="star" :size="12" :fill="true" class="mr-0.5 inline -translate-y-px text-sun-400" /> Selesaikan misi di lokasi
      </p>

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
            <span class="grid size-9 shrink-0 place-items-center rounded-full" :class="b.done ? 'bg-sun-400 text-white' : 'bg-line text-subtle'">
              <Icon :name="{ quiz: 'question', mission: 'flag', photo: 'camera', streak: 'flame' }[b.kind] || 'award'" :size="17" />
            </span>
            <span class="min-w-0">
              <span class="block truncate text-[12px] font-bold text-ink">{{ b.name }}</span>
              <span class="block text-[10px] text-muted">{{ badgeMeta(b) }}</span>
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

      <div class="mt-6 grid grid-cols-2 gap-2">
        <button class="btn-outline min-h-12 text-[13px]" @click="openKia('Bintangku sudah berapa?')"><Icon name="chat" :size="16" /> Tanya Kia</button>
        <button class="btn-primary min-h-12 text-[13px]" @click="router.push('/summary')">Ringkasan <Icon name="arrow-right" :size="16" /></button>
      </div>
    </div>
  </main>
</template>
