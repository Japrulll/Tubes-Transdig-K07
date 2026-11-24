// Akun pengguna (Supabase Auth: Google atau email) + sinkronisasi progres per pengguna.
//
// - Tanpa login aplikasi tetap berjalan penuh (mode tamu, progres hanya di ponsel).
// - Setelah login, progres tamu di ponsel DIGABUNG dengan progres akun, lalu setiap perubahan
//   (stempel, bintang/XP, riwayat kunjungan, trail, preferensi) disimpan ke akun.
// - Penyimpanan akun: tabel public.user_progress (RLS: hanya pemilik). Bila migrasi
//   20261124000000_setara_akun_pengguna.sql belum dijalankan, progres sementara disimpan di
//   user_metadata akun agar fitur tetap bekerja.
// - Lokasi GPS dan foto Jurnal TIDAK pernah ikut disinkronkan.
import { reactive, computed, watch } from 'vue'
import { getAuthClient, supabaseEnabled } from '../lib/supabase'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'
import { load, save } from '../lib/storage'
import { visits, resetAll } from './visits'
import { play, resetPlay } from './play'
import { settings } from './settings'

const PREF_KEYS = ['audioMode', 'navVoice', 'quiet', 'kiaVoice']
const isNative = () => !!window.Capacitor?.isNativePlatform?.()

export const auth = reactive({
  ready: false,
  user: null,
  busy: false,
  error: null,
  notice: null,
  providers: { google: null, email: null }, // null = belum dicek
  sync: { status: 'idle', at: load('syncAt', null), backend: null, error: null }, // idle | syncing | synced | pending | error
})

export const isLoggedIn = computed(() => !!auth.user)

export const profile = computed(() => {
  const u = auth.user
  if (!u) return null
  const m = u.user_metadata || {}
  const name = m.full_name || m.name || (u.email ? u.email.split('@')[0] : 'Penjelajah')
  return {
    name,
    first: name.split(' ')[0],
    email: u.email || '',
    avatar: m.avatar_url || m.picture || null,
    provider: u.app_metadata?.provider || 'email',
    initials: name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join(''),
  }
})

// Login Google lewat redirect tidak didukung di WebView aplikasi (.apk); di sana pakai email.
export const googleAvailable = computed(() => !isNative() && auth.providers.google !== false)

// ---------------------------------------------------------------------------
// Pesan galat dalam bahasa Indonesia
// ---------------------------------------------------------------------------
function message(e) {
  const m = String(e?.message || e || '')
  if (/invalid login credentials/i.test(m)) return 'Email atau kata sandi salah.'
  if (/email not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Buka tautan konfirmasi di kotak masuk emailmu.'
  if (/already registered|already been registered/i.test(m)) return 'Email ini sudah terdaftar. Silakan masuk.'
  if (/password should be at least|password.*(short|characters)/i.test(m)) return 'Kata sandi minimal 6 karakter.'
  if (/rate limit|too many/i.test(m)) return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.'
  if (/provider is not enabled|unsupported provider/i.test(m)) return 'Login Google belum diaktifkan di server. Gunakan email dulu, ya.'
  if (/signups not allowed/i.test(m)) return 'Pendaftaran akun baru sedang ditutup.'
  if (/invalid email|unable to validate email/i.test(m)) return 'Format email tidak valid.'
  if (/failed to fetch|network/i.test(m)) return 'Tidak ada koneksi internet. Coba lagi saat online.'
  return m || 'Terjadi kesalahan. Coba lagi.'
}

const redirectUrl = () => window.location.origin + window.location.pathname

/** Hapus ?code= / ?error= sisa redirect OAuth & konfirmasi email dari URL (hash rute tetap). */
function cleanAuthParams() {
  const url = new URL(window.location.href)
  const err = url.searchParams.get('error_description')
  if (err) auth.error = message(err.replace(/\+/g, ' '))
  const keys = ['code', 'error', 'error_code', 'error_description', 'state']
  if (!keys.some((k) => url.searchParams.has(k))) return
  keys.forEach((k) => url.searchParams.delete(k))
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
}

async function loadProviders() {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } })
    const s = await r.json()
    auth.providers = { google: !!s.external?.google, email: s.external?.email !== false }
  } catch {
    /* offline: biarkan null, tombol tetap tampil */
  }
}

// ---------------------------------------------------------------------------
// Inisialisasi sesi
// ---------------------------------------------------------------------------
let pulledFor = null

function setUser(u) {
  auth.user = u ? { id: u.id, email: u.email, user_metadata: u.user_metadata, app_metadata: u.app_metadata } : null
}

export async function initAuth() {
  if (!supabaseEnabled) {
    auth.ready = true
    return
  }
  loadProviders()
  try {
    const sb = await getAuthClient()
    const { data, error } = await sb.auth.getSession() // juga menukar ?code= hasil redirect Google
    if (error) auth.error = message(error)
    cleanAuthParams()
    setUser(data?.session?.user || null)
    sb.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (event === 'SIGNED_OUT') pulledFor = null
      // Jangan menunggu panggilan Supabase lain di dalam callback ini (bisa deadlock)
      if (session?.user && pulledFor !== session.user.id) setTimeout(pullAndMerge, 0)
    })
    if (auth.user) pullAndMerge()
  } catch (e) {
    auth.error = message(e)
  } finally {
    auth.ready = true
  }
}

