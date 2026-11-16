<script setup>
// A03 Transparansi & Privasi Lokasi
import TopBar from '../components/TopBar.vue'
import Icon from '../components/Icon.vue'
import { location } from '../stores/location'
import { resetAll } from '../stores/visits'
import { clearTriggerState, geofence } from '../stores/geofence'
import { save } from '../lib/storage'
import { ref } from 'vue'

const cleared = ref(false)
const points = [
  { icon: 'locate', title: 'Lokasi diproses di ponsel', text: 'Posisi GPS hanya dipakai untuk menghitung jarak ke 12 spot (rumus Haversine) langsung di perangkat Anda.' },
  { icon: 'shield', title: 'Tidak dikirim ke server', text: 'SETARA tidak pernah mengirim atau menyimpan posisi Anda di server. Permintaan ke database hanya mengambil konten taman (teks, jadwal, foto).' },
  { icon: 'award', title: 'Stempel tersimpan lokal', text: 'Koleksi stempel, ringkasan kunjungan, dan log trigger disimpan di penyimpanan ponsel (localStorage) dan bisa dihapus kapan saja.' },
  { icon: 'external', title: 'Google Maps opsional', text: 'Tombol "Google Maps" hanya membuka rute ke koordinat spot tujuan; posisi Anda tidak disertakan di tautan.' },
  { icon: 'qr', title: 'Tanpa lokasi pun bisa', text: 'Jika izin lokasi tidak diberikan, gunakan Mode QR di papan setiap spot untuk membuka konten yang sama.' },
]

function wipe() {
  resetAll()
  clearTriggerState()
  geofence.log = []
  save('triggerLog', [])
  cleared.value = true
}
</script>

<template>
  <main class="flex flex-col bg-canvas">
    <TopBar title="Privasi Lokasi" />
    <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
      <p class="eyebrow">Transparansi data</p>
      <h2 class="mt-1 text-[22px] font-medium leading-tight text-ink">Lokasi Anda tetap<br />di ponsel Anda</h2>
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
        Ubah izin melalui pengaturan situs/aplikasi di ponsel Anda.
      </div>
      <button class="btn-outline mt-5 w-full" @click="wipe"><Icon name="refresh" :size="16" /> {{ cleared ? 'Data kunjungan dihapus' : 'Hapus stempel & riwayat di ponsel ini' }}</button>
    </div>
  </main>
</template>
