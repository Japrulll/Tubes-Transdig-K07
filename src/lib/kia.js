// Tanya Kia — menjawab pertanyaan pengunjung secara OFFLINE dari data aplikasi.
// Jawaban dinamis memakai data langsung: jarak dari posisimu, buka/tutup sekarang,
// hitung mundur pertunjukan air mancur, rekomendasi sesuai waktu, dan progres bintang.
import { content, getPoi } from '../stores/content'
import { location } from '../stores/location'
import { geofence, currentPoi, nearest } from '../stores/geofence'
import { visits, stampCount } from '../stores/visits'
import { play, level, daily, starsOf, totalStars, streak } from '../stores/play'
import { haversine, formatDistance, walkMinutes } from './geo'
import { openStatus, nextSchedule, countdownLabel, fmtTime, timeSlot, currentDate } from './time'
import { recommend } from './recommend'

export const norm = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const has = (t, words) => words.some((w) => new RegExp(`(^| )${esc(norm(w))}( |$)`).test(t))

const WHERE = ['dimana', 'di mana', 'mana', 'terdekat', 'dekat', 'arah', 'letak', 'kemana', 'ke mana', 'cari', 'mau ke', 'nyari']
const QUESTION = ['apa', 'apakah', 'kapan', 'berapa', 'dimana', 'di mana', 'mana', 'gimana', 'bagaimana', 'bisa', 'boleh', 'ada', 'kenapa', 'mengapa', 'siapa', 'jam berapa', 'enaknya', 'kemana', 'ke mana']

const FACILITY = [
  { words: ['toilet', 'wc', 'kamar mandi', 'kamar kecil', 'buang air'], poi: 'P12', label: 'toilet', extra: 'Toilet lain ada di sekitar area parkir sisi barat laut.' },
  { words: ['musala', 'mushola', 'mushala', 'musholla', 'masjid', 'salat', 'sholat', 'shalat', 'wudu', 'wudhu', 'solat', 'jumatan'], poi: ['P12', 'P16'], label: 'musala & masjid' },
  { words: ['parkir', 'parkiran', 'mobil', 'motor'], poi: 'P02', label: 'area parkir' },
  { words: ['makan', 'kuliner', 'jajan', 'food court', 'restoran', 'lapar', 'minum', 'kafe', 'cafe', 'kopi', 'ngopi', 'haus', 'steak', 'waffle'], poi: ['P08', 'P15', 'P09'], label: 'tempat makan & minum' },
  { words: ['sepeda', 'boseh', 'skuter', 'bersepeda'], poi: 'P07', label: 'sewa sepeda' },
  { words: ['teduh', 'istirahat', 'duduk', 'adem', 'rehat', 'capek', 'lelah'], poi: 'P11', label: 'tempat teduh' },
  { words: ['spot foto', 'foto', 'instagramable', 'selfie', 'foto foto'], poi: 'P05', label: 'spot foto ikonik' },
  { words: ['jogging', 'lari', 'olahraga', 'joging'], poi: 'P06', label: 'titik start jogging' },
  { words: ['padel', 'raket'], poi: 'P09', label: 'lapangan padel' },
  { words: ['pintu', 'gerbang', 'pintu keluar', 'pintu masuk', 'keluar'], poi: ['P01', 'P13', 'P14'], label: 'gerbang' },
]

function distanceText(p) {
  if (!location.position) return null
  const d = geofence.distances[p.id] ?? haversine(location.position, p)
  return { d, text: `${formatDistance(d)} dari posisimu, ±${walkMinutes(d)} menit jalan kaki` }
}

function mentionedPoi(t) {
  let best = null
  for (const p of content.pois) {
    const names = [p.short_name, p.name, p.name.replace(/^spot foto ikonik: /i, '')].map(norm)
    const keys = (p.keywords || []).map(norm).filter((k) => k.length >= 4)
    for (const n of names)
      if (n && t.includes(n) && (!best || n.length + 10 > best.score)) best = { poi: p, score: n.length + 10 }
    for (const k of keys) if (has(t, [k]) && (!best || k.length > best.score)) best = { poi: p, score: k.length }
  }
  return best?.poi || null
}

