<script setup>
// UI01 Onboarding & Izin Lokasi (F01, A03) — penjelasan lokasi tampil sebelum izin diminta.
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import PoiArt from '../components/PoiArt.vue'
import heroImg from '../assets/hero-setara.png'
import iconLocate from '../assets/icon-locate.png'
import { settings } from '../stores/settings'
import { startLocation } from '../stores/location'
import { unlockAudio } from '../lib/audio'
import { content } from '../stores/content'

const router = useRouter()
const slide = ref(0)
const slides = 3
let startX = null

function onTouchStart(e) {
  startX = e.touches[0].clientX
}
function onTouchEnd(e) {
  if (startX == null) return
  const dx = e.changedTouches[0].clientX - startX
  if (dx < -40 && slide.value < slides - 1) slide.value++
  if (dx > 40 && slide.value > 0) slide.value--
  startX = null
}

function allowLocation() {
  unlockAudio()
  settings.onboarded = true
  startLocation()
  router.replace('/explore')
}
function useQr() {
  unlockAudio()
  settings.onboarded = true
  router.replace('/qr')
}
</script>

<template>
  <main class="safe-top safe-bottom flex flex-col overflow-y-auto bg-white" @touchstart.passive="onTouchStart" @touchend="onTouchEnd">
    <div class="flex flex-1 flex-col px-5 pt-4">
      <!-- Slide 1: sambutan + alasan lokasi -->
      <section v-if="slide === 0" class="flex flex-1 flex-col">
        <div class="relative overflow-hidden rounded-[1.75rem]">
          <img :src="heroImg" alt="Ilustrasi taman Kiara Artha dengan danau, pohon, dan pengunjung" class="aspect-[1488/1080] w-full object-cover" />
        </div>
        <p class="eyebrow mt-6">Teman jelajah tamanmu</p>
        <h1 class="mt-2 text-[32px] font-medium leading-[1.12] tracking-tight text-ink">
          Selamat datang<br />di <span class="text-brand-500">SETARA</span>
        </h1>
        <p class="mt-3 text-[14px] leading-relaxed text-muted">
          Jelajahi Kiara Artha Park. Info spot akan muncul otomatis saat Anda mendekat.
        </p>
        <div class="mt-5 flex gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
          <img :src="iconLocate" alt="" class="size-11 shrink-0" />
          <div>
            <p class="text-[14px] font-bold text-ink">Mengapa butuh lokasi?</p>
            <p class="mt-1 text-[12px] leading-relaxed text-muted">
              Lokasi hanya diproses di ponsel untuk mendeteksi spot terdekat dan tidak dikirim ke server.
            </p>
            <RouterLink to="/privacy" class="mt-1.5 inline-block text-[12px] font-bold text-brand-700 underline-offset-2 hover:underline">Baca privasi lokasi</RouterLink>
          </div>
        </div>
      </section>

      <!-- Slide 2: eyes-free / Mode Audio -->
      <section v-else-if="slide === 1" class="flex flex-1 flex-col">
        <div class="aspect-[1488/1080] overflow-hidden rounded-[1.75rem]"><PoiArt art="fountain" :variant="1" label="Ilustrasi air mancur menari" /></div>
        <p class="eyebrow mt-6">Tanpa terus melihat layar</p>
        <h1 class="mt-2 text-[30px] font-medium leading-[1.12] tracking-tight text-ink">Dengarkan cerita<br />setiap <span class="text-brand-500">spot</span></h1>
        <p class="mt-3 text-[14px] leading-relaxed text-muted">
          Saat Anda mendekati spot, ponsel bergetar dan menyapa dengan suara. Simpan ponsel di saku dan nikmati taman.
        </p>
        <label class="mt-5 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
          <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700"><Icon name="volume" :size="22" /></span>
          <span class="flex-1">
            <span class="block text-[14px] font-bold text-ink">Mode Audio</span>
            <span class="mt-0.5 block text-[12px] leading-relaxed text-muted">Narasi diputar otomatis saat trigger. Bisa diubah kapan saja lewat tombol "Audio".</span>
          </span>
          <input v-model="settings.audioMode" type="checkbox" class="size-6 accent-brand-500" />
        </label>
      </section>

      <!-- Slide 3: stempel & privasi -->
      <section v-else class="flex flex-1 flex-col">
        <div class="grid aspect-[1488/1080] grid-cols-4 content-center gap-3 rounded-[1.75rem] bg-gradient-to-b from-[#c8eee9] to-[#a9ddd6] p-6">
          <div
            v-for="p in content.pois"
            :key="p.id"
            class="grid aspect-square place-items-center rounded-full border-2 text-[11px] font-extrabold"
            :class="p.number % 3 === 1 ? 'border-brand-500 bg-white text-brand-700' : 'border-dashed border-white/80 text-brand-800/60'"
          >
            {{ p.id }}
          </div>
        </div>
        <p class="eyebrow mt-6">Koleksi stempel</p>
        <h1 class="mt-2 text-[30px] font-medium leading-[1.12] tracking-tight text-ink">Kumpulkan <span class="text-brand-500">12 stempel</span><br />Kiara Artha</h1>
        <p class="mt-3 text-[14px] leading-relaxed text-muted">
          Setiap spot yang Anda datangi memberi stempel. Di akhir kunjungan, lihat ringkasan spot, jarak, dan durasi.
        </p>
        <div class="mt-5 flex gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
          <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700"><Icon name="shield" :size="22" /></span>
          <p class="text-[12px] leading-relaxed text-muted">
            <span class="block text-[14px] font-bold text-ink">Tersimpan di ponsel Anda</span>
            Stempel dan riwayat kunjungan tidak dikirim ke server. Aplikasi tetap berjalan tanpa internet.
          </p>
        </div>
      </section>

      <div class="mt-auto pt-6">
        <div class="flex flex-col gap-3">
          <button class="btn-primary min-h-14" @click="allowLocation"><Icon name="locate" :size="19" /> Izinkan Akses Lokasi</button>
          <button class="btn-outline min-h-14" @click="useQr"><Icon name="qr" :size="19" /> Gunakan Mode QR</button>
        </div>
        <div class="flex items-center justify-center gap-2 py-5" role="tablist" aria-label="Halaman pengenalan">
          <button
            v-for="i in slides"
            :key="i"
            role="tab"
            :aria-selected="slide === i - 1"
            :aria-label="`Halaman ${i}`"
            class="h-2 rounded-full transition-all"
            :class="slide === i - 1 ? 'w-6 bg-brand-500' : 'w-2 bg-line'"
            @click="slide = i - 1"
          />
        </div>
      </div>
    </div>
  </main>
</template>
