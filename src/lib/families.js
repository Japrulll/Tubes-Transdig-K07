// "Family" POI: spot yang fungsinya sama dikelompokkan, sehingga pencarian "musala" juga
// menemukan Masjid Al-Maleeq, "makan" menemukan kedua food court, dst. Anggota family
// ditentukan dari jenis spot (`art`) atau kata kunci, jadi POI baru otomatis ikut.
import { norm } from './text'

export const FAMILIES = [
  {
    id: 'ibadah',
    equivalent: true,
    label: 'Tempat ibadah',
    terms: ['musala', 'mushola', 'mushala', 'musholla', 'surau', 'masjid', 'mesjid', 'salat', 'sholat', 'shalat', 'solat', 'wudu', 'wudhu', 'ibadah', 'jumatan', 'sembahyang'],
    match: (p) => p.art === 'musala' || has(p, ['musala', 'masjid']),
  },
  {
    id: 'toilet',
    equivalent: true,
    label: 'Toilet',
    terms: ['toilet', 'wc', 'kamar mandi', 'kamar kecil', 'buang air', 'pipis', 'kamar cai'],
    match: (p) => has(p, ['toilet', 'wc', 'kamar mandi']),
  },
  {
    id: 'kuliner',
    equivalent: true,
    label: 'Makan & minum',
    terms: ['makan', 'makanan', 'kuliner', 'jajan', 'jajanan', 'food court', 'foodcourt', 'resto', 'restoran', 'kafe', 'cafe', 'kopi', 'ngopi', 'minum', 'lapar', 'haus', 'steak', 'waffle'],
    match: (p) => p.category_id === 'kuliner' || p.art === 'food',
  },
  {
    id: 'gerbang',
    equivalent: true,
    label: 'Gerbang & pintu masuk',
    terms: ['gerbang', 'pintu', 'pintu masuk', 'pintu keluar', 'jalan masuk', 'jalan keluar'],
    match: (p) => p.art === 'gate' && !has(p, ['loket']),
  },
  {
    id: 'parkir',
    label: 'Parkir',
    // Bus/angkot/halte dijawab FAQ "angkutan" (halte ada di Gerbang Utara & Timur), bukan area parkir
    terms: ['parkir', 'parkiran', 'mobil', 'motor'],
    match: (p) => p.art === 'parking',
  },
  {
    id: 'sewa',
    label: 'Sewa skuter & sepeda',
    terms: ['skuter', 'scooter', 'sepeda', 'sepeda listrik', 'bersepeda', 'otoped', 'rental'],
    match: (p) => p.art === 'bike',
  },
  {
    id: 'olahraga',
    label: 'Olahraga',
    terms: ['olahraga', 'jogging', 'joging', 'lari', 'padel', 'senam', 'workout'],
    match: (p) => ['jogging', 'padel'].includes(p.art),
  },
  {
    id: 'santai',
    label: 'Santai & teduh',
    terms: ['santai', 'teduh', 'adem', 'istirahat', 'rehat', 'duduk', 'relaksasi', 'capek', 'lelah'],
    match: (p) => p.art === 'shade' || has(p, ['teduh', 'relaksasi']),
  },
  {
    id: 'foto',
    label: 'Spot foto & atraksi',
    terms: ['foto', 'spot foto', 'selfie', 'instagramable', 'atraksi', 'air mancur', 'pemandangan', 'danau'],
    match: (p) => p.art === 'photo' || p.art === 'fountain' || p.category_id === 'atraksi',
  },
]

function has(p, words) {
  const hay = norm([p.name, ...(p.keywords || [])].join(' '))
  return words.some((w) => new RegExp(`(^| )${norm(w)}( |$)`).test(hay))
}

/** Family yang disebut dalam teks (sudah dinormalisasi). Frasa terpanjang menang. */
export function familiesIn(text) {
  const t = ` ${norm(text)} `
  return FAMILIES.filter((f) => f.terms.some((w) => t.includes(` ${norm(w)} `)))
}

/** Family sebuah POI (bisa lebih dari satu, mis. Musala & Toilet → ibadah + toilet) */
export const familiesOf = (poi) => FAMILIES.filter((f) => f.match(poi))

/** Anggota family dari daftar POI */
export const membersOf = (family, pois) => pois.filter((p) => family.match(p))
