<script setup>
// "Tantangan di sini": kuis → misi → nilai spot → hasil (bintang & XP). Bisa dilewati kapan saja;
// bintang yang belum didapat tetap terbuka dan terlihat di pin peta.
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icon from './Icon.vue'
import Kia from './Kia.vue'
import StarRow from './StarRow.vue'
import QuizPanel from './QuizPanel.vue'
import MissionPanel from './MissionPanel.vue'
import RatePanel from './RatePanel.vue'
import { ui, closeChallenge } from '../stores/ui'
import { getPoi } from '../stores/content'
import { play, starsOf, level, completeQuiz, completeMission, ratedThisVisit, spotState } from '../stores/play'
import { location, requestCompass } from '../stores/location'
import { startNavigation } from '../stores/navigation'
import { recommend } from '../lib/recommend'
import { stopSpeech, chime, vibrate } from '../lib/audio'

const router = useRouter()
const poi = computed(() => (ui.challenge ? getPoi(ui.challenge.poiId) : null))
const step = ref('quiz')
const mood = ref('think')
const gained = ref(0)
const runKey = ref(0)

const STEPS = [
  { id: 'quiz', label: 'Kuis' },
  { id: 'mission', label: 'Misi' },
  { id: 'rate', label: 'Nilai' },
]

function firstOpenStep(id) {
  const s = spotState(id)
  if (!s.quiz?.done) return 'quiz'
  if (!s.mission?.done) return 'mission'
  if (!ratedThisVisit(id)) return 'rate'
  return 'done'
}

watch(
  () => ui.challenge,
  (c) => {
    if (!c) return
    gained.value = 0
    runKey.value++
    step.value = c.step || firstOpenStep(c.poiId)
    mood.value = step.value === 'mission' ? 'wave' : step.value === 'done' ? 'cheer' : 'think'
  },
  { immediate: true }
)

const stars = computed(() => (poi.value ? starsOf(poi.value.id) : 0))
const stepDone = (id) => {
  const s = poi.value ? spotState(poi.value.id) : {}
  return id === 'quiz' ? !!s.quiz?.done : id === 'mission' ? !!s.mission?.done : poi.value ? ratedThisVisit(poi.value.id) : false
}
const kiaLine = computed(() => {
  if (!poi.value) return ''
  if (step.value === 'quiz') return mood.value === 'happy' ? 'Mantap! Kamu memperhatikan ceritanya.' : 'Seberapa ingat kamu cerita tadi? Jawab, ya!'
  if (step.value === 'mission') return 'Sekarang giliranmu beraksi di sini.'
  if (step.value === 'rate') return 'Ceritakan pendapatmu, biar tim SETARA makin baik.'
  return stars.value === 3 ? `Tiga bintang di ${poi.value.short_name}! Keren banget.` : 'Hatur nuhun! Bintang lainnya masih bisa kamu kejar.'
})
const nextSpot = computed(() => (step.value === 'done' && poi.value ? recommend({ from: location.position || poi.value, exclude: [poi.value.id], limit: 2 })[0] : null))

function award(xp) {
  if (!xp) return
  gained.value += xp
  chime()
  vibrate([120])
}
function afterQuiz(results) {
  award(completeQuiz(poi.value.id, results).xp)
  goNext('quiz')
}
function afterMission(r) {
  award(completeMission(poi.value.id, r).xp)
  mood.value = 'cheer'
  goNext('mission')
}
function afterRate({ xp }) {
  award(xp)
  goNext('rate')
}
function goNext(from) {
  const order = ['quiz', 'mission', 'rate', 'done']
  let i = order.indexOf(from) + 1
  while (order[i] !== 'done' && stepDone(order[i])) i++
  step.value = order[i]
  mood.value = step.value === 'done' ? 'cheer' : step.value === 'mission' ? 'wave' : 'think'
}
function jump(id) {
  stopSpeech()
  step.value = id
  mood.value = id === 'mission' ? 'wave' : 'think'
}
function close() {
  stopSpeech()
  closeChallenge()
}
function navigateTo(id) {
  close()
  requestCompass()
  startNavigation(id)
  router.push(`/navigate/${id}`)
}
function go(path) {
  close()
  router.push(path)
}
</script>