const navAction = (p) => ({ kind: 'navigate', poi: p.id, label: `Arahkan ke ${p.short_name}` })
const detailAction = (p) => ({ kind: 'detail', poi: p.id, label: `Lihat ${p.short_name}` })

function nearestOf(ids) {
  const list = (Array.isArray(ids) ? ids : [ids]).map(getPoi).filter(Boolean)
  if (!location.position) return list[0]
  return list.map((p) => ({ p, d: haversine(location.position, p) })).sort((a, b) => a.d - b.d)[0].p
}

// ---------------------------------------------------------------------------
// Jawaban per maksud (intent)
// ---------------------------------------------------------------------------
function facilityAnswer(f) {
  const p = nearestOf(f.poi)
  const dist = distanceText(p)
  const status = openStatus(p)
  const text =
    `${capital(f.label)} terdekat: ${p.name}, ${p.location_label.charAt(0).toLowerCase() + p.location_label.slice(1)}.` +
    (dist ? ` Sekitar ${dist.text}.` : ' Aktifkan lokasi supaya aku bisa hitung jaraknya.') +
    (!status.open ? ` Saat ini ${status.label.toLowerCase()}.` : '') +
    (f.extra ? ` ${f.extra}` : '')
  return { intent: 'facility', text, actions: [navAction(p), detailAction(p)] }
}

function showAnswer() {
  const p = getPoi('P03')
  const s = nextSchedule(p)
  let text
  if (s?.ongoing) text = `Air mancur menari sedang tampil sekarang! Sesi ini sampai pukul ${fmtTime(s.end)}.`
  else if (s) text = `Pertunjukan air mancur menari berikutnya pukul ${fmtTime(s.start)}, ${countdownLabel(s).toLowerCase()}. Datang 15 menit lebih awal supaya dapat posisi depan.`
  else {
    const first = (p.schedules || [])[0]
    text = `Pertunjukan hari ini sudah selesai. Biasanya mulai lagi pukul ${first ? fmtTime(first.start) : '18.30'} besok malam.`
  }
  text += ' Sudut terbaik untuk menonton ada di Taman Asia Afrika, sisi selatan danau.'
  return { intent: 'show', text, actions: [navAction(p), navAction(getPoi('P05'))] }
}

function openAnswer(p) {
  if (p) {
    const s = openStatus(p)
    const text = s.open ? `${p.short_name} sedang buka${s.closesAt ? `, sampai pukul ${fmtTime(s.closesAt)}` : ''}.` : `${p.short_name} sedang tutup${s.opensAt ? `. Buka lagi pukul ${fmtTime(s.opensAt)}` : ''}.`
    return { intent: 'open', text: text + (p.status_note ? ` Catatan: ${p.status_note}` : ''), actions: [detailAction(p)] }
  }
  const h = content.park.opening_hours
  const mins = currentDate().getHours() * 60 + currentDate().getMinutes()
  const [oh, om] = h.open.split(':').map(Number)
  const [ch, cm] = h.close.split(':').map(Number)
  const open = mins >= oh * 60 + om && mins < ch * 60 + cm
  return { intent: 'open', text: `Taman buka setiap hari pukul ${fmtTime(h.open)}–${fmtTime(h.close)} WIB. Sekarang taman sedang ${open ? 'buka' : 'tutup'}. Tiap tenant dan wahana punya jam sendiri, tanya saja nama spotnya, ya.` }
}

function distanceAnswer(p) {
  const dist = distanceText(p)
  return {
    intent: 'distance',
    text: dist ? `${p.short_name} ${dist.text}.` : `Aku belum tahu posisimu. Aktifkan lokasi, nanti aku hitung jarak ke ${p.short_name}.`,
    actions: [navAction(p)],
  }
}

function hereAnswer() {
  const at = currentPoi.value?.poi
  if (at) return { intent: 'here', text: `Kamu sedang di ${at.name}. ${at.summary} Sudah ${starsOf(at.id)} dari 3 bintang di sini.`, actions: [{ kind: 'challenge', poi: at.id, label: 'Ikut tantangan di sini' }, detailAction(at)] }
  const n = nearest.value
  if (n) return { intent: 'here', text: `Spot terdekat darimu: ${n.poi.name}, ${formatDistance(n.distance)}. ${n.poi.summary}`, actions: [navAction(n.poi)] }
  return { intent: 'here', text: 'Aku belum tahu posisimu. Aktifkan lokasi atau scan QR di papan spot terdekat, ya.', actions: [{ kind: 'route', to: '/qr', label: 'Scan QR spot' }] }
}

