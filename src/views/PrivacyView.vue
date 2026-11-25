<script setup>
// A03 Transparansi & Privasi Lokasi (+ umpan balik anonim dari fitur interaksi)
import TopBar from '../components/TopBar.vue'
import Icon from '../components/Icon.vue'
import { location } from '../stores/location'
import { resetAll } from '../stores/visits'
import { resetPlay } from '../stores/play'
import { clearTriggerState, geofence } from '../stores/geofence'
import { clearPhotos } from '../lib/photoStore'
import { save } from '../lib/storage'
import { ref } from 'vue'

const cleared = ref(false)
const points = [
  { icon: 'locate', title: 'Lokasi diproses di ponsel', text: 'Posisi GPS hanya dipakai untuk menghitung jarak ke setiap spot (rumus Haversine) langsung di perangkatmu.' },
  { icon: 'shield', title: 'Posisimu tidak dikirim', text: 'SETARA tidak pernah mengirim atau menyimpan posisimu di server. Permintaan ke database hanya mengambil konten taman (teks, jadwal, kuis).' },
  {
    icon: 'chat',
    title: 'Umpan balik tanpa identitas',
    text: 'Rating spot, laporan info salah, hasil kuis, dan pertanyaan yang belum bisa dijawab Kia dikirim tanpa akun, tanpa ID perangkat, dan tanpa lokasi. Aplikasi hanya bisa menulis, tidak bisa membacanya kembali.',
  },
  { icon: 'award', title: 'Progres & foto tersimpan lokal', text: 'Stempel, bintang, XP, level Kia, dan foto Jurnal Kunjungan disimpan di ponselmu dan bisa dihapus kapan saja.' },
  {
    icon: 'user',
    title: 'Akun opsional',
    text: 'Bila kamu masuk dengan email, stempel, bintang, XP, riwayat kunjungan, dan preferensi audio ikut disimpan ke akunmu agar bisa dilanjutkan di ponsel lain. Hanya kamu yang bisa membacanya. Lokasi GPS dan foto Jurnal tidak pernah dikirim. Umpan balik tetap dikirim tanpa identitas akun.',
  },
  { icon: 'bell', title: 'Pengingat opsional', text: 'Pengingat jadwal (aplikasi Android/iOS) dijadwalkan di ponsel dan tidak memakai lokasi latar belakang.' },
  { icon: 'external', title: 'Google Maps opsional', text: 'Tombol "Google Maps" hanya membuka rute ke koordinat spot tujuan; posisimu tidak disertakan di tautan.' },
  { icon: 'qr', title: 'Tanpa lokasi pun bisa', text: 'Jika izin lokasi tidak diberikan, gunakan Mode QR di papan setiap spot untuk membuka konten dan misi yang sama.' },
]

async function wipe() {
  resetAll()
  resetPlay()
  clearTriggerState()
  geofence.log = []
  save('triggerLog', [])
  await clearPhotos()
  cleared.value = true
}
</script>

<template>
  <main class="flex flex-col bg-canvas">
    <TopBar title="Privasi Lokasi" />
    <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
      <p class="eyebrow">Transparansi data</p>
      <h2 class="mt-1 text-[22px] font-medium leading-tight text-ink">Lokasimu tetap<br />di ponselmu</h2>
      <ul class="mt-5 space-y-3">
        <li v-for="p in points" :key="p.title" class="card flex gap-3 p-4">
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon :name="p.icon" :size="19" /></span>
          <div>
            <p class="text-[14px] font-bold text-ink">{{ p.title }}</p>
            <p class="mt-0.5 text-[12px] leading-relaxed text-muted">{{ p.text }}</p>
          </div>
        </li>
      </ul>
      <div class="mt-5 rounded-2xl bg-mint p-4 text-[12px] text-muted">
        Status izin lokasi saat ini:
        <b class="text-ink">{{ { idle: 'belum diminta', requesting: 'meminta izin', active: 'aktif', denied: 'ditolak', unavailable: 'tidak tersedia', error: 'menunggu sinyal' }[location.status] }}</b>.
        Ubah izin melalui pengaturan situs/aplikasi di ponselmu.
      </div>
      <button class="btn-outline mt-5 w-full" @click="wipe"><Icon name="refresh" :size="16" /> {{ cleared ? 'Data di ponsel ini sudah dihapus' : 'Hapus stempel, bintang, foto & riwayat' }}</button>
    </div>
  </main>
</template>