<template>
  <Transition name="fade">
    <div v-if="poi" class="absolute inset-0 z-[920] bg-brand-950/40" @click="close" />
  </Transition>
  <Transition name="sheet-up">
    <section v-if="poi" class="sheet safe-bottom absolute inset-x-0 bottom-0 z-[930] flex max-h-[94%] flex-col" role="dialog" :aria-label="`Tantangan di ${poi.name}`">
      <div class="sheet-handle shrink-0" />
      <header class="flex shrink-0 items-start gap-3 px-5">
        <Kia :mood="mood" :stage="level.level" :size="58" class="-mt-1 shrink-0" />
        <div class="min-w-0 flex-1">
          <p class="eyebrow">Tantangan di {{ poi.short_name }}</p>
          <p class="mt-1 rounded-2xl rounded-tl-md bg-mint px-3 py-2 text-[13px] font-medium leading-snug text-brand-900">{{ kiaLine }}</p>
        </div>
        <button class="icon-btn -mr-2 -mt-1 shrink-0 text-muted" aria-label="Tutup tantangan" @click="close"><Icon name="x" /></button>
      </header>

      <nav class="mt-3 flex shrink-0 items-center gap-1.5 px-5" aria-label="Langkah tantangan">
        <button
          v-for="(s, i) in STEPS"
          :key="s.id"
          class="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-full text-[12px] font-bold transition"
          :class="step === s.id ? 'bg-brand-900 text-white' : stepDone(s.id) ? 'bg-brand-50 text-brand-700' : 'bg-canvas text-subtle'"
          :aria-current="step === s.id ? 'step' : undefined"
          @click="jump(s.id)"
        >
          <Icon v-if="stepDone(s.id)" name="check" :size="13" :stroke="3" /><template v-else>{{ i + 1 }}.</template> {{ s.label }}
        </button>
        <StarRow :count="stars" :size="15" class="ml-1.5 shrink-0" />
      </nav>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
        <QuizPanel v-if="step === 'quiz'" :key="`q${runKey}`" :questions="poi.quiz" done-label="Lanjut ke misi" @mood="mood = $event" @done="afterQuiz" />
        <MissionPanel
          v-else-if="step === 'mission'"
          :key="`m${runKey}`"
          :poi="poi"
          @mood="mood = $event"
          @done="afterMission"
          @skip="goNext('mission')"
          @navigate="navigateTo(poi.id)"
          @go="go"
        />
        <RatePanel v-else-if="step === 'rate'" :key="`r${runKey}`" :poi="poi" @mood="mood = $event" @done="afterRate" />

        <div v-else class="text-center">
          <StarRow :count="stars" :size="34" class="mt-1" />
          <p class="mt-2 text-[20px] font-semibold text-ink">{{ stars }}/3 bintang di {{ poi.short_name }}</p>
          <p v-if="gained" class="mt-1 text-[14px] font-bold text-brand-600">+{{ gained }} XP</p>
          <div class="mx-auto mt-4 max-w-[300px] rounded-2xl bg-mint p-3 text-left">
            <div class="flex items-baseline justify-between text-[12px]">
              <span class="font-bold text-ink">Level {{ level.level }} · {{ level.name }}</span>
              <span class="font-semibold text-muted">{{ play.xp }} XP</span>
            </div>
            <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-white">
              <div class="h-full rounded-full bg-brand-500 transition-[width] duration-500" :style="{ width: `${level.progress * 100}%` }" />
            </div>
            <p v-if="level.next" class="mt-1 text-[11px] text-muted">{{ level.toNext }} XP lagi, Kia tumbuh jadi {{ level.next.name }}.</p>
          </div>
          <p v-if="stars < 3" class="mt-3 text-[12px] text-muted">
            <template v-if="!spotState(poi.id).listened">Dengarkan cerita spot ini untuk bintang pertama. </template>
            <template v-if="!spotState(poi.id).mission?.done">Misi bisa diselesaikan saat kamu di lokasi.</template>
          </p>
          <div class="mt-4 grid gap-2">
            <button v-if="nextSpot" class="btn-primary min-h-13" @click="location.position ? navigateTo(nextSpot.poi.id) : go(`/poi/${nextSpot.poi.id}`)">
              <Icon name="directions" :size="18" /> Lanjut ke {{ nextSpot.poi.short_name }}
            </button>
            <button class="btn-outline min-h-12" @click="close">Tutup</button>
          </div>
        </div>
      </div>
    </section>
  </Transition>
</template>