function recommendAnswer() {
  const recs = recommend({ from: location.position || null, limit: 2 })
  if (!recs.length) return { intent: 'recommend', text: 'Kamu sudah mengunjungi semua spot! Coba kejar bintang yang tersisa atau ikut Wellness Trail.', actions: [{ kind: 'route', to: '/trail', label: 'Lihat Wellness Trail' }] }
  const slot = { pagi: 'pagi', siang: 'siang', sore: 'sore', malam: 'malam' }[timeSlot()]
  const parts = recs.map((r) => `${r.poi.short_name} (${r.meta})`)
  return { intent: 'recommend', text: `Untuk ${slot} ini, menurutku coba ${parts.join(' atau ')}.`, actions: recs.map((r) => navAction(r.poi)) }
}

function progressAnswer() {
  const lv = level.value
  const text =
    `Kamu Level ${lv.level} (${lv.name}) dengan ${play.xp} XP. Sudah ${totalStars.value} bintang dan ${stampCount.value} dari ${content.pois.length} stempel.` +
    (lv.next ? ` ${lv.toNext} XP lagi supaya aku tumbuh jadi ${lv.next.name}.` : ' Aku sudah jadi Kiara Agung berkat kamu!') +
    (streak.value.weeks > 1 ? ` Kamu berkunjung ${streak.value.weeks} minggu berturut-turut!` : '')
  return { intent: 'progress', text, actions: [{ kind: 'route', to: '/stamps', label: 'Lihat koleksi' }] }
}

function challengeAnswer() {
  const d = daily.value
  const at = currentPoi.value?.poi
  let text = d ? `Tantangan hari ini: ${d.title}. ${d.description} ${d.done ? 'Kamu sudah menyelesaikannya!' : `Progres ${d.progress}/${d.goal_count}.`}` : ''
  if (at && starsOf(at.id) < 3) text += ` Di ${at.short_name} masih ada bintang yang bisa kamu raih.`
  else text += ' Setiap spot punya kuis dan misi; dengarkan ceritanya dulu, lalu ketuk "Tantangan".'
  return { intent: 'challenge', text: text.trim(), actions: at ? [{ kind: 'challenge', poi: at.id, label: `Tantangan di ${at.short_name}` }] : [] }
}

function trailAnswer() {
  const list = content.trails.map((t) => `${t.name} (${t.distance_m} m, ±${t.est_minutes} menit)`).join(' dan ')
  return { intent: 'trail', text: `Ada dua Wellness Trail: ${list}. Aku memandu setiap checkpoint dengan suara.`, actions: [{ kind: 'route', to: '/trail', label: 'Mulai Wellness Trail' }] }
}

function poiAnswer(p) {
  const status = openStatus(p)
  const dist = distanceText(p)
  return {
    intent: 'poi',
    text: `${p.name}: ${p.summary}${dist ? ` Jaraknya ${dist.text}.` : ''}${!status.open ? ` Saat ini ${status.label.toLowerCase()}.` : ''}`,
    actions: [navAction(p), detailAction(p)],
  }
}

function faqAnswer(t, strict) {
  for (const f of content.faq || []) {
    if (f.patterns.some((pt) => (strict ? has(t, [pt]) : t.includes(norm(pt))))) {
      const p = f.poi_id ? getPoi(f.poi_id) : null
      return { intent: `faq:${f.id}`, text: f.answer, actions: p ? [detailAction(p)] : [] }
    }
  }
  return null
}

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * @returns {{ text: string, intent: string, answered: boolean, actions: Array }}
 */
