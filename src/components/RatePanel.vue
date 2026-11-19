<script setup>
// Rating spot 1–5, "Berguna?", dan "Laporkan info salah" — dikirim anonim ke tim (tanpa akun, tanpa lokasi).
import { ref } from 'vue'
import Icon from './Icon.vue'
import { rateSpot, reportContent } from '../stores/play'

const props = defineProps({
  poi: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})
const emit = defineEmits(['done', 'mood'])

const rating = ref(0)
const useful = ref(null)
const reporting = ref(false)
const report = ref('')
const reported = ref(false)
const LABELS = ['', 'Kurang', 'Biasa', 'Lumayan', 'Seru', 'Seru banget!']

function setRating(n) {
  rating.value = n
  emit('mood', n >= 4 ? 'cheer' : n >= 3 ? 'happy' : 'think')
}
function sendReport() {
  if (reportContent(props.poi.id, report.value)) {
    reported.value = true
    reporting.value = false
  }
}
function submit() {
  const { xp } = rateSpot(props.poi.id, rating.value, useful.value)
  emit('done', { xp })
}
</script>

<template>
  <div>
    <p class="eyebrow">Gimana menurutmu?</p>
    <p class="mt-1.5 text-[17px] font-semibold leading-snug text-ink">Beri nilai {{ poi.short_name }}</p>

    <div class="mt-3 flex items-center justify-between gap-1" role="radiogroup" aria-label="Nilai spot">
      <button
        v-for="n in 5"
        :key="n"
        role="radio"
        :aria-checked="rating === n"
        :aria-label="`${n} bintang`"
        class="grid size-12 place-items-center rounded-2xl transition active:scale-90"
        :class="n <= rating ? 'bg-sun-100 text-sun-400' : 'bg-mint text-line'"
        @click="setRating(n)"
      >
        <Icon name="star" :size="28" :stroke="1.6" :fill="n <= rating" />
      </button>
    </div>
    <p class="mt-1.5 h-4 text-center text-[12px] font-bold text-sun-600">{{ LABELS[rating] }}</p>

    <div v-if="!compact" class="mt-3 flex items-center gap-2 text-[13px]">
      <span class="flex-1 font-semibold text-ink">Info dari Kia berguna?</span>
      <button class="chip" :class="useful === true ? 'chip-active' : ''" :aria-pressed="useful === true" @click="useful = true">Ya</button>
      <button class="chip" :class="useful === false ? 'chip-active' : ''" :aria-pressed="useful === false" @click="useful = false">Belum</button>
    </div>

    <div v-if="!compact" class="mt-3">
      <button v-if="!reporting && !reported" class="inline-flex min-h-9 items-center gap-1.5 text-[12px] font-bold text-muted" @click="reporting = true">
        <Icon name="flag" :size="14" /> Laporkan info yang salah
      </button>
      <p v-else-if="reported" class="text-[12px] font-semibold text-brand-700"><Icon name="check" :size="13" :stroke="3" class="mr-1 inline" />Hatur nuhun! Laporanmu terkirim ke tim.</p>
      <div v-else class="rounded-2xl border border-line bg-white p-3">
        <label class="text-[12px] font-bold text-ink" for="report-text">Apa yang perlu diperbaiki?</label>
        <textarea
          id="report-text"
          v-model="report"
          maxlength="500"
          rows="3"
          placeholder="Mis. jam buka sudah berubah, spot tutup, lokasi bergeser…"
          class="mt-1.5 w-full resize-none rounded-xl border border-line bg-canvas p-2.5 text-[13px] outline-none focus:border-brand-400"
        />
        <p class="text-[10px] text-subtle">Jangan tulis nama atau nomor telepon. Laporan dikirim tanpa identitas.</p>
        <div class="mt-2 flex justify-end gap-2">
          <button class="btn-ghost min-h-9 px-3 text-[12px]" @click="reporting = false">Batal</button>
          <button class="btn-primary min-h-9 px-4 text-[12px]" :disabled="report.trim().length < 3" @click="sendReport">Kirim laporan</button>
        </div>
      </div>
    </div>

    <button class="btn-primary mt-4 min-h-13 w-full" :disabled="!rating" @click="submit">Kirim nilai</button>
  </div>
</template>
