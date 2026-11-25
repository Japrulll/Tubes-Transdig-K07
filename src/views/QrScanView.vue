<script setup>
// UI10 QR Scan — trigger cadangan (F02) saat GPS lemah atau izin lokasi tidak diberikan.
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import { getPoi, content } from '../stores/content'
import { fireTrigger } from '../stores/geofence'
import { parsePoiCode } from '../lib/qr'
import { RETIRED_POIS } from '../lib/poiIds'
import { vibrate } from '../lib/audio'

const router = useRouter()
const status = ref('starting') // starting | scanning | error
const errorMsg = ref('')
const manual = ref('')
const manualErr = ref('')
let scanner = null
let done = false

function open(poiId) {
  const poi = getPoi(poiId)
  if (!poi) return false
  done = true
  stop()
  fireTrigger(poi, { source: 'qr' })
  router.replace('/explore')
  return true
}

async function start() {
  try {
    const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
    scanner = new Html5Qrcode('qr-reader', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false })
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: (w, h) => ({ width: Math.min(w, h) * 0.62, height: Math.min(w, h) * 0.62 }), aspectRatio: 0.75 },
      (text) => {
        if (done) return
        const id = parsePoiCode(text)
        if (id && getPoi(id)) open(id)
        else {
          vibrate(80)
          errorMsg.value = id ? RETIRED_POIS[id] || `Kode spot ${id} tidak dikenali.` : 'QR ini bukan kode spot SETARA.'
        }
      },
      () => {}
    )
    status.value = 'scanning'
  } catch (e) {
    status.value = 'error'
    errorMsg.value = /Permission|NotAllowed/i.test(String(e)) ? 'Izin kamera ditolak. Masukkan kode spot di bawah.' : 'Kamera tidak tersedia. Masukkan kode spot di bawah.'
  }
}
async function stop() {
  try {
    if (scanner?.isScanning) await scanner.stop()
    scanner?.clear()
  } catch {
    /* abaikan */
  }
}
function submitManual() {
  const id = parsePoiCode(manual.value.length <= 3 ? `P${manual.value.replace(/\D/g, '').padStart(2, '0')}` : manual.value)
  if (!id || !open(id)) manualErr.value = (id && RETIRED_POIS[id]) || 'Kode tidak dikenal. Contoh: P05'
}

onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <main class="flex flex-col bg-gradient-to-b from-[#1f5a52] to-[#173f3a] text-white">
    <header class="safe-top relative z-10 flex h-14 shrink-0 items-center px-2 pt-1">
      <button class="icon-btn text-white hover:bg-white/10" aria-label="Kembali" @click="router.push('/explore')"><Icon name="chevron-left" :size="24" /></button>
      <h1 class="flex-1 text-center text-base font-bold">Scan QR Spot</h1>
      <span class="w-11" />
    </header>

    <div class="relative flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-3">
      <div class="relative aspect-square w-[min(250px,30vh)]">
        <div id="qr-reader" class="absolute inset-0 overflow-hidden rounded-3xl [&_video]:h-full! [&_video]:w-full! [&_video]:object-cover" />
        <!-- bingkai pemindai -->
        <div class="pointer-events-none absolute inset-0">
          <span class="absolute left-0 top-0 size-9 rounded-tl-2xl border-l-[3px] border-t-[3px] border-white/90" />
          <span class="absolute right-0 top-0 size-9 rounded-tr-2xl border-r-[3px] border-t-[3px] border-white/90" />
          <span class="absolute bottom-0 left-0 size-9 rounded-bl-2xl border-b-[3px] border-l-[3px] border-white/90" />
          <span class="absolute bottom-0 right-0 size-9 rounded-br-2xl border-b-[3px] border-r-[3px] border-white/90" />
          <span v-if="status !== 'error'" class="absolute inset-x-3 h-0.5 animate-[scanline_2.2s_ease-in-out_infinite] rounded bg-coral-500 shadow-[0_0_10px_2px_rgb(238_123_91/0.6)]" />
        </div>
      </div>
      <div class="mt-5 flex flex-col items-center text-center text-white/80">
        <span class="grid size-9 place-items-center rounded-xl bg-white/10"><Icon name="qr" :size="18" /></span>
        <p class="mt-2 text-[13px]">Arahkan kamera ke QR<br />di papan spot</p>
        <p v-if="errorMsg" class="mt-2 rounded-xl bg-coral-500/20 px-3 py-1 text-[11px] font-semibold text-coral-300">{{ errorMsg }}</p>
      </div>
    </div>

    <section class="sheet safe-bottom shrink-0 px-5 pb-5 text-ink">
      <div class="sheet-handle" />
      <div class="flex gap-3">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon name="locate" :size="19" /></span>
        <div>
          <p class="text-[14px] font-bold">Kapan memakai QR?</p>
          <p class="mt-0.5 text-[12px] leading-relaxed text-muted">Saat sinyal GPS lemah atau izin lokasi tidak diberikan. Hasil scan membuka konten POI yang sama.</p>
        </div>
      </div>
      <form class="mt-3 flex gap-2" @submit.prevent="submitManual">
        <input
          v-model="manual"
          list="poi-codes"
          inputmode="text"
          autocapitalize="characters"
          placeholder="Kode spot, mis. P05"
          aria-label="Kode spot"
          class="min-h-12 min-w-0 flex-1 rounded-full border border-line px-4 text-[14px] outline-none focus:border-brand-500"
        />
        <datalist id="poi-codes"><option v-for="p in content.pois" :key="p.id" :value="p.id">{{ p.name }}</option></datalist>
        <button class="btn-primary min-h-12 px-5 text-sm" type="submit">Buka</button>
      </form>
      <p v-if="manualErr" class="mt-1.5 text-[12px] text-coral-600">{{ manualErr }}</p>
      <button class="btn-outline mt-3 w-full" @click="router.push('/explore')"><Icon name="chevron-left" :size="17" /> Kembali ke Explore</button>
    </section>
  </main>
</template>

<style>
@keyframes scanline {
  0%,
  100% {
    top: 6%;
  }
  50% {
    top: 94%;
  }
}
#qr-reader img,
#qr-reader__dashboard {
  display: none !important;
}
</style>
