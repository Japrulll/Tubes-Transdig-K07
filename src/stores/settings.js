import { reactive, watch } from 'vue'
import { load, save } from '../lib/storage'

export const settings = reactive(
  load('settings', {
    onboarded: false,
    audioMode: false, // F04: narasi diputar otomatis saat trigger
    navVoice: true, // panduan suara navigasi
    simulation: false, // mode simulasi lokasi (uji/demonstrasi di luar taman)
  })
)

watch(settings, (v) => save('settings', v), { deep: true })
