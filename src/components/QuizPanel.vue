<script setup>
// Kuis pilihan ganda. Jawaban salah → Kia menjelaskan dari trivia, lalu boleh mencoba lagi.
import { computed, ref } from 'vue'
import Icon from './Icon.vue'
import { speak, stopSpeech, vibrate } from '../lib/audio'

const props = defineProps({
  questions: { type: Array, required: true },
  doneLabel: { type: String, default: 'Lanjut' },
})
const emit = defineEmits(['done', 'mood'])

const idx = ref(0)
const attempts = ref(props.questions.map(() => 0))
const wrong = ref([])
const solved = ref(false)
const lastWrong = ref(false)
const q = computed(() => props.questions[idx.value])
const LETTERS = ['A', 'B', 'C', 'D']

function pick(i) {
  if (solved.value || wrong.value.includes(i)) return
  attempts.value[idx.value]++
  if (i === q.value.answer) {
    solved.value = true
    lastWrong.value = false
    vibrate([60])
    emit('mood', 'happy')
  } else {
    wrong.value.push(i)
    lastWrong.value = true
    vibrate([40, 60, 40])
    emit('mood', 'think')
  }
}

function next() {
  stopSpeech()
  if (idx.value < props.questions.length - 1) {
    idx.value++
    solved.value = false
    lastWrong.value = false
    wrong.value = []
    emit('mood', 'think')
    return
  }
  emit('done', attempts.value.map((a, k) => ({ seq: k + 1, attempts: a })))
}

function readAloud() {
  const opts = q.value.options.map((o, i) => `Pilihan ${LETTERS[i]}: ${o}.`).join(' ')
  speak(`${q.value.q} ${opts}`, { key: 'quiz' })
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="eyebrow">Soal {{ idx + 1 }} dari {{ questions.length }}</p>
      <button class="inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 text-[12px] font-bold text-brand-700 hover:bg-brand-50" @click="readAloud">
        <Icon name="volume" :size="15" /> Bacakan
      </button>
    </div>
    <p class="mt-1.5 text-[17px] font-semibold leading-snug text-ink">{{ q.q }}</p>

    <ul class="mt-3 grid gap-2">
      <li v-for="(o, i) in q.options" :key="o">
        <button
          class="flex min-h-12 w-full items-center gap-3 rounded-2xl border-[1.5px] px-3 py-2 text-left text-[14px] font-semibold transition active:scale-[0.99]"
          :class="
            solved && i === q.answer
              ? 'border-brand-500 bg-brand-50 text-brand-800'
              : wrong.includes(i)
                ? 'border-coral-300 bg-coral-500/10 text-coral-600'
                : solved
                  ? 'border-line text-subtle'
                  : 'border-line bg-white text-ink hover:border-brand-300'
          "
          :aria-pressed="(solved && i === q.answer) || wrong.includes(i)"
          :disabled="solved || wrong.includes(i)"
          @click="pick(i)"
        >
          <span
            class="grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-extrabold"
            :class="solved && i === q.answer ? 'bg-brand-500 text-white' : wrong.includes(i) ? 'bg-coral-500 text-white' : 'bg-mint text-brand-700'"
          >
            <Icon v-if="solved && i === q.answer" name="check" :size="14" :stroke="3" />
            <Icon v-else-if="wrong.includes(i)" name="x" :size="13" :stroke="3" />
            <template v-else>{{ LETTERS[i] }}</template>
          </span>
          {{ o }}
        </button>
      </li>
    </ul>

    <div v-if="solved || lastWrong" class="mt-3 rounded-2xl p-3.5 text-[13px] leading-relaxed" :class="solved ? 'bg-brand-50 text-brand-900' : 'bg-sun-100 text-ink'" aria-live="polite">
      <p class="font-bold">{{ solved ? (attempts[idx] === 1 ? 'Benar! Langsung tepat.' : 'Nah, benar!') : 'Hmm, belum tepat. Kia kasih petunjuk:' }}</p>
      <p class="mt-0.5">{{ q.explain }}</p>
      <p v-if="!solved" class="mt-1 text-[12px] font-semibold text-sun-600">Coba pilih lagi, ya.</p>
    </div>

    <button v-if="solved" class="btn-primary mt-4 min-h-13 w-full" @click="next">
      {{ idx < questions.length - 1 ? 'Soal berikutnya' : doneLabel }} <Icon name="arrow-right" :size="18" />
    </button>
  </div>
</template>
