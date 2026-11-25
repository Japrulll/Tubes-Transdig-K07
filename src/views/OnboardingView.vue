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
import Kia from '../components/Kia.vue'
import { LEVELS } from '../stores/play'
import { slotImage } from '../lib/mediaSlots'

// Foto pengenalan (bila tim sudah mengimpor foto; lihat scripts/import-media.mjs)
const photo = (n) => slotImage(`onboarding/${n}`)

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
    <div class="flex items-center justify-between px-2 pt-2">
      <button class="icon-btn" aria-label="Kembali ke Beranda" @click="router.push('/home')"><Icon name="chevron-left" :size="24" /></button>
      <span class="text-[12px] font-bold text-subtle">{{ slide + 1 }} / {{ slides }}</span>
      <span class="w-11" />
    </div>
    <div class="flex flex-1 flex-col px-5 pt-1">
      <!-- Slide 1: sambutan + alasan lokasi -->
      <section v-if="slide === 0" class="flex flex-1 flex-col">
        <div class="relative overflow-hidden rounded-[1.75rem]">
          <img :src="photo(1)?.url || heroImg" alt="Ilustrasi taman Kiara Artha dengan danau, pohon, dan pengunjung" class="aspect-[1488/1080] w-full object-cover" />
          <div class="absolute bottom-3 right-3 flex items-end gap-1.5">
            <span class="mb-6 rounded-2xl rounded-br-md bg-white px-3 py-1.5 text-[12px] font-bold text-brand-900 shadow-[var(--shadow-card)]">Halo, aku Kia!</span>
            <Kia mood="wave" :stage="1" :size="72" />
          </div>
        </div>
        <p class="eyebrow mt-6">Teman jelajah tamanmu</p>
        <h1 class="mt-2 text-[32px] font-medium leading-[1.12] tracking-tight text-ink">
          Kenalan dulu<br />dengan <span class="text-brand-500">Kia</span>
        </h1>
        <p class="mt-3 text-[14px] leading-relaxed text-muted">
          Aku Kia, tunas pohon kiara. Aku menyapamu setiap kamu dekat spot seru di Kiara Artha Park, dan kamu bisa bertanya apa saja kepadaku.
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
        <div class="aspect-[1488/1080] overflow-hidden rounded-[1.75rem]">
          <img v-if="photo(2)" :src="photo(2).url" alt="Foto air mancur menari" class="h-full w-full object-cover" />
          <PoiArt v-else art="fountain" :variant="1" label="Ilustrasi air mancur menari" />
        </div>
        <p class="eyebrow mt-6">Dengar, jawab, beraksi</p>
        <h1 class="mt-2 text-[30px] font-medium leading-[1.12] tracking-tight text-ink">Dengarkan cerita,<br />lalu <span class="text-brand-500">ikut tantangan</span></h1>
        <p class="mt-3 text-[14px] leading-relaxed text-muted">
          Ponsel bergetar saat kamu dekat spot, lalu Kia bercerita. Setelahnya ada kuis singkat dan misi kecil di lokasi, misalnya foto atau latihan napas.
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
        <div class="relative aspect-[1488/1080] overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-[#c8eee9] to-[#a9ddd6]">
          <img v-if="photo(3)" :src="photo(3).url" alt="" class="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div class="relative flex h-full items-end justify-between px-3 pb-5">
            <div v-for="l in LEVELS" :key="l.level" class="flex flex-col items-center gap-1">
              <Kia mood="happy" :stage="l.level" :size="30 + l.level * 8" />
              <span class="text-[10px] font-bold text-brand-900">{{ l.name }}</span>
            </div>
          </div>
        </div>
        <p class="eyebrow mt-6">Bintang & stempel</p>
        <h1 class="mt-2 text-[30px] font-medium leading-[1.12] tracking-tight text-ink">Kumpulkan bintang,<br /><span class="text-brand-500">bantu Kia tumbuh</span></h1>
        <p class="mt-3 text-[14px] leading-relaxed text-muted">
          Tiap spot punya 3 bintang: dengar cerita, jawab kuis, selesaikan misi. Makin aktif kamu, makin tinggi Kia tumbuh, dari Tunas sampai Kiara Agung.
        </p>
        <div class="mt-5 flex gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
          <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700"><Icon name="shield" :size="22" /></span>
          <p class="text-[12px] leading-relaxed text-muted">
            <span class="block text-[14px] font-bold text-ink">Tersimpan aman</span>
            Stempel, bintang, dan foto misi disimpan di ponsel. Kalau kamu masuk akun, stempel dan bintang ikut tersimpan ke akunmu (foto tidak).
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
