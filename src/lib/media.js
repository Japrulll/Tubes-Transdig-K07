// Ketersediaan media (foto/audio survei di bucket Supabase "poi-media").
// Berkas yang belum diunggah otomatis diganti ilustrasi / narasi TTS.
import { reactive } from 'vue'

const state = reactive({ ok: {}, bad: {} })

/** Muat gambar di latar; komponen hanya menampilkan URL yang berhasil dimuat */
export function probeImage(url) {
  if (!url || state.ok[url] || state.bad[url] || typeof Image === 'undefined') return
  state.bad[url] = 'pending'
  const img = new Image()
  img.onload = () => {
    delete state.bad[url]
    state.ok[url] = true
  }
  img.onerror = () => (state.bad[url] = true)
  img.src = url
}

export const imageReady = (url) => !!state.ok[url]
export const markAudioBroken = (url) => url && (state.bad[url] = true)
export const audioBroken = (url) => state.bad[url] === true
