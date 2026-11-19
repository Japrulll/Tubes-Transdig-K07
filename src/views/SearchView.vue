<script setup>
// UI06 Search & Filter — F05: cari nama/kata kunci, filter kategori, urut berdasarkan jarak.
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import PoiThumb from '../components/PoiThumb.vue'
import { content, categoryById } from '../stores/content'
import { location, requestCompass } from '../stores/location'
import { geofence } from '../stores/geofence'
import { visits } from '../stores/visits'
import { formatDistance, haversine } from '../lib/geo'
import { startNavigation } from '../stores/navigation'
import { openStatus } from '../lib/time'
import Kia from '../components/Kia.vue'
import { answer, looksLikeQuestion } from '../lib/kia'
import { level } from '../stores/play'
import { openKia, openChallenge } from '../stores/ui'

const route = useRoute()
const router = useRouter()
const q = ref('')
const cat = ref('semua')
const input = ref(null)
const listening = ref(false)

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ')

const results = computed(() => {
  const query = norm(q.value).trim()
  const terms = query.length >= 2 ? query.split(/\s+/).filter(Boolean) : []
  return content.pois
    .filter((p) => cat.value === 'semua' || p.category_id === cat.value || p.secondary_category_id === cat.value)
    .map((p) => {
      const hay = norm([p.name, p.short_name, p.keywords.join(' '), categoryById.value[p.category_id]?.label, p.location_label, p.summary].join(' '))
      const nameHay = norm(p.name + ' ' + p.keywords.join(' '))
      const match = terms.every((t) => hay.includes(t))
      const score = terms.reduce((s, t) => s + (nameHay.includes(t) ? 2 : 1), 0)
      const d = location.position ? geofence.distances[p.id] ?? haversine(location.position, p) : null
      return { poi: p, match, score, distance: d }
    })
    .filter((r) => !terms.length || r.match)
    .sort((a, b) => (a.distance != null && b.distance != null ? a.distance - b.distance : a.poi.number - b.poi.number))
})

// Pertanyaan di kotak Cari dijawab Kia di atas daftar spot
const kiaReply = computed(() => {
  const text = q.value.trim()
  if (text.length < 4 || !looksLikeQuestion(text)) return null
  const a = answer(text)
  return ['poi', 'greeting', 'help', 'thanks'].includes(a.intent) ? null : a
})
function kiaAct(a) {
  if (a.kind === 'navigate') navigate(a.poi)
  else if (a.kind === 'detail') go(a.poi)
  else if (a.kind === 'challenge') openChallenge(a.poi)
  else if (a.kind === 'route') router.push(a.to)
}

function go(id) {
  router.push(`/poi/${id}`)
}
function navigate(id) {
  requestCompass()
  startNavigation(id)
  router.push(`/navigate/${id}`)
}

// Pencarian suara (Web Speech Recognition, bahasa Indonesia)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition
function voice() {
  if (!SR) return
  const r = new SR()
  r.lang = 'id-ID'
  r.interimResults = true
  r.onresult = (e) => (q.value = [...e.results].map((x) => x[0].transcript).join(' '))
  r.onend = () => (listening.value = false)
  r.onerror = () => (listening.value = false)
  listening.value = true
  r.start()
}

onMounted(() => {
  if (route.query.voice && SR) voice()
  else input.value?.focus({ preventScroll: true })
})
</script>

