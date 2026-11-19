import { reactive, watch } from 'vue'
import { load, save } from '../lib/storage'

const defaults = {
  onboarded: false,
  audioMode: false, // F04: narasi diputar otomatis saat trigger
  navVoice: true, // panduan suara navigasi
  simulation: false, // mode simulasi lokasi (uji/demonstrasi di luar taman)
  quiet: false, // Mode tenang: Kia tidak menampilkan ajakan/nudge
  kiaVoice: true, // Kia membacakan jawaban di Tanya Kia
  reminders: false, // pengingat terjadwal (hanya aplikasi Android/iOS)
}

export const settings = reactive({ ...defaults, ...load('settings', {}) })

watch(settings, (v) => save('settings', v), { deep: true })