// ---------------------------------------------------------------------------
// Login / daftar / keluar
// ---------------------------------------------------------------------------
async function run(fn) {
  auth.busy = true
  auth.error = null
  auth.notice = null
  try {
    return await fn(await getAuthClient())
  } catch (e) {
    auth.error = message(e)
    return null
  } finally {
    auth.busy = false
  }
}

export function signInWithGoogle() {
  if (auth.providers.google === false) {
    auth.error = message('provider is not enabled')
    return Promise.resolve(null)
  }
  return run(async (sb) => {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl(), queryParams: { prompt: 'select_account' } },
    })
    if (error) throw error
    return true // browser berpindah ke halaman Google
  })
}

export function signInWithEmail(email, password) {
  return run(async (sb) => {
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw error
    setUser(data.user)
    return data.user
  })
}

export function signUpWithEmail(name, email, password) {
  return run(async (sb) => {
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: redirectUrl() },
    })
    if (error) throw error
    // Supabase mengembalikan user tanpa identitas bila email sudah terdaftar
    if (data.user && !data.user.identities?.length) throw new Error('already registered')
    if (data.session) {
      setUser(data.user)
      return data.user
    }
    auth.notice = `Kami mengirim tautan konfirmasi ke ${email.trim()}. Buka tautan itu, lalu kembali ke sini untuk masuk.`
    return 'confirm'
  })
}

export function resetPassword(email) {
  return run(async (sb) => {
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl() })
    if (error) throw error
    auth.notice = `Jika ${email.trim()} terdaftar, tautan atur ulang kata sandi sudah dikirim.`
    return true
  })
}

/**
 * Keluar dari akun. Progres disimpan ke akun lebih dulu, lalu progres di ponsel ini
 * dikosongkan (kembali ke mode tamu). Bila penyimpanan gagal dan `force` tidak diberikan,
 * mengembalikan { unsynced: true } agar UI bisa meminta konfirmasi.
 */
export async function signOut({ force = false } = {}) {
  if (!auth.user) return { ok: true }
  auth.busy = true
  try {
    const saved = await pushNow()
    if (!saved && !force) return { unsynced: true }
    const sb = await getAuthClient()
    await sb.auth.signOut({ scope: 'local' })
    setUser(null)
    pulledFor = null
    applying = true
    resetAll()
    resetPlay()
    applying = false
    auth.sync.status = 'idle'
    auth.sync.at = null
    save('syncAt', null)
    return { ok: true }
  } catch (e) {
    auth.error = message(e)
    return { ok: false }
  } finally {
    auth.busy = false
  }
}

// ---------------------------------------------------------------------------
// Sinkronisasi progres
// ---------------------------------------------------------------------------
const clone = (o) => JSON.parse(JSON.stringify(o ?? null))

function snapshot({ compact = false } = {}) {
  const p = clone(play)
  delete p.dismissed // ajakan yang ditutup cukup per perangkat
  if (compact) p.events = (p.events || []).slice(0, 40)
  return {
    v: 1,
    savedAt: Date.now(),
    stamps: clone(visits.stamps),
    history: clone(visits.history),
    trailsDone: clone(visits.trailsDone),
    play: p,
    prefs: Object.fromEntries(PREF_KEYS.map((k) => [k, settings[k]])),
  }
}

const byKey = (list, key) => {
  const m = new Map()
  for (const x of list || []) if (x && !m.has(key(x))) m.set(key(x), x)
  return [...m.values()]
}

function mergeSpots(a = {}, b = {}) {
  const out = clone(a) || {}
  for (const [id, s] of Object.entries(b || {})) {
    const t = out[id]
    if (!t) {
      out[id] = s
      continue
    }
    t.listened = t.listened || s.listened
    if (!t.quiz?.done && s.quiz?.done) t.quiz = s.quiz
    if (!t.mission?.done && s.mission?.done) t.mission = s.mission
    t.rated = { ...(s.rated || {}), ...(t.rated || {}) }
  }
  return out
}

