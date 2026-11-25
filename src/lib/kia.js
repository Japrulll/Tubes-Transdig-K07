// Tanya Kia — chatbot rule-based: maksud (intent) dikenali dari kata kunci, lalu dijawab dengan
// template yang diisi data langsung: jarak dari posisimu, buka/tutup sekarang, hitung mundur
// pertunjukan air mancur, rekomendasi sesuai waktu, dan progres bintang.
//
// Aturan dicek berurutan dari yang paling spesifik. Fasilitas memakai "family" POI
// (lib/families.js), jadi tidak ada ID POI yang ditulis mati untuk fasilitas.
import { content, getPoi } from '../stores/content'
import { location } from '../stores/location'
import { geofence, currentPoi, nearest } from '../stores/geofence'
import { visits, stampCount } from '../stores/visits'
import { play, level, daily, starsOf, totalStars, streak } from '../stores/play'
import { haversine, formatDistance, walkMinutes } from './geo'
import { openStatus, nextSchedule, countdownLabel, fmtTime, timeSlot, currentDate } from './time'
import { recommend } from './recommend'
import { norm } from './text'
import { FAMILIES, membersOf } from './families'

export { norm }

const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Kata/frasa utuh ada di teks (teks sudah dinormalisasi) */
const has = (t, words) => words.some((w) => new RegExp(`(^| )${esc(norm(w))}( |$)`).test(t))

const WHERE = ['dimana', 'di mana', 'mana', 'terdekat', 'dekat', 'arah', 'letak', 'kemana', 'ke mana', 'cari', 'mau ke', 'nyari', 'ada nggak', 'ada gak', 'ada tidak']
const QUESTION = ['apa', 'apakah', 'kapan', 'berapa', 'dimana', 'di mana', 'mana', 'gimana', 'bagaimana', 'bisa', 'boleh', 'ada', 'kenapa', 'mengapa', 'siapa', 'jam berapa', 'enaknya', 'kemana', 'ke mana']

// Kata yang menandakan acara/event: "tiket konser" bukan tiket masuk taman
const EVENT = ['konser', 'acara', 'event', 'festival', 'fest', 'pameran', 'bazar', 'bazaar', 'live music', 'musik', 'band', 'pentas', 'lomba', 'turnamen', 'nobar', 'car free day', 'cfd', 'expo', 'meet and greet', 'artis']
const PRICE = ['bayar', 'harga', 'biaya', 'tarif', 'gratis', 'mahal', 'murah', 'berapa duit', 'berapaan']
const TICKET = ['tiket', 'karcis', 'htm', 'harga masuk', 'bayar masuk', 'biaya masuk', 'masuk bayar', 'masuk gratis', 'gratis masuk', 'taman gratis']

// Teks tambahan per family saat menjawab "di mana ...?"
const FAMILY_EXTRA = {
  toilet: 'Toilet lain ada di sekitar area parkir sisi barat laut.',
  ibadah: null,
}

const contact = () => `Instagram ${content.park.instagram || '@kiaraarthapark'} atau telepon ${content.park.phone || '0822-1583-8889'}`

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
    for (const n of names) if (n && t.includes(n) && (!best || n.length + 10 > best.score)) best = { poi: p, score: n.length + 10 }
    for (const k of keys) if (has(t, [k]) && (!best || k.length > best.score)) best = { poi: p, score: k.length }
  }
  return best?.poi || null
}

const navAction = (p) => ({ kind: 'navigate', poi: p.id, label: `Arahkan ke ${p.short_name}` })
const detailAction = (p) => ({ kind: 'detail', poi: p.id, label: `Lihat ${p.short_name}` })

/** Urutkan POI dari yang terdekat (tanpa lokasi: urutan tampil) */
function byDistance(list) {
  const pois = list.filter(Boolean)
  if (!location.position) return pois
  return pois.map((p) => ({ p, d: haversine(location.position, p) })).sort((a, b) => a.d - b.d).map((x) => x.p)
}

/** Family fasilitas yang disebut dalam pertanyaan */
const familyIn = (t) => FAMILIES.find((f) => has(t, f.terms)) || null

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1)

