<script setup>
// Tanya Kia — percakapan dua arah (teks & suara), dijawab offline dari data taman.
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Kia from './Kia.vue'
import Icon from './Icon.vue'
import { ui, closeKia, openChallenge } from '../stores/ui'
import { settings } from '../stores/settings'
import { level, askedKia } from '../stores/play'
import { requestCompass } from '../stores/location'
import { startNavigation } from '../stores/navigation'
import { answer, suggestions, greeting } from '../lib/kia'
import { speak, stopSpeech } from '../lib/audio'

const router = useRouter()
const chat = reactive({ messages: [] })
const input = ref('')
const thinking = ref(false)
const listening = ref(false)
const scroller = ref(null)
const field = ref(null)
const chips = computed(() => suggestions())
const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null
let uid = 0

function push(m) {
  chat.messages.push({ id: ++uid, ...m })
  chat.messages.splice(0, Math.max(0, chat.messages.length - 40))
  nextTick(() => scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' }))
}

watch(
  () => ui.kiaOpen,
  async (open) => {
    if (!open) return stopSpeech()
    if (!chat.messages.length) push({ from: 'kia', text: `${greeting()} Aku Kia, tunas pohon kiara. Tanya apa saja soal taman ini, ya!` })
    if (ui.kiaPrefill) {
      const q = ui.kiaPrefill
      ui.kiaPrefill = ''
      ask(q)
    }
    await nextTick()
    scroller.value?.scrollTo({ top: scroller.value.scrollHeight })
  }
)

function ask(text) {
  const q = String(text || '').trim()
  if (!q || thinking.value) return
  input.value = ''
  push({ from: 'me', text: q })
  thinking.value = true
  setTimeout(() => {
    const a = answer(q)
    const xp = askedKia(q, a.answered)
    thinking.value = false
    push({ from: 'kia', text: a.text, actions: a.actions, xp, intent: a.intent })
    if (settings.kiaVoice) speak(a.text, { key: 'kia' })
  }, 380)
}

function voice() {
  if (!SR || listening.value) return
  stopSpeech()
  const r = new SR()
  r.lang = 'id-ID'
  r.interimResults = true
  let finalText = ''
  r.onresult = (e) => {
    const t = [...e.results].map((x) => x[0].transcript).join(' ')
    input.value = t
    if (e.results[e.results.length - 1].isFinal) finalText = t
  }
  r.onend = () => {
    listening.value = false
    if (finalText) ask(finalText)
  }
  r.onerror = () => (listening.value = false)
  listening.value = true
  r.start()
}

function act(a) {
  stopSpeech()
  closeKia()
  if (a.kind === 'navigate') {
    requestCompass()
    startNavigation(a.poi)
    router.push(`/navigate/${a.poi}`)
  } else if (a.kind === 'detail') router.push(`/poi/${a.poi}`)
  else if (a.kind === 'challenge') openChallenge(a.poi)
  else if (a.kind === 'route') router.push(a.to)
}

function close() {
  stopSpeech()
  closeKia()
}
</script>

<template>
  <Transition name="fade">
    <div v-if="ui.kiaOpen" class="absolute inset-0 z-[940] bg-brand-950/40" @click="close" />
  </Transition>
  <Transition name="sheet-up">
    <section v-if="ui.kiaOpen" class="sheet safe-bottom absolute inset-x-0 bottom-0 z-[950] flex h-[88%] flex-col" role="dialog" aria-label="Tanya Kia">
      <div class="sheet-handle shrink-0" />
      <header class="flex shrink-0 items-center gap-3 border-b border-line px-5 pb-3">
        <Kia :mood="thinking ? 'think' : 'happy'" :stage="level.level" :size="44" />
        <div class="min-w-0 flex-1">
          <h2 class="text-[16px] font-bold text-ink">Tanya Kia</h2>
          <p class="text-[11px] text-muted">Menjawab dari data taman, tetap jalan tanpa internet</p>
        </div>
        <button
          class="icon-btn size-10"
          :class="settings.kiaVoice ? 'text-brand-700' : 'text-subtle'"
          :aria-label="settings.kiaVoice ? 'Matikan suara Kia' : 'Nyalakan suara Kia'"
          :aria-pressed="settings.kiaVoice"
          @click="settings.kiaVoice = !settings.kiaVoice; stopSpeech()"
        >
          <Icon :name="settings.kiaVoice ? 'volume' : 'volume-off'" :size="19" />
        </button>
        <button class="icon-btn -mr-2 size-10 text-muted" aria-label="Tutup Tanya Kia" @click="close"><Icon name="x" /></button>
      </header>

      <div ref="scroller" class="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        <div v-for="m in chat.messages" :key="m.id" :class="m.from === 'me' ? 'flex justify-end' : 'flex items-end gap-2'">
          <template v-if="m.from === 'kia'">
            <span class="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-mint"><Kia mood="happy" :stage="level.level" :size="30" still /></span>
            <div class="max-w-[82%]">
              <p class="rounded-2xl rounded-bl-md bg-mint px-3.5 py-2.5 text-[14px] leading-relaxed text-brand-950">{{ m.text }}</p>
              <div v-if="m.actions?.length" class="mt-1.5 flex flex-wrap gap-1.5">
                <button v-for="a in m.actions" :key="a.label" class="inline-flex min-h-9 items-center gap-1 rounded-full border border-brand-300 bg-white px-3 text-[12px] font-bold text-brand-700" @click="act(a)">
                  <Icon :name="a.kind === 'navigate' ? 'directions' : a.kind === 'challenge' ? 'star' : 'arrow-right'" :size="14" /> {{ a.label }}
                </button>
              </div>
              <p v-if="m.xp" class="mt-1 text-[10px] font-bold text-brand-600">+{{ m.xp }} XP karena kepo</p>
            </div>
          </template>
          <p v-else class="max-w-[80%] rounded-2xl rounded-br-md bg-brand-900 px-3.5 py-2.5 text-[14px] leading-relaxed text-white">{{ m.text }}</p>
        </div>
        <div v-if="thinking" class="flex items-end gap-2">
          <span class="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-mint"><Kia mood="think" :stage="level.level" :size="30" still /></span>
          <p class="rounded-2xl rounded-bl-md bg-mint px-4 py-3"><span class="typing"><i /><i /><i /></span></p>
        </div>
      </div>

      <div class="shrink-0 border-t border-line px-4 pb-3 pt-2.5">
        <div class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2.5">
          <button v-for="c in chips" :key="c" class="chip shrink-0 border-brand-200 text-brand-800" @click="ask(c)">{{ c }}</button>
        </div>
        <form class="flex items-center gap-2" @submit.prevent="ask(input)">
          <div class="flex min-h-12 flex-1 items-center gap-2 rounded-2xl border-[1.5px] border-brand-300 bg-white px-3.5 focus-within:border-brand-500">
            <input ref="field" v-model="input" type="text" enterkeyhint="send" maxlength="200" placeholder="Tanya Kia…" aria-label="Pertanyaan untuk Kia" class="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-subtle" />
            <button v-if="SR" type="button" class="grid size-9 place-items-center rounded-full text-brand-700" :class="listening ? 'animate-pulse bg-brand-100' : ''" aria-label="Tanya dengan suara" @click="voice">
              <Icon name="mic" :size="19" />
            </button>
          </div>
          <button type="submit" class="grid size-12 shrink-0 place-items-center rounded-full bg-brand-500 text-white disabled:opacity-40" :disabled="!input.trim()" aria-label="Kirim pertanyaan">
            <Icon name="send" :size="19" />
          </button>
        </form>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.typing {
  display: inline-flex;
  gap: 4px;
}
.typing i {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-brand-500);
  animation: dot 1s ease-in-out infinite;
}
.typing i:nth-child(2) {
  animation-delay: 0.15s;
}
.typing i:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes dot {
  0%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-3px);
  }
}
</style>
