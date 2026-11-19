// Interaksi dua arah: bintang per spot, XP & level (Kia tumbuh), Tantangan Hari Ini,
// kunjungan mingguan, badge, dan antrean perayaan. Semua progres disimpan di ponsel.
import { reactive, computed, watch } from 'vue'
import { load, save } from '../lib/storage'
import { content } from './content'
import { visits, onVisit, stampCount } from './visits'
export { stampCount }
import { now } from '../lib/time'
import { sendFeedback } from '../lib/feedback'

export const XP = {
  listen: 10,
  quiz: 20,
  quizFirstTry: 5,
  mission: 30,
  photoBonus: 10,
  rate: 5,
  ask: 2,
  askMaxPerDay: 5,
  trail: 50,
  trailQuiz: 20,
  daily: 25,
}

export const LEVELS = [
  { level: 1, name: 'Tunas', min: 0 },
  { level: 2, name: 'Daun', min: 100 },
  { level: 3, name: 'Ranting', min: 250 },
  { level: 4, name: 'Pohon', min: 500 },
  { level: 5, name: 'Kiara Agung', min: 900 },
]

const fresh = () => ({
  xp: 0,
  spots: {}, // { P03: { listened, quiz: { done, firstTry }, mission: { done, type, photos: [] }, rated: { [sessionStart]: rating }, ratedXp } }
  trailQuiz: {}, // { T01: { done, firstTry } }
  events: [], // [{ at, type, poi?, trail? }] untuk Tantangan Hari Ini
  ask: { day: null, n: 0 },
  dailyDone: {}, // { '2026-11-19': 'D3' }
  weeks: [], // minggu ISO dengan kunjungan, mis. '2026-W47'
  celebrated: { level: 1, badges: null },
  dismissed: {}, // nudge yang ditutup: { key: timestamp }
})

const stored = load('play', null)
export const play = reactive({ ...fresh(), ...(stored || {}) })
watch(play, (v) => save('play', v), { deep: true })

// Antrean perayaan (tidak disimpan): { kind: 'level'|'badge'|'daily'|'stars', title, text, stage?, xp? }
export const celebrations = reactive([])
const celebrate = (c) => celebrations.push({ id: Date.now() + Math.random(), ...c })
export const dismissCelebration = () => celebrations.shift()