// ---------------------------------------------------------------------------
// Jawaban per maksud (intent)
// ---------------------------------------------------------------------------
function familyAnswer(f, t = '') {
  let members = byDistance(membersOf(f, content.pois))
  // Family campuran (mis. Olahraga): spot yang kata kuncinya disebut ("jogging") didahulukan.
  // Family setara (ibadah, toilet, kuliner, gerbang): cukup yang terdekat.
  if (!f.equivalent && t) {
    const named = members.filter((p) => has(t, (p.keywords || []).filter((k) => norm(k).length >= 4)))
    if (named.length) members = [...named, ...members.filter((p) => !named.includes(p))]
  }
  if (!members.length) return { intent: `family:${f.id}`, text: `Aku belum punya data ${f.label.toLowerCase()} di taman ini. Tanyakan ke petugas di lokasi, ya.` }
  const [p, ...others] = members
  const dist = distanceText(p)
  const status = openStatus(p)
  let text =
    `${f.label} terdekat: ${p.name}, ${lower(p.location_label)}.` +
    (dist ? ` Sekitar ${dist.text}.` : ' Aktifkan lokasi supaya aku bisa hitung jaraknya.') +
    (!status.open ? ` Saat ini ${status.label.toLowerCase()}.` : '')
  if (others.length) text += ` Pilihan lain: ${others.map((o) => o.short_name).join(', ')}.`
  if (FAMILY_EXTRA[f.id]) text += ` ${FAMILY_EXTRA[f.id]}`
  const actions = [navAction(p), detailAction(p)]
  if (others[0]) actions.push(navAction(others[0]))
  return { intent: `family:${f.id}`, text, actions }
}

function showAnswer() {
  const p = getPoi('P03')
  if (!p) return { intent: 'show', text: 'Pertunjukan air mancur menari biasanya mulai pukul 18.30. Cek papan info di dekat danau, ya.' }
  const s = nextSchedule(p)
  let text
  if (s?.ongoing) text = `Air mancur menari sedang tampil sekarang! Sesi ini sampai pukul ${fmtTime(s.end)}.`
  else if (s) text = `Pertunjukan air mancur menari berikutnya pukul ${fmtTime(s.start)}, ${countdownLabel(s).toLowerCase()}. Datang 15 menit lebih awal supaya dapat posisi depan.`
  else {
    const first = (p.schedules || [])[0]
    text = `Pertunjukan hari ini sudah selesai. Biasanya mulai lagi pukul ${first ? fmtTime(first.start) : '18.30'} besok malam.`
  }
  const view = getPoi('P05')
  if (view) text += ` Sudut terbaik untuk menonton ada di ${view.short_name}, sisi selatan danau.`
  return { intent: 'show', text, actions: [navAction(p), view && navAction(view)].filter(Boolean) }
}

function eventAnswer(t) {
  const ticket = has(t, TICKET) || has(t, ['beli', 'pesan', 'booking', 'harga'])
  const text =
    (ticket
      ? 'Tiket konser atau acara khusus dijual oleh penyelenggaranya, bukan lewat SETARA, dan harganya beda dengan tiket masuk taman. '
      : 'SETARA belum punya jadwal konser atau acara khusus di Kiara Artha Park. ') +
    `Cek info acara terbaru di ${contact()}. Yang tampil rutin setiap malam adalah air mancur menari.`
  return { intent: 'event', text, actions: getPoi('P03') ? [detailAction(getPoi('P03'))] : [] }
}

