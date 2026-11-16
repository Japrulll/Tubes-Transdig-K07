// Audio & haptik: Web Speech API (TTS bahasa Indonesia), nada notifikasi, getar.
import { ref } from 'vue'

export const speaking = ref(false)
export const speakingKey = ref(null) // id konten yang sedang dibacakan (mis. 'poi:P03')
export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

let voice = null
function pickVoice() {
  if (!ttsSupported) return null
  const voices = window.speechSynthesis.getVoices()
  voice =
    voices.find((v) => v.lang === 'id-ID') ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('id')) ||
    voices.find((v) => /indonesia/i.test(v.name)) ||
    null
  return voice
}
if (ttsSupported) {
  pickVoice()
  window.speechSynthesis.onvoiceschanged = pickVoice
}

/**
 * Bacakan teks. Mengembalikan Promise yang selesai ketika ucapan berakhir/dibatalkan.
 * onBoundary(charIndex) dipakai untuk progres pemutar audio.
 */
export function speak(text, { key = null, rate = 1, onBoundary, interrupt = true } = {}) {
  return new Promise((resolve) => {
    if (!ttsSupported || !text) return resolve(false)
    const synth = window.speechSynthesis
    if (interrupt) synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'id-ID'
    u.rate = rate
    u.pitch = 1
    if (voice || pickVoice()) u.voice = voice
    u.onstart = () => {
      speaking.value = true
      speakingKey.value = key
    }
    const done = (ok) => {
      if (speakingKey.value === key) {
        speaking.value = false
        speakingKey.value = null
      }
      resolve(ok)
    }
    u.onend = () => done(true)
    u.onerror = () => done(false)
    if (onBoundary) u.onboundary = (e) => onBoundary(e.charIndex)
    synth.speak(u)
    // Chrome desktop memotong ujaran >15 detik; pause/resume berkala mencegahnya.
    // (Tidak dipakai di Android karena pause() di sana menghentikan ujaran.)
    if (!/android/i.test(navigator.userAgent)) {
      const keepAlive = setInterval(() => {
        if (!synth.speaking) return clearInterval(keepAlive)
        if (synth.paused) return
        synth.pause()
        synth.resume()
      }, 10000)
    }
  })
}

export function pauseSpeech() {
  if (ttsSupported) window.speechSynthesis.pause()
}
export function resumeSpeech() {
  if (ttsSupported) window.speechSynthesis.resume()
}
export function stopSpeech() {
  if (ttsSupported) window.speechSynthesis.cancel()
  speaking.value = false
  speakingKey.value = null
}

/** Estimasi durasi narasi (TTS id-ID ±2,6 kata per detik) */
export const estimateSeconds = (text) => Math.round((text || '').split(/\s+/).filter(Boolean).length / 2.6)

let ctx = null
/** Nada notifikasi dua ketukan (Web Audio, tanpa berkas audio) */
export function chime() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime
    ;[
      [880, 0],
      [1318.5, 0.16],
    ].forEach(([f, t]) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, now + t)
      g.gain.exponentialRampToValueAtTime(0.25, now + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.35)
      o.connect(g).connect(ctx.destination)
      o.start(now + t)
      o.stop(now + t + 0.4)
    })
  } catch {
    /* audio tidak tersedia */
  }
}

/** Buka kunci audio di iOS/Android pada interaksi pertama pengguna */
export function unlockAudio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    if (ttsSupported) {
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      window.speechSynthesis.speak(u)
    }
  } catch {
    /* abaikan */
  }
}

export function vibrate(pattern = [200, 100, 200]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* tidak didukung */
  }
}