<template>
  <main class="flex flex-col bg-white">
    <header class="safe-top shrink-0 px-4">
      <div class="flex items-center gap-2 pt-2">
        <button class="icon-btn -ml-2" aria-label="Kembali" @click="router.push('/explore')"><Icon name="chevron-left" :size="24" /></button>
        <div class="flex flex-1 items-center gap-2 rounded-2xl border-[1.5px] border-brand-300 bg-white px-3.5 focus-within:border-brand-500">
          <Icon name="search" :size="19" class="text-ink" />
          <input
            ref="input"
            v-model="q"
            type="search"
            enterkeyhint="search"
            placeholder="Cari spot atau tanya Kia…"
            aria-label="Cari spot atau fasilitas"
            class="min-h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-subtle [&::-webkit-search-cancel-button]:hidden"
          />
          <button v-if="q" class="grid size-7 place-items-center rounded-full border border-line text-muted" aria-label="Hapus" @click="q = ''"><Icon name="x" :size="14" :stroke="2.6" /></button>
          <button v-else-if="SR" class="grid size-8 place-items-center rounded-full text-brand-700" :class="listening ? 'animate-pulse bg-brand-100' : ''" aria-label="Cari dengan suara" @click="voice"><Icon name="mic" :size="18" /></button>
        </div>
      </div>
      <div class="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Filter kategori">
        <button class="chip" :class="cat === 'semua' ? 'chip-active' : ''" role="tab" :aria-selected="cat === 'semua'" @click="cat = 'semua'">
          <Icon v-if="cat === 'semua'" name="check" :size="13" :stroke="3" /> Semua
        </button>
        <button v-for="c in content.categories" :key="c.id" class="chip" :class="cat === c.id ? 'chip-active' : ''" role="tab" :aria-selected="cat === c.id" @click="cat = c.id">
          <Icon v-if="cat === c.id" name="check" :size="13" :stroke="3" /> {{ c.label }}
        </button>
      </div>
      <div class="mt-2 flex items-center justify-between border-b border-line pb-2 text-[11px]">
        <span class="text-muted">
          {{ location.position ? 'Diurutkan dari yang terdekat' : 'Aktifkan lokasi untuk mengurutkan berdasarkan jarak' }}
          <template v-if="q.trim().length >= 2"> · {{ results.length }} hasil</template>
        </span>
        <span class="inline-flex items-center gap-1 font-bold text-brand-600"><Icon name="locate" :size="13" :stroke="2.4" /> Terdekat</span>
      </div>
    </header>

    <ul class="min-h-0 flex-1 overflow-y-auto px-4 pb-6" aria-live="polite">
      <li v-if="kiaReply" class="mt-3 flex gap-2.5 rounded-2xl bg-mint p-3">
        <Kia :mood="kiaReply.answered ? 'happy' : 'think'" :stage="level.level" :size="40" still class="shrink-0" />
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-700">Jawaban Kia</p>
          <p class="mt-0.5 text-[13px] leading-relaxed text-ink">{{ kiaReply.answered ? kiaReply.text : 'Hmm, aku belum yakin. Tanyakan langsung ke aku, ya, nanti kucatat untuk tim.' }}</p>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button v-for="a in kiaReply.actions.slice(0, 2)" :key="a.label" class="inline-flex min-h-9 items-center rounded-full border border-brand-300 bg-white px-3 text-[12px] font-bold text-brand-700" @click="kiaAct(a)">{{ a.label }}</button>
            <button class="inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 text-[12px] font-bold text-brand-700" @click="openKia(q)"><Icon name="chat" :size="14" /> Tanya Kia</button>
          </div>
        </div>
      </li>
      <li v-for="r in results" :key="r.poi.id" class="flex items-center gap-3 border-b border-line py-3">
        <button class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="go(r.poi.id)">
          <PoiThumb :poi="r.poi" />
          <span class="min-w-0">
            <span class="flex items-center gap-1.5 truncate text-[14px] font-semibold text-ink">
              {{ r.poi.name }}
              <Icon v-if="visits.stamps[r.poi.id]" name="check" :size="13" :stroke="3" class="shrink-0 text-brand-500" />
            </span>
            <span class="block truncate text-[11px] text-muted">
              {{ categoryById[r.poi.category_id]?.label }}<template v-if="r.distance != null"> · {{ formatDistance(r.distance) }}</template>
              <template v-if="!openStatus(r.poi).open"> · <span class="text-coral-600">{{ openStatus(r.poi).label }}</span></template>
            </span>
          </span>
        </button>
        <button class="btn-outline min-h-9 shrink-0 px-3.5 text-[12px]" :disabled="!location.position" @click="navigate(r.poi.id)">Arahkan</button>
      </li>
      <li v-if="!results.length && !kiaReply" class="py-16 text-center">
        <p class="text-[15px] font-semibold text-ink">Tidak ada spot yang cocok</p>
        <p class="mt-1 text-[13px] text-muted">Coba kata lain, misalnya "musala", "makan", atau "foto".</p>
      </li>
    </ul>
  </main>
</template>