function ticketAnswer(t) {
  const p = getPoi('P03')
  if (has(t, ['air mancur', 'pertunjukan', 'show', 'nonton'])) {
    return {
      intent: 'ticket:show',
      text: 'Menonton air mancur menari tidak perlu tiket terpisah; cukup tiket masuk taman. Paket Kiara Pelangi Food Court Rp35.000 juga disebut sudah termasuk akses menontonnya (Orami, 2024).',
      actions: p ? [detailAction(p)] : [],
    }
  }
  if (has(t, ['parkir', 'parkiran', 'mobil', 'motor'])) {
    return { intent: 'ticket:parkir', text: `Tarif parkir belum tercatat di SETARA. Tanyakan ke petugas parkir atau cek ${contact()}.`, actions: getPoi('P02') ? [detailAction(getPoi('P02'))] : [] }
  }
  return { intent: 'ticket', text: `Tiket masuk taman: ${content.park.ticket || 'Rp10.000 per orang (detikJabar, 2024)'}.`, actions: getPoi('P01') ? [detailAction(getPoi('P01'))] : [] }
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

function overviewAnswer() {
  const groups = FAMILIES.map((f) => ({ f, n: membersOf(f, content.pois).length })).filter((g) => g.n)
  return {
    intent: 'overview',
    text: `Ada ${content.pois.length} spot di Kiara Artha Park: ${groups.map((g) => `${g.f.label.toLowerCase()} (${g.n})`).join(', ')}. Mau kuarahkan ke salah satunya?`,
    actions: [{ kind: 'route', to: '/search', label: 'Lihat semua spot' }],
  }
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
  return { intent: 'trail', text: `Ada ${content.trails.length} Wellness Trail: ${list}. Aku memandu setiap checkpoint dengan suara.`, actions: [{ kind: 'route', to: '/trail', label: 'Mulai Wellness Trail' }] }
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

// Topik yang dikenali tapi datanya belum ada: jawab jujur dan arahkan ke pengelola
const HONEST = [
  { id: 'darurat', words: ['darurat', 'kecelakaan', 'pingsan', 'luka', 'p3k', 'pertolongan pertama', 'sakit', 'ambulans', 'ambulance', 'anak hilang', 'tersesat', 'polisi', 'kebakaran'], text: () => `Kalau darurat, segera hubungi 112 (gratis). Minta bantuan petugas atau satpam taman terdekat, dan hubungi pengelola: ${contact()}.` },
  { id: 'hilang', words: ['barang hilang', 'kehilangan', 'dompet hilang', 'hp hilang', 'ketinggalan', 'lost and found'], text: () => `Untuk barang hilang atau ketinggalan, lapor ke petugas taman atau hubungi pengelola: ${contact()}.` },
  { id: 'hujan', words: ['hujan', 'gerimis', 'berteduh', 'payung', 'cuaca', 'panas banget', 'terik'], text: () => { const f = FAMILIES.find((x) => x.id === 'kuliner'); const p = byDistance(membersOf(f, content.pois))[0]; return `Taman ini sebagian besar terbuka. Saat hujan atau terik, berteduh di ${p ? p.short_name : 'area kuliner'} atau di bawah pepohonan Zona Teduh, lalu lanjut menjelajah setelah reda.` } },
  { id: 'hewan', words: ['anjing', 'kucing', 'hewan peliharaan', 'peliharaan', 'pet'], text: () => `Aku belum punya info resmi soal hewan peliharaan. Tanyakan ke petugas di gerbang atau ${contact()}.` },
  { id: 'rokok', words: ['rokok', 'merokok', 'vape', 'smoking'], text: () => `Aku belum punya info area merokok. Demi kenyamanan bersama, tanyakan ke petugas dan hindari merokok di dekat anak-anak, ya.` },
  { id: 'wifi', words: ['wifi', 'wi fi', 'internet', 'sinyal', 'colokan', 'charger', 'cas hp', 'ngecas', 'powerbank'], text: () => `Aku belum punya data wifi atau tempat mengisi daya. Coba tanyakan di kafe sekitar Food Court atau Kafe & Padel.` },
  { id: 'atm', words: ['atm', 'tarik tunai', 'uang tunai', 'qris', 'bayar pakai'], text: () => `Aku belum punya data ATM. Metode bayar tiap tenant berbeda; siapkan uang tunai kecil dan tanyakan di kasir, ya.` },
  { id: 'difabel', words: ['kursi roda', 'difabel', 'disabilitas', 'lansia', 'stroller', 'kereta bayi'], text: () => `Jalur lingkar Jl. Kiara Artha di sekeliling danau relatif datar. Info aksesibilitas lain belum tercatat; tanyakan ke petugas di gerbang, ya.` },
  { id: 'piknik', words: ['piknik', 'gelar tikar', 'bawa makanan', 'bawa bekal', 'bekal'], text: () => `Aku belum punya aturan resmi soal piknik atau membawa bekal. Tanyakan ke petugas di gerbang, dan bawa pulang sampahmu, ya.` },
  { id: 'sewa_tempat', words: ['sewa tempat', 'prewedding', 'foto prewed', 'syuting', 'izin foto', 'reservasi tempat', 'acara kantor', 'gathering'], text: () => `Untuk sewa tempat, foto prewedding, atau acara rombongan, hubungi pengelola langsung: ${contact()}.` },
]

function faqAnswer(t, strict) {
  for (const f of content.faq || []) {
    // Pencocokan longgar hanya untuk pola yang cukup panjang ("ig" jangan cocok dengan "digital")
    const hit = f.patterns.some((pt) => (strict ? has(t, [pt]) : norm(pt).length >= 4 && t.includes(norm(pt))))
    if (hit) {
      const p = f.poi_id ? getPoi(f.poi_id) : null
      return { intent: `faq:${f.id}`, text: f.answer, actions: p ? [detailAction(p)] : [] }
    }
  }
  return null
}

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

  // 1. Darurat selalu didahulukan
  const urgent = HONEST.find((h) => h.id === 'darurat' && has(t, h.words))
  if (urgent) return done({ intent: 'honest:darurat', text: urgent.text() })

  const whereish = has(t, WHERE)
  const family = familyIn(t)
  const poi = mentionedPoi(t)

  // 2. Acara/konser sebelum tiket: "tiket konser" ≠ tiket masuk taman
  if (has(t, EVENT)) return done(eventAnswer(t))
  // Biaya: tiket masuk, nonton air mancur, parkir ("parkir bayar berapa", "nonton air mancur bayar?")
  const pricey = has(t, PRICE) && has(t, ['masuk', 'air mancur', 'pertunjukan', 'nonton', 'parkir', 'parkiran', 'taman'])
  if (has(t, TICKET) || pricey) return done(ticketAnswer(t))
  if (has(t, ['air mancur', 'fountain', 'pertunjukan', 'show', 'dancing fountain', 'air menari'])) {
    if (!whereish || has(t, ['jam', 'kapan', 'mulai', 'jadwal', 'berapa'])) return done(showAnswer())
  }

  // 3. Fasilitas: "toilet di mana", "musala terdekat"
  if (whereish && family) return done(familyAnswer(family, t))
  const faqStrict = faqAnswer(t, true)
  if (faqStrict) return done(faqStrict)
  if (has(t, ['buka', 'tutup', 'jam buka', 'jam operasional', 'jam tutup', 'masih buka', 'operasional'])) return done(openAnswer(poi))
  if (poi && has(t, ['jauh', 'jarak', 'berapa lama', 'berapa menit', 'berapa meter', 'seberapa jauh'])) return done(distanceAnswer(poi))
  if (has(t, ['ada apa saja', 'apa saja', 'berapa spot', 'daftar spot', 'semua spot', 'fasilitas apa'])) return done(overviewAnswer())
  if (has(t, ['ada apa', 'di sini', 'disini', 'aku dimana', 'aku di mana', 'saya dimana', 'saya di mana', 'ini dimana', 'ini di mana', 'tempat apa', 'lagi dimana', 'lagi di mana']))
    return done(hereAnswer())
  if (has(t, ['rekomendasi', 'saran', 'enaknya', 'ngapain', 'bosan', 'bosen', 'apa yang seru', 'spot seru', 'kemana dulu', 'ke mana dulu', 'mau ke mana', 'mau kemana', 'sekarang ke mana', 'sekarang kemana']))
    return done(recommendAnswer())
  if (has(t, ['bintang', 'bintangku', 'level', 'levelku', 'xp', 'xpku', 'poin', 'poinku', 'stempel', 'stempelku', 'badge', 'progres', 'progress', 'skor', 'lencana'])) return done(progressAnswer())
  if (has(t, ['tantangan', 'misi', 'kuis', 'quiz', 'challenge', 'tantangan hari ini'])) return done(challengeAnswer())
  if (has(t, ['trail', 'wellness', 'rute jalan', 'rute olahraga'])) return done(trailAnswer())

  // 4. Topik yang dikenali tapi datanya belum ada
  const honest = HONEST.find((h) => has(t, h.words))
  if (honest) return done({ intent: `honest:${honest.id}`, text: honest.text() })

  if (poi) return done(poiAnswer(poi))
  if (family) return done(familyAnswer(family, t))
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