/** Gabungkan progres lokal & akun tanpa kehilangan stempel atau bintang dari keduanya. */
function merge(local, remote) {
  if (!remote) return local
  const stamps = { ...(remote.stamps || {}) }
  for (const [id, s] of Object.entries(local.stamps || {})) if (!stamps[id] || s.at < stamps[id].at) stamps[id] = s
  const history = byKey([...(local.history || []), ...(remote.history || [])], (h) => h.startedAt)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 10)
  const trailsDone = byKey([...(local.trailsDone || []), ...(remote.trailsDone || [])], (t) => `${t.trailId}:${t.at}`).sort((a, b) => a.at - b.at)

  const lp = local.play || {}
  const rp = remote.play || {}
  const [base, other] = (rp.xp || 0) > (lp.xp || 0) ? [rp, lp] : [lp, rp]
  const mergedPlay = {
    ...base,
    spots: mergeSpots(base.spots, other.spots),
    trailQuiz: { ...(other.trailQuiz || {}), ...(base.trailQuiz || {}) },
    events: byKey([...(base.events || []), ...(other.events || [])], (e) => `${e.at}:${e.type}:${e.poi || e.trail || ''}`)
      .sort((a, b) => b.at - a.at)
      .slice(0, 300),
    dailyDone: { ...(other.dailyDone || {}), ...(base.dailyDone || {}) },
    weeks: [...new Set([...(base.weeks || []), ...(other.weeks || [])])].sort(),
    celebrated: {
      level: Math.max(base.celebrated?.level || 1, other.celebrated?.level || 1),
      badges: [...new Set([...(base.celebrated?.badges || []), ...(other.celebrated?.badges || [])])],
    },
  }
  return { ...local, stamps, history, trailsDone, play: mergedPlay, prefs: remote.prefs || local.prefs }
}

let applying = false
function apply(snap) {
  applying = true
  try {
    visits.stamps = snap.stamps || {}
    visits.history = snap.history || []
    visits.trailsDone = snap.trailsDone || []
    const dismissed = play.dismissed
    Object.assign(play, snap.play || {}, { dismissed })
    for (const k of PREF_KEYS) if (snap.prefs && k in snap.prefs) settings[k] = snap.prefs[k]
  } finally {
    // Watcher Vue berjalan setelah microtask; lepaskan penanda sesudahnya
    Promise.resolve().then(() => (applying = false))
  }
}

const missingTable = (e) => ['PGRST205', '42P01', 'PGRST106'].includes(e?.code) || /could not find the table|does not exist/i.test(e?.message || '')

async function remoteGet(sb) {
  if (auth.sync.backend !== 'metadata') {
    const { data, error } = await sb.from('user_progress').select('data').eq('user_id', auth.user.id).maybeSingle()
    if (!error) {
      auth.sync.backend = 'table'
      return data?.data || null
    }
    if (!missingTable(error)) throw error
    auth.sync.backend = 'metadata'
  }
  const { data, error } = await sb.auth.getUser()
  if (error) throw error
  return data.user?.user_metadata?.setara_progress || null
}

async function remotePut(sb) {
  if (auth.sync.backend === 'table') {
    const { error } = await sb.from('user_progress').upsert({
      user_id: auth.user.id,
      display_name: profile.value?.name || null,
      data: snapshot(),
      updated_at: new Date().toISOString(),
    })
    if (!error) return
    if (!missingTable(error)) throw error
    auth.sync.backend = 'metadata'
  }
  const { error } = await sb.auth.updateUser({ data: { setara_progress: snapshot({ compact: true }) } })
  if (error) throw error
}

function markSynced() {
  auth.sync.status = 'synced'
  auth.sync.error = null
  auth.sync.at = Date.now()
  save('syncAt', auth.sync.at)
}

export async function pullAndMerge() {
  if (!auth.user || !supabaseEnabled) return
  const uid = auth.user.id
  pulledFor = uid
  auth.sync.status = 'syncing'
  try {
    const sb = await getAuthClient()
    const remote = await remoteGet(sb)
    if (auth.user?.id !== uid) return
    apply(merge(snapshot(), remote))
    await remotePut(sb)
    markSynced()
  } catch (e) {
    pulledFor = null
    auth.sync.status = navigator.onLine === false ? 'pending' : 'error'
    auth.sync.error = message(e)
  }
}

let pushing = null
export async function pushNow() {
  if (!auth.user || !supabaseEnabled) return false
  if (pulledFor !== auth.user.id) {
    await pullAndMerge()
    return auth.sync.status === 'synced'
  }
  if (navigator.onLine === false) {
    auth.sync.status = 'pending'
    return false
  }
  clearTimeout(timer)
  if (pushing) await pushing
  auth.sync.status = 'syncing'
  pushing = (async () => {
    try {
      await remotePut(await getAuthClient())
      markSynced()
      return true
    } catch (e) {
      auth.sync.status = 'error'
      auth.sync.error = message(e)
      return false
    } finally {
      pushing = null
    }
  })()
  return pushing
}

let timer = null
function schedulePush() {
  if (applying || !auth.user || pulledFor !== auth.user.id) return
  auth.sync.status = 'pending'
  clearTimeout(timer)
  timer = setTimeout(pushNow, 2500)
}

watch(() => [visits.stamps, visits.history, visits.trailsDone, play.xp, play.spots, play.events.length, play.weeks, play.dailyDone], schedulePush, { deep: true })
watch(() => PREF_KEYS.map((k) => settings[k]), schedulePush)

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => auth.user && (auth.sync.status === 'pending' || auth.sync.status === 'error') && pushNow())
  // Simpan saat aplikasi ditutup/dipindah ke latar belakang
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && auth.sync.status === 'pending' && pushNow())
}