export function answer(question) {
  const t = norm(question)
  const done = (a) => ({ actions: [], ...a, answered: a.intent !== 'fallback' })
  if (!t) return done({ intent: 'help', text: 'Tanya apa saja soal taman ini: jadwal air mancur, toilet terdekat, jam buka, atau mau ke mana sekarang.' })

  const words = t.split(' ')
  if (words.length <= 3 && has(t, ['halo', 'hai', 'hi', 'hallo', 'hey', 'pagi', 'siang', 'sore', 'malam', 'assalamualaikum', 'punten', 'sampurasun']))
    return done({ intent: 'greeting', text: `${greeting()} Aku Kia. Mau tahu apa soal Kiara Artha Park?` })
  if (has(t, ['makasih', 'terima kasih', 'thanks', 'hatur nuhun', 'nuhun', 'thank you', 'tengkyu'])) return done({ intent: 'thanks', text: 'Sami-sami! Selamat menjelajah, ya.' })

  const whereish = has(t, WHERE)
  const facility = FACILITY.find((f) => has(t, f.words))
  const poi = mentionedPoi(t)

  if (has(t, ['air mancur', 'fountain', 'pertunjukan', 'show', 'dancing fountain', 'air menari'])) {
    if (!whereish || has(t, ['jam', 'kapan', 'mulai', 'jadwal', 'berapa'])) return done(showAnswer())
  }
  if (whereish && facility) return done(facilityAnswer(facility))
  const faqStrict = faqAnswer(t, true)
  if (faqStrict) return done(faqStrict)
  if (has(t, ['buka', 'tutup', 'jam buka', 'jam operasional', 'jam tutup', 'masih buka', 'operasional'])) return done(openAnswer(poi))
  if (poi && has(t, ['jauh', 'jarak', 'berapa lama', 'berapa menit', 'berapa meter', 'seberapa jauh'])) return done(distanceAnswer(poi))
  if (has(t, ['ada apa', 'di sini', 'disini', 'aku dimana', 'aku di mana', 'saya dimana', 'saya di mana', 'ini dimana', 'ini di mana', 'tempat apa', 'lagi dimana', 'lagi di mana']))
    return done(hereAnswer())
  if (has(t, ['rekomendasi', 'saran', 'enaknya', 'ngapain', 'bosan', 'bosen', 'apa yang seru', 'spot seru', 'kemana dulu', 'ke mana dulu', 'mau ke mana', 'mau kemana', 'sekarang ke mana', 'sekarang kemana']))
    return done(recommendAnswer())
  if (has(t, ['bintang', 'bintangku', 'level', 'levelku', 'xp', 'xpku', 'poin', 'poinku', 'stempel', 'stempelku', 'badge', 'progres', 'progress', 'skor', 'lencana'])) return done(progressAnswer())
  if (has(t, ['tantangan', 'misi', 'kuis', 'quiz', 'challenge', 'tantangan hari ini'])) return done(challengeAnswer())
  if (has(t, ['trail', 'wellness', 'rute jalan', 'rute olahraga'])) return done(trailAnswer())
  if (facility) return done(facilityAnswer(facility))
  if (poi) return done(poiAnswer(poi))
  const faqLoose = faqAnswer(t, false)
  if (faqLoose) return done(faqLoose)
  return done({
    intent: 'fallback',
    text: 'Hmm, aku belum tahu jawabannya. Pertanyaanmu kucatat tanpa identitas supaya tim SETARA bisa menambahkannya. Coba tanya jadwal air mancur, fasilitas terdekat, atau jam buka.',
  })
}

/** Apakah teks terlihat seperti pertanyaan (dipakai kotak Cari) */
export const looksLikeQuestion = (q) => /\?\s*$/.test(q) || has(norm(q), QUESTION)

export function greeting() {
  const slot = timeSlot()
  return { pagi: 'Wilujeng enjing!', siang: 'Wilujeng siang!', sore: 'Wilujeng sonten!', malam: 'Wilujeng wengi!' }[slot]
}

/** Saran pertanyaan sesuai konteks (waktu & posisi) */
export function suggestions() {
  const slot = timeSlot()
  const list = []
  if (currentPoi.value) list.push('Ada apa di sini?')
  if (slot === 'sore' || slot === 'malam') list.push('Air mancur mulai jam berapa?')
  list.push('Enaknya ke mana sekarang?', 'Toilet terdekat di mana?')
  if (daily.value && !daily.value.done) list.push('Tantangan hari ini apa?')
  list.push('Berapa harga tiket masuk?', 'Musala terdekat?', 'Sewa sepeda berapa?', 'Bintangku sudah berapa?')
  if (slot === 'pagi') list.unshift('Mau jogging, mulai dari mana?')
  return [...new Set(list)].slice(0, 5)
}

export const visitedToday = () => visits.session.visited.length
