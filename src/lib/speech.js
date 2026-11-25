// Input suara (bahasa Indonesia) untuk Tanya Kia dan kotak Cari.
// - Web: Web Speech API (Chrome, Edge, Safari). Firefox belum mendukung.
// - Aplikasi Android/iOS (Capacitor): plugin native @capacitor-community/speech-recognition,
//   karena WebView Android tidak menyediakan SpeechRecognition.
const isNative = () => !!window.Capacitor?.isNativePlatform?.()
const WebSR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

/** Apakah perangkat ini (kemungkinan) bisa menerima input suara */
export const speechSupported = () => isNative() || !!WebSR

const WEB_ERRORS = {
  'not-allowed': 'Izin mikrofon ditolak. Izinkan mikrofon di pengaturan browser, lalu coba lagi.',
  'service-not-allowed': 'Izin mikrofon ditolak. Izinkan mikrofon di pengaturan browser, lalu coba lagi.',
  'audio-capture': 'Mikrofon tidak ditemukan. Pastikan mikrofon terpasang dan tidak dipakai aplikasi lain.',
  'no-speech': 'Aku belum mendengar suaramu. Ketuk mikrofon lalu bicara, ya.',
  network: 'Pengenalan suara butuh koneksi internet. Coba lagi saat online.',
  'language-not-supported': 'Bahasa Indonesia belum didukung pengenalan suara di browser ini.',
}
export const UNSUPPORTED_MESSAGE = 'Input suara belum didukung di browser ini. Coba Chrome atau Edge, atau ketik pertanyaanmu.'

/**
 * Mulai mendengarkan. Mengembalikan fungsi stop().
 * @param {{ onPartial?: (text: string) => void, onFinal: (text: string) => void, onError?: (message: string) => void, onEnd?: () => void }} handlers
 */
export function listen({ onPartial = () => {}, onFinal, onError = () => {}, onEnd = () => {} }) {
  if (isNative()) return listenNative({ onPartial, onFinal, onError, onEnd })
  if (!WebSR) {
    onError(UNSUPPORTED_MESSAGE)
    onEnd()
    return () => {}
  }
  const r = new WebSR()
  r.lang = 'id-ID'
  r.interimResults = true
  r.maxAlternatives = 1
  let finalText = ''
  let lastText = ''
  let errored = false
  r.onresult = (e) => {
    lastText = [...e.results].map((x) => x[0].transcript).join(' ').trim()
    onPartial(lastText)
    if (e.results[e.results.length - 1].isFinal) finalText = lastText
  }
  r.onerror = (e) => {
    if (e.error === 'aborted') return
    errored = true
    onError(WEB_ERRORS[e.error] || 'Input suara gagal. Coba lagi atau ketik pertanyaanmu.')
  }
  r.onend = () => {
    // Sebagian browser berhenti tanpa menandai hasil "final": pakai teks terakhir yang terdengar
    const text = finalText || lastText
    if (text) onFinal(text)
    else if (!errored) onError(WEB_ERRORS['no-speech'])
    onEnd()
  }
  try {
    r.start()
  } catch {
    onError('Input suara sedang dipakai. Tunggu sebentar lalu coba lagi.')
    onEnd()
  }
  return () => {
    try {
      r.stop()
    } catch {
      /* sudah berhenti */
    }
  }
}

function listenNative({ onPartial, onFinal, onError, onEnd }) {
  let stopped = false
  let lastText = ''
  let plugin = null
  const handles = []
  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    handles.forEach((h) => h?.remove?.())
    if (lastText) onFinal(lastText)
    else onError(WEB_ERRORS['no-speech'])
    onEnd()
  }
  ;(async () => {
    try {
      ;({ SpeechRecognition: plugin } = await import('@capacitor-community/speech-recognition'))
      const { available } = await plugin.available()
      if (!available) throw new Error('unavailable')
      const perm = await plugin.requestPermissions()
      if (perm.speechRecognition !== 'granted') {
        finished = true
        onError('Izin mikrofon ditolak. Izinkan mikrofon untuk SETARA di pengaturan ponsel.')
        onEnd()
        return
      }
      if (stopped) return finish()
      handles.push(
        await plugin.addListener('partialResults', (d) => {
          lastText = (d.matches?.[0] || '').trim()
          onPartial(lastText)
        })
      )
      handles.push(await plugin.addListener('listeningState', (d) => d.status === 'stopped' && finish()))
      const res = await plugin.start({ language: 'id-ID', maxResults: 1, partialResults: true, popup: false })
      if (res?.matches?.[0]) lastText = res.matches[0].trim()
    } catch (e) {
      if (finished) return
      finished = true
      handles.forEach((h) => h?.remove?.())
      onError(String(e?.message) === 'unavailable' ? 'Pengenalan suara tidak tersedia di ponsel ini. Ketik pertanyaanmu, ya.' : 'Input suara gagal. Coba lagi atau ketik pertanyaanmu.')
      onEnd()
    }
  })()
  return () => {
    stopped = true
    plugin?.stop?.().catch?.(() => {})
    setTimeout(finish, 600)
  }
}