// ---------------------------------------------------------------------------
// Waktu
// ---------------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0')
export const dayKey = (t = Date.now()) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export function weekKey(t = Date.now()) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)) // Kamis pada minggu yang sama
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const week = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${pad(week)}`
}
const minutesOf = (t) => {
  const d = new Date(t)
  return d.getHours() * 60 + d.getMinutes()
}

// ---------------------------------------------------------------------------
// Bintang & level
// ---------------------------------------------------------------------------
export const spotState = (id) => play.spots[id] || {}
function ensureSpot(id) {
  if (!play.spots[id]) play.spots[id] = {}
  return play.spots[id]
}
export function starsOf(id) {
  const s = play.spots[id]
  if (!s) return 0
  return (s.listened ? 1 : 0) + (s.quiz?.done ? 1 : 0) + (s.mission?.done ? 1 : 0)
}
export const totalStars = computed(() => content.pois.reduce((n, p) => n + starsOf(p.id), 0))

export const level = computed(() => {
  const xp = play.xp
  const cur = [...LEVELS].reverse().find((l) => xp >= l.min) || LEVELS[0]
  const next = LEVELS.find((l) => l.min > xp) || null
  const progress = next ? (xp - cur.min) / (next.min - cur.min) : 1
  return { ...cur, next, progress, toNext: next ? next.min - xp : 0 }
})

function addXp(n) {
  if (!n) return
  play.xp += n
}

// Naik level → Kia tumbuh
watch(
  () => level.value.level,
  (lv) => {
    if (lv > (play.celebrated.level || 1)) {
      play.celebrated.level = lv
      celebrate({ kind: 'level', stage: lv, title: `Kia tumbuh jadi ${level.value.name}!`, text: `Kamu naik ke Level ${lv}. Terima kasih sudah aktif menjelajah.` })
    }
  }
)

// ---------------------------------------------------------------------------
// Peristiwa & Tantangan Hari Ini
// ---------------------------------------------------------------------------
function logEvent(type, extra = {}) {
  const at = Date.now()
  play.events.unshift({ at, type, ...extra })
  play.events.splice(300)
  if (type === 'spot' || type === 'trail') {
    const w = weekKey(at)
    if (!play.weeks.includes(w)) play.weeks.push(w)
  }
  checkDaily()
}

export const todayChallenge = computed(() => {
  const list = content.daily_challenges || []
  if (!list.length) return null
  const d = new Date(now.value)
  const dayNumber = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000)
  return list[dayNumber % list.length]
})

function progressOf(ch, events = play.events) {
  if (!ch) return 0
  const today = dayKey(now.value)
  const before = ch.before ? Number(ch.before.slice(0, 2)) * 60 + Number(ch.before.slice(3, 5)) : null
  const list = events.filter((e) => dayKey(e.at) === today && (!before || minutesOf(e.at) < before))
  const type = ch.goal_type
  if (['listen', 'quiz', 'mission', 'photo', 'spot'].includes(type)) return new Set(list.filter((e) => e.type === type).map((e) => e.poi)).size
  return list.filter((e) => e.type === type).length
}

export const daily = computed(() => {
  const ch = todayChallenge.value
  if (!ch) return null
  const done = play.dailyDone[dayKey(now.value)] === ch.id
  const n = Math.min(ch.goal_count, progressOf(ch))
  return { ...ch, progress: n, done, expired: !done && ch.before && new Date(now.value).getHours() * 60 + new Date(now.value).getMinutes() >= Number(ch.before.slice(0, 2)) * 60 }
})

function checkDaily() {
  const ch = todayChallenge.value
  const key = dayKey()
  if (!ch || play.dailyDone[key]) return
  if (progressOf(ch) >= ch.goal_count) {
    play.dailyDone[key] = ch.id
    addXp(ch.xp || XP.daily)
    celebrate({ kind: 'daily', title: 'Tantangan Hari Ini selesai!', text: `${ch.title}: ${ch.description}`, xp: ch.xp || XP.daily })
  }
}

// Kunjungan mingguan berturut-turut
export const streak = computed(() => {
  const set = new Set(play.weeks)
  const week = 7 * 86400000
  let t = now.value
  if (!set.has(weekKey(t))) t -= week // minggu ini belum berkunjung → hitung dari minggu lalu
  let n = 0
  while (set.has(weekKey(t))) {
    n++
    t -= week
  }
  return { weeks: n, thisWeek: set.has(weekKey(now.value)) }
})

// ---------------------------------------------------------------------------
// Aksi pengguna
// ---------------------------------------------------------------------------
onVisit((poiId) => logEvent('spot', { poi: poiId }))

/** Narasi spot selesai didengarkan (⭐ 1) */
export function markListened(poiId) {
  const s = ensureSpot(poiId)
  logEvent('listen', { poi: poiId })
  if (s.listened) return false
  s.listened = Date.now()
  addXp(XP.listen)
  return true
}

/**
 * Kuis selesai (semua soal sudah benar).
 * results: [{ seq, attempts }] — attempts = jumlah percobaan sampai benar.
 */
export function completeQuiz(poiId, results) {
  const s = ensureSpot(poiId)
  const firstTry = results.every((r) => r.attempts === 1)
  logEvent('quiz', { poi: poiId })
  if (s.quiz?.done) return { xp: 0, firstTry }
  s.quiz = { done: Date.now(), firstTry }
  const xp = XP.quiz + (firstTry ? XP.quizFirstTry : 0)
  addXp(xp)
  results.forEach((r) => sendFeedback('quiz_result', { poi_id: poiId, question_seq: r.seq, correct_first_try: r.attempts === 1, attempts: Math.min(10, r.attempts) }))
  return { xp, firstTry }
}

export function completeTrailQuiz(trailId, results) {
  const firstTry = results.every((r) => r.attempts === 1)
  if (play.trailQuiz[trailId]?.done) return { xp: 0, firstTry }
  play.trailQuiz[trailId] = { done: Date.now(), firstTry }
  addXp(XP.trailQuiz)
  results.forEach((r) => sendFeedback('quiz_result', { trail_id: trailId, question_seq: r.seq, correct_first_try: r.attempts === 1, attempts: Math.min(10, r.attempts) }))
  return { xp: XP.trailQuiz, firstTry }
}

/** Misi selesai (⭐ 3). photoId = id foto di Jurnal (misi foto) */
export function completeMission(poiId, { type, photoId = null } = {}) {
  const s = ensureSpot(poiId)
  logEvent('mission', { poi: poiId })
  if (type === 'photo') logEvent('photo', { poi: poiId })
  const first = !s.mission?.done
  s.mission = { done: s.mission?.done || Date.now(), type, photos: [...(s.mission?.photos || []), ...(photoId ? [photoId] : [])] }
  if (!first) return { xp: 0 }
  const xp = XP.mission + (type === 'photo' ? XP.photoBonus : 0)
  addXp(xp)
  return { xp }
}

const sessionKey = () => String(visits.session.startedAt || dayKey())
export const ratedThisVisit = (poiId) => !!play.spots[poiId]?.rated?.[sessionKey()]

export function rateSpot(poiId, rating, useful = null) {
  const s = ensureSpot(poiId)
  s.rated = { ...(s.rated || {}), [sessionKey()]: rating }
  logEvent('rate', { poi: poiId })
  sendFeedback('visitor_rating', { poi_id: poiId, rating, useful })
  if (s.ratedXp) return { xp: 0 }
  s.ratedXp = true
  addXp(XP.rate)
  return { xp: XP.rate }
}

export function reportContent(poiId, message) {
  const text = String(message || '').trim().slice(0, 500)
  if (text.length < 3) return false
  sendFeedback('content_report', { poi_id: poiId || null, message: text })
  return true
}

/** Pertanyaan ke Kia. answered=false → dicatat anonim agar tim bisa menambah jawaban */
export function askedKia(question, answered) {
  logEvent('ask')
  const q = String(question || '').trim().slice(0, 200)
  if (!answered && q.length >= 2) sendFeedback('kia_question_log', { question: q })
  const today = dayKey()
  if (play.ask.day !== today) play.ask = { day: today, n: 0 }
  if (!answered || play.ask.n >= XP.askMaxPerDay) return 0
  play.ask.n++
  addXp(XP.ask)
  return XP.ask
}

/** Dipanggil saat Wellness Trail selesai */
export function trailFinished(result) {
  if (!result?.complete) return 0
  logEvent('trail', { trail: result.trailId })
  addXp(XP.trail)
  return XP.trail
}

// ---------------------------------------------------------------------------
// Badge (stempel, kuis, misi, foto, kunjungan mingguan)
// ---------------------------------------------------------------------------
export const badgeProgress = computed(() => {
  const trailComplete = visits.trailsDone.some((t) => t.complete)
  const quizSpots = content.pois.filter((p) => play.spots[p.id]?.quiz?.done).length
  const missionSpots = content.pois.filter((p) => play.spots[p.id]?.mission?.done).length
  const photoSpots = content.pois.filter((p) => play.spots[p.id]?.mission?.done && play.spots[p.id]?.mission?.type === 'photo').length
  return content.badges.map((b) => {
    const kind = b.kind || 'stamp'
    if (kind !== 'stamp') {
      const have = { quiz: quizSpots, mission: missionSpots, photo: photoSpots, streak: streak.value.weeks }[kind] || 0
      const need = b.min_count
      return { ...b, kind, have: Math.min(have, need), need, done: have >= need, missing: [], progress: Math.min(1, have / need) }
    }
    const pool = b.poi_ids.length ? b.poi_ids : content.pois.map((p) => p.id)
    const have = pool.filter((id) => visits.stamps[id]).length
    const need = Math.min(b.min_count, pool.length)
    const done = have >= need && (!b.requires_trail || trailComplete)
    const missing = pool.filter((id) => !visits.stamps[id])
    return { ...b, kind, have: Math.min(have, need), need, done, missing, progress: Math.min(1, have / need) * (b.requires_trail && !trailComplete ? 0.9 : 1) }
  })
})

export const nextBadge = computed(() => badgeProgress.value.filter((b) => !b.done).sort((a, b) => b.progress - a.progress)[0] || null)

// Badge yang sudah ada sebelum fitur ini tidak dirayakan ulang
if (!Array.isArray(play.celebrated.badges)) play.celebrated.badges = badgeProgress.value.filter((b) => b.done).map((b) => b.id)
watch(
  () => badgeProgress.value.filter((b) => b.done).map((b) => b.id).join(','),
  () => {
    for (const b of badgeProgress.value) {
      if (b.done && !play.celebrated.badges.includes(b.id)) {
        play.celebrated.badges.push(b.id)
        celebrate({ kind: 'badge', title: `Badge baru: ${b.name}`, text: b.description })
      }
    }
  }
)

export function resetPlay() {
  Object.assign(play, fresh(), { celebrated: { level: 1, badges: [] } })
  celebrations.splice(0)
}
