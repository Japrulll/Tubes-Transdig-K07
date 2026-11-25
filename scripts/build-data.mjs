// Satu sumber data SETARA.
// Menghasilkan:
//   - src/data/poi.json        → dataset bawaan aplikasi (mode offline, A02)
//   - supabase/seed.sql        → data yang sama untuk database Supabase
// Jalankan: node scripts/build-data.mjs
//
// Koordinat diambil dari Google Maps (diakses 16 Nov 2026). Kolom `source`
// mencatat nama tempat di Google Maps yang dipakai sebagai acuan tiap POI.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NARASI, KUIS, MISI, COACHING, KUIS_TRAIL, FAQ, TANTANGAN, BADGE_INTERAKSI } from './data-interaksi.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Acak urutan opsi kuis secara deterministik (opsi pertama di sumber = jawaban benar)
function shuffleQuiz(list, seed) {
  let s = seed
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  return list.map((item) => {
    const order = item.options.map((_, i) => i).sort(() => rnd() - 0.5)
    return { q: item.q, options: order.map((i) => item.options[i]), answer: order.indexOf(0), explain: item.explain }
  })
}

// ---------------------------------------------------------------------------
// Geometri
// ---------------------------------------------------------------------------
const M_PER_DEG_LAT = 110574
const mPerDegLng = (lat) => 111320 * Math.cos((lat * Math.PI) / 180)
const round6 = (n) => Math.round(n * 1e6) / 1e6

function haversine(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
const pathLength = (pts) => pts.slice(1).reduce((s, p, i) => s + haversine(pts[i], p), 0)

// Lingkar Jl. Kiara Artha (elips, diukur dari peta Google Maps zoom 18)
const RING = { center: [-6.916118, 107.642258], a: 112, b: 128, rotationDeg: 8 }

function ringPoint(angleDeg) {
  const t = (angleDeg * Math.PI) / 180
  const th = (RING.rotationDeg * Math.PI) / 180
  const e = RING.a * Math.cos(t)
  const n = RING.b * Math.sin(t)
  const e2 = e * Math.cos(th) + n * Math.sin(th)
  const n2 = -e * Math.sin(th) + n * Math.cos(th)
  const lat = RING.center[0] + n2 / M_PER_DEG_LAT
  const lng = RING.center[1] + e2 / mPerDegLng(lat)
  return [round6(lat), round6(lng)]
}

// Catmull-Rom tertutup agar jalur trail terlihat halus
function smoothLoop(points, samples = 8) {
  const out = []
  const n = points.length
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    const p3 = points[(i + 2) % n]
    for (let s = 0; s < samples; s++) {
      const t = s / samples
      const t2 = t * t
      const t3 = t2 * t
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push([round6(f(p0[0], p1[0], p2[0], p3[0])), round6(f(p0[1], p1[1], p2[1], p3[1]))])
    }
  }
  out.push(out[0])
  return out
}

// ---------------------------------------------------------------------------
// Data taman
// ---------------------------------------------------------------------------
const park = {
  name: 'Kiara Artha Park',
  city: 'Bandung',
  address: 'Jl. Banten, Kebonwaru, Kec. Batununggal, Kota Bandung, Jawa Barat',
  center: [-6.9164043, 107.642318],
  zoom: 18,
  bounds: [
    [-6.9185, 107.6392],
    [-6.9135, 107.6450],
  ],
  opening_hours: { open: '07:00', close: '21:00' },
  ticket: 'Rp10.000 per orang, usia 6 tahun ke atas (papan di loket tiket)',
  phone: '0822-1583-8889',
  instagram: '@kiaraarthapark',
  inaugurated: '2019-08-17',
  area_ha: 13,
  lake: { center: [-6.9160874, 107.6422657], radius_m: 30 },
  ring: Array.from({ length: 73 }, (_, i) => ringPoint(i * 5)),
  sources: [
    { label: 'Google Maps — Kiara Artha Park & tempat di sekitarnya', url: 'https://maps.google.com/?q=-6.9164043,107.642318', accessed: '2026-11-16' },
    { label: 'detikJabar — Kiara Artha Park, Spot Rekreasi di Tengah Kota Bandung', url: 'https://www.detik.com/jabar/wisata/d-7229191/kiara-artha-park-spot-rekreasi-di-tengah-kota-bandung' },
    { label: 'Orami — Kiara Artha Park (30 Sep 2024)', url: 'https://www.orami.co.id/magazine/kiara-artha-park' },
    { label: 'Republika — Ayo Intip Keseruan di Kiara Artha Park (24 Agu 2019)', url: 'https://news.republika.co.id/berita/pwoiiv0/ayo-intip-keseruan-di-kiara-artha-park-bandung' },
  ],
}

const categories = [
  { id: 'atraksi', label: 'Atraksi', color: '#ee7b5b', icon: 'sparkle', sort_order: 1 },
  { id: 'wellness', label: 'Wellness', color: '#3f9e8e', icon: 'pulse', sort_order: 2 },
  { id: 'kuliner', label: 'Kuliner', color: '#e09a2d', icon: 'cup', sort_order: 3 },
  { id: 'keluarga', label: 'Keluarga', color: '#d4709c', icon: 'balloon', sort_order: 4 },
  { id: 'fasilitas', label: 'Fasilitas', color: '#4a93c4', icon: 'facility', sort_order: 5 },
  { id: 'akses', label: 'Akses', color: '#5d7d77', icon: 'gate', sort_order: 6 },
]

const DAILY = [0, 1, 2, 3, 4, 5, 6]
const WEEKDAY = [1, 2, 3, 4, 5]
const WEEKEND = [0, 6]
const PARK_HOURS = [{ days: DAILY, open: '07:00', close: '21:00' }]

// Urutan array = nomor spot di peta, stempel, dan seluruh aplikasi (ID tetap dipakai untuk QR & progres)
const pois = [
  // --- Gerbang barat & loket ---
  {
    id: 'P01',
    name: 'Pintu Utama',
    short_name: 'Pintu Utama',
    category_id: 'akses',
    location_label: 'Gerbang barat, sisi Jl. Banten',
    source: 'Google Maps: "Gerbang Barat Taman Kiara Artha"',
    lat: -6.9161917,
    lng: 107.6407033,
    radius_m: 25,
    art: 'gate',
    summary: 'Gerbang utama di sisi Jl. Banten, titik awal menjelajah taman.',
    description:
      'Pintu masuk utama Kiara Artha Park berada di sisi barat, menghadap Jl. Banten. Dari sini jalur pejalan kaki mengarah ke lingkar Jl. Kiara Artha yang mengelilingi danau dan air mancur menari di tengah taman. Zona taman tersusun melingkar: area kuliner dan kafe di sisi selatan, danau dan air mancur di tengah, Food Court 2 dan gerbang timur di sisi timur, serta jalur jogging, musala, dan gerbang utara di sisi utara. Masjid Al-Maleeq berada tidak jauh di utara gerbang ini.',
    trivia: [
      'Kiara Artha Park diresmikan pada 17 Agustus 2019, bertepatan dengan HUT ke-74 Republik Indonesia.',
      'Taman ini terletak di antara flyover Antapani dan flyover Kiaracondong, di Kelurahan Kebonwaru, Kecamatan Batununggal.',
    ],
    activities: ['Peta ringkas zona taman', 'Titik kumpul rombongan', 'Akses ke area parkir, Rest Area 78, dan Masjid Al-Maleeq'],
    tips: [
      'Foto papan peta di gerbang sebagai cadangan bila baterai menipis.',
      'Sore hari (15.00–18.00) cocok untuk jalan santai sebelum pertunjukan air mancur.',
    ],
    trigger_response: 'Audio sambutan, ringkasan zona taman, dan rekomendasi rute sesuai jam kunjungan.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'siang', 'sore', 'malam'],
    keywords: ['gerbang', 'pintu', 'masuk', 'jl banten', 'peta', 'tiket', 'gerbang barat', 'pintu masuk'],
    status_note: null,
  },
  {
    id: 'P18',
    name: 'Loket Tiket Masuk',
    short_name: 'Loket Tiket Masuk',
    category_id: 'akses',
    location_label: 'Di bawah tenda dekat papan Kiara Artha Park, area dalam sisi barat',
    source: 'Google Maps: plus code 3JMR+HMC (diakses 25 Nov 2026); OpenStreetMap: Kiara Artha Park sign',
    lat: -6.9160625,
    lng: 107.6416406,
    radius_m: 20,
    art: 'gate',
    summary: 'Loket pembelian tiket masuk taman, Rp10.000 per orang.',
    description:
      'Loket tiket berupa booth merah di bawah tenda putih, dekat papan nama Kiara Artha Park. Papan di sebelahnya mencantumkan harga tiket masuk Rp10.000 per orang untuk usia 6 tahun ke atas. Dari sini jalur pejalan kaki mengarah ke danau, Taman Asia Afrika, dan Papa Skuter.',
    trivia: [
      'Papan harga di samping loket mencantumkan tiket Rp10.000 per orang untuk usia 6 tahun ke atas.',
      'Papan nama Kiara Artha Park yang sering jadi latar foto berada tepat di dekat loket ini.',
    ],
    activities: ['Beli tiket masuk', 'Foto di papan Kiara Artha Park', 'Tanya info ke petugas'],
    tips: ['Siapkan uang pas atau tanyakan metode bayar di loket.', 'Anak di bawah 6 tahun tidak tercantum di papan harga; tanyakan ke petugas.'],
    trigger_response: 'Info harga tiket masuk dan arah ke atraksi utama.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'siang', 'sore', 'malam'],
    keywords: ['loket', 'loket tiket', 'tiket masuk', 'karcis', 'booth', 'papan kiara artha'],
    status_note: 'Harga dari papan di lokasi (foto tim, 25 Nov 2026); cek lagi di loket bila berubah.',
  },
  {
    id: 'P07',
    name: 'Papa Skuter',
    short_name: 'Papa Skuter',
    category_id: 'keluarga',
    location_label: 'Area dalam, sebelah Solaria dan Taman Asia Afrika',
    source: 'Google Maps: "Papa Skuter" (plus code 3JMR+FM, diakses 25 Nov 2026); OpenStreetMap: Papa Skuter (bicycle_rental)',
    lat: -6.9163125,
    lng: 107.6416875,
    radius_m: 20,
    art: 'bike',
    summary: 'Sewa skuter dan sepeda listrik untuk berkeliling taman.',
    description:
      'Papa Skuter menyewakan skuter dan sepeda listrik di area dalam taman, bersebelahan dengan Solaria dan Taman Asia Afrika. Pilihannya beragam, dari skuter roda dua sampai roda tiga, sehingga cocok untuk berkeliling lingkar taman bersama keluarga.',
    trivia: [
      'Alamat Papa Skuter tercatat di Google Maps: Taman Air Mancur Kiara Artha Park, sebelah Solaria, Taman Asia Afrika, area dalam.',
      'Persewaan sepeda dan skuter listrik di dalam taman bertarif sekitar Rp30.000 pada hari kerja dan Rp40.000 pada akhir pekan (detikJabar, 2024).',
    ],
    activities: ['Sewa skuter listrik', 'Sewa sepeda listrik', 'Berkeliling lingkar taman'],
    tips: ['Tanyakan tarif dan durasi sewa di kasir sebelum berangkat.', 'Gunakan jalur lingkar dan utamakan pejalan kaki.'],
    trigger_response: 'Info sewa skuter/sepeda listrik dan rute berkeliling taman.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'sore', 'malam'],
    keywords: ['skuter', 'scooter', 'sepeda listrik', 'sepeda', 'sewa', 'rental', 'papa skuter', 'otoped', 'rental skuter'],
    status_note: 'Jam sewa dan tarif terbaru perlu dikonfirmasi ke Papa Skuter saat survei.',
  },
  // --- Sisi selatan danau ---
  {
    id: 'P05',
    name: 'Taman Asia Afrika',
    short_name: 'Taman Asia Afrika',
    category_id: 'atraksi',
    location_label: 'Sisi selatan danau',
    source: 'Google Maps: "Taman Asia Afrika - Kiara Artha Park"',
    lat: -6.9166173,
    lng: 107.6421607,
    radius_m: 25,
    art: 'photo',
    summary: 'Spot foto utama dengan latar danau dan air mancur.',
    description:
      'Taman Asia Afrika di sisi selatan danau adalah spot foto paling ikonik di Kiara Artha Park, dengan latar danau dan air mancur menari. Namanya menggemakan Konferensi Asia Afrika 1955 yang membuat Bandung dikenal dunia.',
    trivia: [
      'Konferensi Asia Afrika digelar di Gedung Merdeka, Bandung, pada 18–24 April 1955 dan dihadiri 29 negara.',
      'Dari titik ini air mancur menari terlihat utuh, sudut favorit untuk foto malam.',
    ],
    activities: ['Foto dengan latar danau dan air mancur', 'Foto rombongan'],
    tips: [
      'Sudut terbaik: menghadap utara ke arah air mancur.',
      'Foto malam: aktifkan mode malam dan tunggu pertunjukan air mancur dimulai.',
    ],
    trigger_response: 'Cerita singkat spot serta tips waktu dan sudut foto terbaik.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'sore', 'malam'],
    keywords: ['foto', 'ikonik', 'asia afrika', 'spot foto', 'instagram', 'selfie', 'spot foto ikonik'],
    status_note: null,
  },
  {
    id: 'P08',
    name: 'Food Court 1',
    short_name: 'Food Court 1',
    category_id: 'kuliner',
    location_label: 'Kawasan Kiara Pelangi, sisi selatan taman',
    source: 'Google Maps: "Pelangi Graha Park"',
    lat: -6.9170555,
    lng: 107.641775,
    radius_m: 30,
    art: 'food',
    summary: 'Kiara Pelangi Food Court dan deretan kafe di sisi selatan.',
    description:
      'Kawasan kuliner di sisi selatan taman dengan beragam tenant makanan dan minuman. Kiara Pelangi Food Court menjadi pusatnya, berdekatan dengan kafe seperti Ludo Sports Kitchen and Coffee dan Monday Co. Pilihan tepat untuk makan bersama sebelum menonton air mancur menari.',
    trivia: [
      'Paket Kiara Pelangi Food Court seharga Rp35.000 disebut sudah termasuk akses menonton air mancur menari (Orami, 2024).',
      'Ludo Sports Kitchen and Coffee di dekat area ini memiliki lebih dari seribu ulasan di Google Maps dengan rating 4,8.',
    ],
    activities: ['Makan dan minum di food court', 'Nongkrong di kafe sekitar', 'Membeli paket makan + akses air mancur'],
    tips: ['Jam makan malam akhir pekan ramai; pesan lebih awal sebelum pertunjukan air mancur.', 'Jam buka tenant bervariasi.'],
    trigger_response: 'Info tenant dan jam buka; jika belum buka, tampilkan jam buka dan alternatif terdekat.',
    hours: [{ days: DAILY, open: '10:00', close: '21:00' }],
    best_times: ['siang', 'sore', 'malam'],
    keywords: ['makan', 'kuliner', 'food court', 'kiara pelangi', 'restoran', 'minum', 'jajan', 'area kuliner'],
    status_note: 'Jam buka tenant bervariasi; konfirmasi saat survei.',
  },
  {
    id: 'P03',
    name: 'Danau & Air Mancur',
    short_name: 'Danau & Air Mancur',
    category_id: 'atraksi',
    location_label: 'Danau buatan di area tengah taman',
    source: 'Google Maps: "Dancing Fountain"',
    lat: -6.9160874,
    lng: 107.6422657,
    radius_m: 40,
    art: 'fountain',
    summary: 'Ikon taman: danau dengan pertunjukan air mancur menari di malam hari.',
    description:
      'Danau di jantung taman ini adalah ikon Kiara Artha Park. Pada malam hari, air mancur menari tampil dengan permainan cahaya dan musik. Siang hingga sore, tepian danau menjadi tempat favorit untuk duduk santai, menikmati angin, dan memandangi patung Friendship Shake Hand di tepi utara.',
    trivia: [
      'Pertunjukan air mancur menari umumnya digelar mulai pukul 18.30 hingga 20.30, dengan pertunjukan berbeda setiap jamnya (Orami, 2024).',
      'Patung Friendship Shake Hand di tepi utara danau menggambarkan jabat tangan persahabatan, sejalan dengan semangat Asia Afrika kota Bandung.',
    ],
    activities: ['Menonton pertunjukan air mancur menari (malam)', 'Duduk santai di tepi danau', 'Foto dengan latar air mancur'],
    tips: [
      'Datang 15 menit sebelum pertunjukan untuk mendapat posisi depan.',
      'Akses menonton disebut termasuk dalam paket Kiara Pelangi Food Court Rp35.000 (Orami, 2024); konfirmasi di lokasi.',
    ],
    trigger_response: 'Kartu informasi dan narasi; sore/malam menampilkan hitung mundur pertunjukan air mancur.',
    hours: PARK_HOURS,
    schedules: [
      { title: 'Pertunjukan Air Mancur Menari', days: DAILY, start: '18:30', end: '18:50' },
      { title: 'Pertunjukan Air Mancur Menari', days: DAILY, start: '19:30', end: '19:50' },
      { title: 'Pertunjukan Air Mancur Menari', days: DAILY, start: '20:30', end: '20:50' },
    ],
    best_times: ['sore', 'malam'],
    keywords: ['danau', 'air mancur', 'fountain', 'pertunjukan', 'malam', 'lampu', 'show', 'air mancur menari'],
    status_note: 'Jadwal pertunjukan dapat berubah; cek Instagram @kiaraarthapark.',
  },
  // --- Sisi timur ---
  {
    id: 'P15',
    name: 'Food Court 2',
    short_name: 'Food Court 2',
    category_id: 'kuliner',
    location_label: 'Bangunan sisi timur, antara lingkar taman dan Jl. Ibrahim Adjie',
    source: 'OpenStreetMap: Steak Ranjang, Siloka, Pang Waffle, RD Coffee & Eatery (Jl. H. Ibrahim Adjie)',
    lat: -6.91649,
    lng: 107.64351,
    radius_m: 30,
    art: 'food',
    summary: 'Food court kedua: Steak Ranjang, Siloka, Pang Waffle, dan RD Coffee & Eatery.',
    description:
      'Food court kedua berada di bangunan memanjang sisi timur taman, di antara lingkar Jl. Kiara Artha dan Jl. Ibrahim Adjie. Deretan tenannya dari utara ke selatan antara lain Steak Ranjang, Siloka, Pang Waffle, dan RD Coffee & Eatery: pilihan steak, jajanan manis, sampai kopi. Cocok untuk makan setelah jogging atau sambil menunggu air mancur menari di malam hari.',
    trivia: [
      'Urutan tenan dari utara ke selatan: Steak Ranjang, Siloka, Pang Waffle, lalu RD Coffee & Eatery (OpenStreetMap, 2026).',
      'Dari sini danau dan air mancur menari hanya sekitar 140 meter ke arah barat.',
    ],
    activities: ['Makan steak, waffle, atau jajanan', 'Ngopi di kafe', 'Istirahat setelah jogging'],
    tips: ['Jam buka tiap tenan berbeda; cek papan di depan tenan.', 'Akhir pekan malam ramai; datang sebelum pukul 18.00 bila ingin menonton air mancur setelah makan.'],
    trigger_response: 'Info tenan, jam buka, dan arah ke danau setelah makan.',
    hours: [{ days: DAILY, open: '10:00', close: '22:00' }],
    best_times: ['siang', 'sore', 'malam'],
    keywords: ['makan', 'kuliner', 'food court', 'food court 2', 'steak', 'steak ranjang', 'siloka', 'waffle', 'pang waffle', 'rd coffee', 'kopi', 'kafe', 'jajan'],
    status_note: 'Jam buka tenan bervariasi; konfirmasi saat survei.',
  },
  {
    id: 'P14',
    name: 'Gerbang Timur',
    short_name: 'Gerbang Timur',
    category_id: 'akses',
    location_label: 'Sisi Jl. H. Ibrahim Adjie (Kiaracondong)',
    source: 'OpenStreetMap: halte "Gerbang Timur Kiara Artha Park", Jl. H. Ibrahim Adjie',
    lat: -6.91615,
    lng: 107.6437,
    radius_m: 25,
    art: 'gate',
    summary: 'Pintu masuk dari Jl. Ibrahim Adjie, tepat di samping Food Court 2.',
    description:
      'Gerbang timur berada di sisi Jl. H. Ibrahim Adjie (Kiaracondong), terhubung ke lingkar taman lewat dua ruas Jl. Kiara Artha. Tepat di sebelah selatannya ada Food Court 2 dengan deretan kafe dan resto, sementara Zona Teduh dan danau berada sekitar 60–150 meter ke arah barat.',
    trivia: [
      'Halte bus di depan gerbang ini bernama "Gerbang Timur Kiara Artha Park" dan berada di jalur Jl. Ibrahim Adjie yang ramai.',
      'Kiara Artha Park terletak di antara flyover Antapani dan flyover Kiaracondong; gerbang timur adalah sisi yang menghadap Kiaracondong.',
    ],
    activities: ['Masuk dari arah Jl. Ibrahim Adjie', 'Turun dari bus di halte Gerbang Timur', 'Akses cepat ke Food Court 2'],
    tips: ['Jl. Ibrahim Adjie padat pada jam sibuk; menyeberanglah di titik penyeberangan.', 'Belok kiri (selatan) untuk Food Court 2, lurus ke barat untuk danau.'],
    trigger_response: 'Sambutan, arah ke danau, dan info Food Court 2 di sebelahnya.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'siang', 'sore', 'malam'],
    keywords: ['gerbang', 'gerbang timur', 'pintu', 'masuk', 'ibrahim adjie', 'kiaracondong', 'halte', 'bus'],
    status_note: 'Titik gerbang ditentukan dari peta; validasi saat survei lapangan.',
  },
  {
    id: 'P11',
    name: 'Zona Relaksasi',
    short_name: 'Zona Relaksasi',
    category_id: 'wellness',
    location_label: 'Kanopi pepohonan di sisi timur danau',
    source: 'Google Maps (citra satelit): titik di bawah kanopi pohon, timur danau',
    lat: -6.91593,
    lng: 107.643112,
    radius_m: 20,
    art: 'shade',
    summary: 'Area duduk teduh untuk relaksasi napas dan peregangan ringan.',
    description:
      'Area teduh di bawah kanopi pepohonan rindang di sisi timur danau. Tempat ideal untuk berhenti sejenak, mengatur napas, dan melakukan peregangan ringan, sekaligus menjadi checkpoint Wellness Trail.',
    trivia: [
      'Kanopi pohon dapat membuat udara di bawahnya terasa lebih sejuk dibanding area terbuka di siang hari.',
      'Menghembuskan napas lebih panjang daripada menarik napas membantu menenangkan detak jantung setelah berjalan.',
    ],
    activities: ['Audio relaksasi 1–2 menit', 'Peregangan ringan', 'Checkpoint Wellness Trail'],
    tips: ['Lepaskan earphone sejenak dan dengarkan suara di sekitar Anda.', 'Minum air setelah berjalan atau berlari.'],
    trigger_response: 'Tawaran audio relaksasi 1–2 menit; menjadi checkpoint Wellness Trail.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'siang', 'sore'],
    keywords: ['teduh', 'relaksasi', 'istirahat', 'napas', 'peregangan', 'pohon', 'duduk', 'spot teduh', 'zona teduh'],
    status_note: 'Titik ditentukan dari citra satelit Google Maps; validasi saat survei lapangan.',
  },
  // --- Sisi utara ---
  {
    id: 'P09',
    name: 'Kafe & Padel',
    short_name: 'Kafe & Padel',
    category_id: 'kuliner',
    secondary_category_id: 'wellness',
    location_label: 'Kawasan kafe dan lapangan padel, sisi utara',
    source: 'Google Maps: "Padel Co. Semi Outdoor"',
    lat: -6.9149564,
    lng: 107.6422184,
    radius_m: 30,
    art: 'padel',
    summary: 'Kafe dan lapangan padel semi-outdoor di sisi utara taman.',
    description:
      'Kawasan kafe dan lapangan padel di sisi utara taman. Padel, olahraga raket perpaduan tenis dan squash, sedang populer di Bandung, dan Padel Co. menyediakan lapangan semi-outdoor di sini. Kafe di sekitarnya cocok untuk beristirahat setelah berolahraga.',
    trivia: [
      'Padel lahir di Acapulco, Meksiko, pada 1969 dan dimainkan berpasangan di lapangan berdinding kaca.',
      'Dalam padel, bola boleh memantul ke dinding sebelum dipukul kembali, berbeda dengan tenis.',
    ],
    activities: ['Menonton atau bermain padel', 'Bersantai di kafe', 'Istirahat setelah jogging'],
    tips: ['Pemesanan lapangan dilakukan langsung ke pengelola; SETARA tidak menyediakan reservasi.', 'Gunakan sepatu bersol rata untuk bermain padel.'],
    trigger_response: 'Info kafe, lapangan padel, jam operasional, dan aktivitas yang tersedia.',
    hours: [{ days: DAILY, open: '07:00', close: '22:00' }],
    best_times: ['pagi', 'sore', 'malam'],
    keywords: ['padel', 'kafe', 'cafe', 'kopi', 'olahraga', 'raket', 'nongkrong', 'lapangan padel'],
    status_note: 'Jam operasional perlu dikonfirmasi ke pengelola saat survei.',
  },
  {
    id: 'P10',
    name: 'Musala & Toilet',
    short_name: 'Musala & Toilet',
    category_id: 'fasilitas',
    location_label: 'Fasilitas umum utama, sisi utara taman',
    source: 'Google Maps: "Mushalla Kiara Artha Park"',
    lat: -6.9151658,
    lng: 107.6421597,
    radius_m: 20,
    art: 'musala',
    summary: 'Musala, tempat wudu, dan toilet umum di sisi utara taman.',
    description:
      'Fasilitas umum utama di sisi utara taman: musala, tempat wudu, dan toilet. Lokasinya dekat titik start jogging track, sehingga mudah dijangkau sebelum atau sesudah berolahraga.',
    trivia: [
      'Musala ini tercatat di Google Maps sebagai "Mushalla Kiara Artha Park".',
      'Toilet umum lain juga tersedia di sekitar area parkir sisi barat laut taman.',
    ],
    activities: ['Salat', 'Wudu', 'Toilet umum'],
    tips: ['Menjelang magrib musala biasanya ramai; datang beberapa menit lebih awal.', 'Jaga kebersihan dan simpan alas kaki di rak yang tersedia.'],
    trigger_response: 'Info fasilitas dan arah; tampil sebagai hasil cepat pada filter Fasilitas.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'siang', 'sore', 'malam'],
    keywords: ['musala', 'mushola', 'salat', 'sholat', 'toilet', 'wc', 'kamar mandi', 'wudu'],
    status_note: null,
  },
  {
    id: 'P06',
    name: 'Start Jogging Track',
    short_name: 'Start Jogging Track',
    category_id: 'wellness',
    location_label: 'Awal jalur jogging, sisi utara taman',
    source: 'Google Maps: "Jogging Track Kiara Artha Park"',
    lat: -6.9152676,
    lng: 107.6417524,
    radius_m: 25,
    art: 'jogging',
    summary: 'Awal jalur jogging lingkar taman; mulai Wellness Trail dari sini.',
    description:
      'Titik awal jalur jogging berada di sisi utara taman. Jalur ini mengikuti lingkar Jl. Kiara Artha yang mengelilingi danau, sekitar 750 meter per putaran, cocok untuk jalan cepat, jogging, maupun bersepeda santai.',
    trivia: [
      'Area jogging dan bersepeda di Kiara Artha Park disebut mencapai sekitar 2,6 hektare (Orami, 2024).',
      'Kiara Artha Park pernah menjadi tuan rumah acara lari Pocari Run 2025.',
    ],
    activities: ['Memulai Wellness Trail', 'Jogging lingkar taman (±750 m per putaran)', 'Pemanasan sebelum berlari'],
    tips: ['Lakukan pemanasan 3–5 menit sebelum berlari.', 'Pagi pukul 06.00–09.00 udara paling segar dan jalur belum ramai.'],
    trigger_response: 'Tawaran memulai Wellness Trail, info panjang rute, dan tips pemanasan.',
    hours: [{ days: DAILY, open: '06:00', close: '21:00' }],
    best_times: ['pagi', 'sore'],
    keywords: ['jogging', 'lari', 'olahraga', 'track', 'trail', 'jalan pagi', 'wellness', 'jogging track', 'start jogging'],
    status_note: null,
  },
  {
    id: 'P13',
    name: 'Gerbang Utara',
    short_name: 'Gerbang Utara',
    category_id: 'akses',
    location_label: 'Sisi Jl. Jakarta, ujung Jl. Kiara Artha Utara',
    source: 'OpenStreetMap: halte "Gerbang Utara Kiara Artha Park", Jl. Jakarta; Google Maps: Jl. Kiara Artha Utara',
    lat: -6.9142,
    lng: 107.64128,
    radius_m: 25,
    art: 'gate',
    summary: 'Pintu masuk dari Jl. Jakarta lewat Jl. Kiara Artha Utara, dekat halte bus.',
    description:
      'Gerbang utara menghubungkan Jl. Jakarta dengan taman melalui Jl. Kiara Artha Utara. Pengunjung yang turun di halte Gerbang Utara bisa berjalan lurus ke selatan sekitar 100 meter hingga tiba di lingkar Jl. Kiara Artha, dekat lapangan padel, titik start jogging track, serta musala dan toilet.',
    trivia: [
      'Halte bus di depan gerbang ini bernama "Gerbang Utara Kiara Artha Park", sehingga mudah dijadikan patokan saat naik kendaraan umum.',
      'Dari gerbang ini, titik start jogging track hanya sekitar 130 meter ke arah tenggara.',
    ],
    activities: ['Masuk dari arah Jl. Jakarta', 'Turun dari bus di halte Gerbang Utara', 'Akses cepat ke jogging track dan area padel'],
    tips: ['Menyeberang Jl. Jakarta lewat zebra cross dan tetap waspada; lalu lintasnya ramai.', 'Lanjut lurus ke selatan untuk tiba di lingkar taman.'],
    trigger_response: 'Sambutan, arah ke lingkar taman, dan spot terdekat dari sisi utara.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'siang', 'sore', 'malam'],
    keywords: ['gerbang', 'gerbang utara', 'pintu', 'masuk', 'jl jakarta', 'halte', 'bus', 'kiara artha utara'],
    status_note: 'Titik gerbang ditentukan dari peta; validasi saat survei lapangan.',
  },
  // --- Sisi barat laut ---
  {
    id: 'P02',
    name: 'Gerbang Parkir',
    short_name: 'Gerbang Parkir',
    category_id: 'akses',
    location_label: 'Area parkir sisi barat laut, dekat gerbang utama',
    source: 'Google Maps: "Kiara Artha Parking Lot"',
    lat: -6.9154692,
    lng: 107.6411222,
    radius_m: 25,
    art: 'parking',
    summary: 'Area parkir utama; arah ke Pintu Utama dan fasilitas terdekat.',
    description:
      'Area parkir utama berada di sisi barat laut taman, tidak jauh dari Jl. Banten. Dari gerbang parkir, pengunjung dapat berjalan ke selatan menuju Pintu Utama, atau ke timur menuju titik start jogging track, musala, dan toilet di sisi utara taman. Rest Area 78 dengan deretan kafe dan rumah makan juga berada di dekat sini.',
    trivia: [
      'Lokasi taman yang berada di antara dua flyover besar Bandung timur membuatnya mudah dijangkau dari arah Antapani maupun Kiaracondong.',
      'Tiket masuk taman tercatat Rp10.000 per orang, baik hari kerja maupun akhir pekan (detikJabar, 2024). Cek kembali di loket karena harga dapat berubah.',
    ],
    activities: ['Parkir mobil dan motor', 'Arah ke Pintu Utama (±90 m ke selatan)', 'Toilet terdekat di sisi utara taman'],
    tips: ['Catat blok parkir kendaraan Anda.', 'Akhir pekan sore hari biasanya ramai; datang sebelum pukul 16.00.'],
    trigger_response: 'Notifikasi selamat datang, arah ke pintu utama, dan info fasilitas terdekat.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'siang', 'sore', 'malam'],
    keywords: ['parkir', 'mobil', 'motor', 'kendaraan', 'gerbang', 'area parkir', 'parkiran'],
    status_note: null,
  },
  {
    id: 'P17',
    name: 'Rest Area 78',
    short_name: 'Rest Area 78',
    category_id: 'kuliner',
    location_label: 'Sisi barat laut, Jl. Banten No. 78, dekat area parkir',
    source: 'Google Maps: tenan Rest Area 78 (diakses 25 Nov 2026); OpenStreetMap: Gubuk Makan Mang Engking',
    lat: -6.9153,
    lng: 107.6408,
    radius_m: 30,
    art: 'food',
    summary: 'Deretan kafe dan rumah makan di Jl. Banten, buka dari sarapan sampai malam.',
    description:
      'Rest Area 78 adalah bangunan berderet di sisi barat laut taman, menghadap Jl. Banten dekat area parkir. Di dalamnya ada beberapa kafe dan rumah makan, antara lain Orien Coffee, Bagi Kopi Kiara Artha, Kang Bubur, Nats Time, dan Gubug Makan Mang Engking, serta Fely Creative Space.',
    trivia: [
      'Papan di depan bangunan mengajak pengunjung datang dari sarapan pagi sampai nongkrong malam.',
      'Rest Area 78 dekat area parkir dan Masjid Al-Maleeq, jadi praktis untuk singgah sebelum atau sesudah menjelajah taman.',
    ],
    activities: ['Sarapan', 'Makan berat', 'Ngopi & nongkrong', 'Fely Creative Space'],
    tips: ['Jam buka tiap tenan berbeda; cek papan di depan tenan.', 'Pas untuk sarapan sebelum jogging pagi.'],
    trigger_response: 'Daftar tenan makanan & minuman dan arah ke area parkir.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'siang', 'sore', 'malam'],
    keywords: ['rest area', 'rest area 78', 'makan', 'kuliner', 'kafe', 'kopi', 'bubur', 'sarapan', 'restoran', 'orien', 'bagi kopi', 'kang bubur', 'mang engking', 'nats time'],
    status_note: 'Koordinat diperkirakan dari OpenStreetMap (Gubuk Makan Mang Engking) dan peta tenan; validasi saat survei lapangan.',
  },
  {
    id: 'P16',
    name: 'Masjid Al-Maleeq',
    short_name: 'Masjid Al-Maleeq',
    category_id: 'fasilitas',
    location_label: 'Sisi barat, di pojok deretan toko dekat Jl. Banten',
    source: 'Google Maps: "Masjid Al-Maleeq" (plus code 3JMR+J7, diakses 25 Nov 2026)',
    lat: -6.9159375,
    lng: 107.6406875,
    radius_m: 20,
    art: 'musala',
    summary: 'Masjid di sisi barat taman, dekat Jl. Banten dan Pintu Utama.',
    description:
      'Masjid Al-Maleeq berada di sisi barat kawasan Kiara Artha, di pojok deretan toko dekat Jl. Banten dan tidak jauh dari Pintu Utama. Pengunjung yang masuk dari gerbang barat atau area parkir bisa salat di sini; untuk sisi utara taman tersedia juga musala dan toilet dekat titik start jogging track.',
    trivia: [
      'Google Maps mencatat lokasi masjid ini berada di pojok deretan bangunan, dekat Jl. Banten.',
      'Selain masjid ini, Kiara Artha Park juga punya musala di sisi utara, dekat titik start jogging track.',
    ],
    activities: ['Salat berjamaah', 'Wudu', 'Istirahat sejenak'],
    tips: ['Menjelang magrib biasanya ramai; datang beberapa menit lebih awal.', 'Simpan alas kaki di tempat yang disediakan dan jaga kebersihan.'],
    trigger_response: 'Info masjid dan arah; tampil sebagai hasil cepat saat mencari masjid/musala.',
    hours: [{ days: DAILY, open: '04:00', close: '21:00' }],
    best_times: ['pagi', 'siang', 'sore', 'malam'],
    keywords: ['masjid', 'mesjid', 'al maleeq', 'al-maleeq', 'salat', 'sholat', 'shalat', 'jumat', 'wudu', 'ibadah'],
    status_note: null,
  },
]

// Interaksi dua arah: narasi suara Kia, kuis (2 soal), misi
for (const [i, p] of pois.entries()) {
  p.narration = NARASI[p.id]
  p.quiz = shuffleQuiz(KUIS[p.id], 17 + i * 31)
  p.mission = MISI[p.id]
}

// ---------------------------------------------------------------------------
// Wellness Trail (F08)
// ---------------------------------------------------------------------------
const byId = Object.fromEntries(pois.map((p) => [p.id, p]))
const at = (id) => [byId[id].lat, byId[id].lng]

const t1Anchors = [at('P06'), at('P10'), ringPoint(60), at('P11'), [-6.9164994, 107.6428604], at('P05'), at('P08'), ringPoint(180)]
const t1Path = smoothLoop(t1Anchors, 10)

const t2Start = 135
const t2Path = Array.from({ length: 73 }, (_, i) => ringPoint(t2Start - i * 5))

const trails = [
  {
    id: 'T01',
    name: 'Rute Santai Kelilingi Danau',
    subtitle: 'Jalan santai dengan peregangan dan latihan napas',
    description:
      'Rute jalan kaki santai mengelilingi danau melewati musala, zona teduh, dan Taman Asia Afrika. Setiap checkpoint memutar panduan audio berisi info spot dan ajakan peregangan atau latihan napas.',
    level: 'Santai',
    best_times: ['pagi', 'sore'],
    color: '#3f9e8e',
    path: t1Path,
    checkpoints: [
      { name: 'Titik Start Jogging Track', poi_id: 'P06', coords: at('P06'), radius_m: 25, exercise: 'Pemanasan 1 menit' },
      { name: 'Musala & Toilet', poi_id: 'P10', coords: at('P10'), radius_m: 20, exercise: 'Cek hidrasi' },
      { name: 'Zona Teduh', poi_id: 'P11', coords: at('P11'), radius_m: 20, exercise: 'Peregangan ringan 1 menit' },
      { name: 'Taman Asia Afrika', poi_id: 'P05', coords: at('P05'), radius_m: 25, exercise: 'Latihan napas 4-6' },
      { name: 'Finish: Titik Start', poi_id: 'P06', coords: at('P06'), radius_m: 25, exercise: 'Pendinginan' },
    ],
  },
  {
    id: 'T02',
    name: 'Jogging Lingkar Kiara Artha',
    subtitle: 'Satu putaran jogging di lingkar Jl. Kiara Artha',
    description:
      'Rute jogging mengikuti lingkar Jl. Kiara Artha yang mengelilingi taman. Panduan audio di tiap sisi taman membantu menjaga ritme langkah dan napas. Ulangi untuk menambah jarak.',
    level: 'Sedang',
    best_times: ['pagi', 'sore'],
    color: '#ee7b5b',
    path: t2Path,
    checkpoints: [
      { name: 'Start: Sisi Barat Laut', poi_id: null, coords: ringPoint(135), radius_m: 25, exercise: 'Pemanasan dinamis' },
      { name: 'Sisi Timur Laut', poi_id: null, coords: ringPoint(40), radius_m: 25, exercise: 'Atur ritme napas' },
      { name: 'Sisi Tenggara', poi_id: null, coords: ringPoint(315), radius_m: 25, exercise: 'Postur lari' },
      { name: 'Sisi Barat Daya', poi_id: null, coords: ringPoint(225), radius_m: 25, exercise: 'Jaga kecepatan' },
      { name: 'Finish: Sisi Barat Laut', poi_id: null, coords: ringPoint(135), radius_m: 25, exercise: 'Pendinginan' },
    ],
  },
]
for (const [i, t] of trails.entries()) {
  t.checkpoints.forEach((c, k) => (c.coaching = COACHING[t.id][k]))
  t.quiz = shuffleQuiz(KUIS_TRAIL[t.id], 101 + i * 13)
  t.distance_m = Math.round(pathLength(t.path) / 10) * 10
  t.est_minutes = Math.round((t.distance_m / (t.level === 'Santai' ? 70 : 140)) + t.checkpoints.length * 1)
}

// ---------------------------------------------------------------------------
// Badge koleksi stempel (A01)
// ---------------------------------------------------------------------------
const badges = [
  { id: 'B01', name: 'Langkah Pertama', description: 'Kumpulkan stempel pertama Anda.', poi_ids: [], min_count: 1, requires_trail: false, sort_order: 1 },
  { id: 'B02', name: 'Penjelajah Danau', description: 'Kunjungi 3 spot di sekitar danau.', poi_ids: ['P03', 'P05', 'P11'], min_count: 3, requires_trail: false, sort_order: 2 },
  { id: 'B03', name: 'Pencicip Kuliner', description: 'Kunjungi 2 dari 4 area kuliner dan kafe.', poi_ids: ['P08', 'P09', 'P15', 'P17'], min_count: 2, requires_trail: false, sort_order: 3 },
  { id: 'B04', name: 'Sahabat Sehat', description: 'Kunjungi 3 spot wellness dan selesaikan satu Wellness Trail.', poi_ids: ['P06', 'P09', 'P11'], min_count: 3, requires_trail: true, sort_order: 4 },
  { id: 'B05', name: 'Penjelajah Sejati', description: `Kumpulkan seluruh ${pois.length} stempel Kiara Artha Park.`, poi_ids: pois.map((p) => p.id), min_count: pois.length, requires_trail: false, sort_order: 5 },
].map((b) => ({ ...b, kind: 'stamp' }))
// Badge dari bintang kuis/misi, misi foto, dan kunjungan mingguan
BADGE_INTERAKSI.forEach((b, i) => badges.push({ ...b, poi_ids: [], requires_trail: false, sort_order: 6 + i }))

// Tanya Kia & Tantangan Hari Ini
const faq = FAQ.map((f, i) => ({ ...f, sort_order: i + 1 }))
const daily_challenges = TANTANGAN.map((d, i) => ({ ...d, xp: 25, sort_order: i + 1 }))

// ---------------------------------------------------------------------------
// Validasi jarak antar-POI
// ---------------------------------------------------------------------------
const close = []
for (let i = 0; i < pois.length; i++)
  for (let j = i + 1; j < pois.length; j++) {
    const d = haversine(at(pois[i].id), at(pois[j].id))
    if (d < 40) close.push(`${pois[i].id}-${pois[j].id}: ${d.toFixed(0)} m`)
  }

// ---------------------------------------------------------------------------
// Output JSON
// ---------------------------------------------------------------------------
const version = '2026-11-25'
const dataset = { version, park, categories, pois, trails, badges, faq, daily_challenges }
mkdirSync(resolve(root, 'src/data'), { recursive: true })
writeFileSync(resolve(root, 'src/data/poi.json'), JSON.stringify(dataset, null, 2) + '\n')

// ---------------------------------------------------------------------------
// Output SQL
// ---------------------------------------------------------------------------
const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
const arr = (a) => (a && a.length ? `array[${a.map(q).join(', ')}]::text[]` : `'{}'::text[]`)
const intArr = (a) => `array[${a.join(',')}]::int[]`
const json = (o) => `${q(JSON.stringify(o))}::jsonb`

const geog = (lat, lng) => `extensions.st_setsrid(extensions.st_makepoint(${lng}, ${lat}), 4326)::extensions.geography`
const tq = (s) => `'${s}'` // nilai waktu

// Sumber & status verifikasi tiap trivia (urutan sama dengan pois[].trivia)
const TRIVIA_SOURCES = {
  P01: [['Orami (30 Sep 2024); Republika (24 Agu 2019)', true], ['Orami (2024); Republika (2019)', true]],
  P02: [['Orami (2024); Republika (2019)', true], ['detikJabar (Mar 2024)', true]],
  P03: [['Orami (30 Sep 2024)', true], ['Google Maps: Friendship Shake Hand Sculpture', true]],
  P05: [['Sejarah KAA 1955 (Museum KAA) — perlu dicek tim', false], ['Pengamatan peta Google Maps', true]],
  P06: [['Orami (30 Sep 2024)', true], ['Asia Property Awards — profil Kiara Artha Park', true]],
  P07: [['Google Maps: Papa Skuter (25 Nov 2026)', true], ['detikJabar (Mar 2024)', true]],
  P08: [['Orami (30 Sep 2024)', true], ['Google Maps: Ludo Sports Kitchen and Coffee (16 Nov 2026)', true]],
  P09: [['Pengetahuan umum olahraga padel — perlu dicek tim', false], ['Pengetahuan umum olahraga padel — perlu dicek tim', false]],
  P10: [['Google Maps: Mushalla Kiara Artha Park', true], ['Google Maps: toilet umum di area parkir — perlu dicek tim', false]],
  P11: [['Pengetahuan umum kesehatan — perlu dicek tim', false], ['Pengetahuan umum kesehatan — perlu dicek tim', false]],
  P13: [['OpenStreetMap: halte Gerbang Utara Kiara Artha Park (24 Nov 2026)', true], ['Hitungan jarak koordinat peta', true]],
  P14: [['OpenStreetMap: halte Gerbang Timur Kiara Artha Park (24 Nov 2026)', true], ['Orami (2024); Republika (2019)', true]],
  P15: [['OpenStreetMap: tenan Jl. H. Ibrahim Adjie (24 Nov 2026)', true], ['Hitungan jarak koordinat peta', true]],
  P16: [['Google Maps: Masjid Al-Maleeq (24 Nov 2026)', true], ['Google Maps: Mushalla Kiara Artha Park', true]],
  P17: [['Foto papan Rest Area 78 (tim, 25 Nov 2026)', true], ['Hitungan jarak koordinat peta', true]],
  P18: [['Foto papan harga di loket (tim, 25 Nov 2026)', true], ['OpenStreetMap: Kiara Artha Park sign', true]],
}

// Keterangan foto yang perlu diambil tim (berkas diunggah ke bucket poi-media)
const PHOTO_CAPTIONS = {
  P01: ['Gerbang barat dari arah Jl. Banten', 'Papan peta zona taman di dekat gerbang'],
  P02: ['Pintu masuk area parkir', 'Jalur pejalan kaki dari parkir ke gerbang'],
  P03: ['Pertunjukan air mancur menari pada malam hari', 'Danau dan air mancur pada siang hari'],
  P05: ['Spot foto Taman Asia Afrika berlatar danau', 'Sudut foto menghadap air mancur'],
  P06: ['Titik start jogging track', 'Jalur lingkar Jl. Kiara Artha'],
  P07: ['Skuter dan sepeda listrik Papa Skuter', 'Area sewa di dekat Taman Asia Afrika'],
  P08: ['Kiara Pelangi Food Court', 'Deretan tenant kuliner'],
  P09: ['Lapangan padel semi-outdoor', 'Area kafe di sekitar lapangan'],
  P10: ['Bangunan musala', 'Toilet umum dan tempat wudu'],
  P11: ['Bangku teduh di bawah pepohonan', 'Kanopi pohon di sisi timur danau'],
  P13: ['Gerbang utara dari arah Jl. Jakarta', 'Jl. Kiara Artha Utara menuju lingkar taman'],
  P14: ['Gerbang timur dari arah Jl. Ibrahim Adjie', 'Jalan masuk menuju Food Court 2'],
  P15: ['Deretan tenan Food Court 2', 'Suasana makan malam di Food Court 2'],
  P16: ['Tampak depan Masjid Al-Maleeq', 'Ruang salat dan tempat wudu'],
  P17: ['Tampak depan Rest Area 78', 'Deretan tenan kafe dan rumah makan'],
  P18: ['Loket tiket di bawah tenda', 'Papan harga tiket masuk'],
}
const estSeconds = (text) => Math.round(text.split(/\s+/).filter(Boolean).length / 2.6)

const lines = []
lines.push('-- SETARA — isi konten database (dibuat otomatis oleh scripts/build-data.mjs; jangan edit manual)')
lines.push(`-- Versi dataset: ${version}. Mengganti data simulasi dengan data Kiara Artha Park (koordinat Google Maps).`)
lines.push('-- Jalankan SETELAH migrasi 20261116000000_setara_lengkapi_skema.sql, 20261119000000_setara_interaksi_dua_arah.sql, dan 20261124000000_setara_akun_pengguna.sql')
lines.push('begin;')
lines.push('')
lines.push(`insert into public.park_info (id, data, version) values ('kiara-artha', ${json(park)}, ${q(version)})`)
lines.push('  on conflict (id) do update set data = excluded.data, version = excluded.version, updated_at = now();')
lines.push('')
lines.push('-- Kategori (atribut tampilan)')
for (const c of categories) lines.push(`update public.category set color = ${q(c.color)}, icon = ${q(c.icon)}, sort_order = ${c.sort_order} where id = ${q(c.id)};`)
lines.push('')
lines.push('-- POI: koordinat nyata, radius, konten (upsert: POI baru ikut dibuat)')
const poiCols = ['id', 'name', 'short_name', 'category_id', 'zone', 'location', 'radius_m', 'description', 'trigger_response', 'qr_code', 'data_source',
  'is_published', 'summary', 'narration', 'activities', 'tips', 'best_times', 'keywords', 'art', 'status_note', 'source_place', 'sort_order']
for (const [i, p] of pois.entries()) {
  const vals = [
    q(p.id), q(p.name), q(p.short_name), q(p.category_id), q(p.location_label), geog(p.lat, p.lng), p.radius_m, q(p.description),
    q(p.trigger_response), q('SETARA:POI:' + p.id), `'google_maps'`, 'true', q(p.summary), q(p.narration), arr(p.activities),
    arr(p.tips), arr(p.best_times), arr(p.keywords), q(p.art), q(p.status_note), q(p.source), i + 1,
  ]
  lines.push(
    `insert into public.poi (${poiCols.join(', ')}) values (${vals.join(', ')})\n` +
      `  on conflict (id) do update set ${poiCols.slice(1).map((c) => `${c} = excluded.${c}`).join(', ')};`
  )
}
lines.push('-- POI yang sudah tidak ada di lapangan (mis. Kampung Korea, Lolipops Playland) disembunyikan, bukan dihapus,')
lines.push('-- agar umpan balik lama yang merujuk ke POI tersebut tetap utuh.')
lines.push(`update public.poi set is_published = false where id not in (${pois.map((p) => q(p.id)).join(', ')});`)
lines.push('')
lines.push('-- Kategori ganda (P09 = Kuliner & Wellness)')
lines.push('delete from public.poi_category;')
lines.push(
  'insert into public.poi_category (poi_id, category_id) values ' +
    pois.flatMap((p) => [p.category_id, p.secondary_category_id].filter(Boolean).map((c) => `(${q(p.id)}, ${q(c)})`)).join(', ') +
    ';'
)
lines.push('')
lines.push('-- Trivia (≥1 per POI; is_verified = bersumber dokumen/Google Maps)')
lines.push('delete from public.trivia;')
lines.push('insert into public.trivia (poi_id, content, source_reference, is_verified) values')
lines.push(
  pois
    .flatMap((p) => p.trivia.map((t, k) => `  (${q(p.id)}, ${q(t)}, ${q(TRIVIA_SOURCES[p.id][k][0])}, ${TRIVIA_SOURCES[p.id][k][1]})`))
    .join(',\n') + ';'
)
lines.push('')
lines.push('-- Foto: path di bucket poi-media (unggah berkas dengan nama ini); keterangan = foto yang perlu diambil')
lines.push(`delete from public.photo where poi_id in (${pois.map((p) => q(p.id)).join(', ')});`)
lines.push('insert into public.photo (poi_id, file_path, caption, display_order) values')
lines.push(
  pois.flatMap((p) => [1, 2].map((k) => `  (${q(p.id)}, ${q(`poi-media/foto/${p.id.toLowerCase()}_${k}.jpg`)}, ${q(PHOTO_CAPTIONS[p.id][k - 1])}, ${k})`)).join(',\n') + ';'
)
lines.push('')
lines.push('-- Audio narasi: path di bucket poi-media; durasi = estimasi naskah narasi (TTS dipakai sampai berkas diunggah)')
lines.push(`delete from public.audio where poi_id in (${pois.map((p) => q(p.id)).join(', ')});`)
lines.push('insert into public.audio (poi_id, file_path, duration_seconds, language_code) values')
lines.push(pois.map((p) => `  (${q(p.id)}, ${q(`poi-media/audio/${p.id.toLowerCase()}.mp3`)}, ${estSeconds(p.narration)}, 'id')`).join(',\n') + ';')
lines.push('')
lines.push('-- Jam operasional per hari (0 = Minggu … 6 = Sabtu)')
lines.push(`delete from public.schedule where poi_id in (${pois.map((p) => q(p.id)).join(', ')});`)
lines.push('insert into public.schedule (poi_id, day_of_week, open_time, close_time, is_closed, notes) values')
lines.push(
  pois
    .flatMap((p) =>
      Array.from({ length: 7 }, (_, d) => {
        const rule = p.hours.find((h) => h.days.includes(d))
        const note = p.status_note && /jam|Jadwal/i.test(p.status_note) ? p.status_note : 'Jam taman 07.00–21.00 (Google Maps/detikJabar 2024)'
        return rule ? `  (${q(p.id)}, ${d}, ${tq(rule.open)}, ${tq(rule.close)}, false, ${q(note)})` : `  (${q(p.id)}, ${d}, null, null, true, 'Tutup')`
      })
    )
    .join(',\n') + ';'
)
lines.push('')
lines.push('-- Jadwal atraksi')
lines.push('delete from public.poi_event;')
const events = pois.flatMap((p) => (p.schedules || []).flatMap((s) => s.days.map((d) => ({ ...s, d, poi_id: p.id }))))
lines.push(
  'insert into public.poi_event (poi_id, title, day_of_week, start_time, end_time, notes) values\n' +
    events.map((e) => `  (${q(e.poi_id)}, ${q(e.title)}, ${e.d}, ${tq(e.start)}, ${tq(e.end)}, 'Orami (2024): 18.30–20.30, berbeda tiap jam')`).join(',\n') +
    ';'
)
lines.push('')
lines.push('-- Wellness Trail & checkpoint')
lines.push('delete from public.trail_checkpoint; delete from public.wellness_trail;')
for (const [i, t] of trails.entries()) {
  lines.push(
    `insert into public.wellness_trail (id, name, subtitle, description, level, distance_m, est_minutes, best_times, color, path, sort_order) values (` +
      [q(t.id), q(t.name), q(t.subtitle), q(t.description), q(t.level), t.distance_m, t.est_minutes, arr(t.best_times), q(t.color), json(t.path), i + 1].join(', ') +
      ');'
  )
  lines.push('insert into public.trail_checkpoint (trail_id, seq, name, poi_id, location, radius_m, exercise, coaching) values')
  lines.push(
    t.checkpoints
      .map((c, k) => `  (${q(t.id)}, ${k + 1}, ${q(c.name)}, ${q(c.poi_id)}, ${geog(c.coords[0], c.coords[1])}, ${c.radius_m}, ${q(c.exercise)}, ${q(c.coaching)})`)
      .join(',\n') + ';'
  )
}
lines.push('')
lines.push('-- Badge koleksi stempel')
lines.push('delete from public.badge;')
lines.push('insert into public.badge (id, name, description, poi_ids, min_count, requires_trail, kind, sort_order) values')
lines.push(badges.map((b) => `  (${q(b.id)}, ${q(b.name)}, ${q(b.description)}, ${arr(b.poi_ids)}, ${b.min_count}, ${b.requires_trail}, ${q(b.kind)}, ${b.sort_order})`).join(',\n') + ';')
lines.push('')
lines.push('-- Interaksi dua arah (migrasi 20261119000000): kuis, misi, Tanya Kia, Tantangan Hari Ini')
lines.push('delete from public.quiz_question;')
const quizRows = [
  ...pois.flatMap((p) => p.quiz.map((x, k) => ({ owner: `${q(p.id)}, null`, k, x }))),
  ...trails.flatMap((t) => t.quiz.map((x, k) => ({ owner: `null, ${q(t.id)}`, k, x }))),
]
lines.push('insert into public.quiz_question (poi_id, trail_id, seq, question, options, answer_index, explanation) values')
lines.push(quizRows.map(({ owner, k, x }) => `  (${owner}, ${k + 1}, ${q(x.q)}, ${arr(x.options)}, ${x.answer}, ${q(x.explain)})`).join(',\n') + ';')
lines.push('delete from public.mission;')
lines.push('insert into public.mission (poi_id, type, title, prompt, done_label, seconds, cues) values')
lines.push(
  pois.map((p) => `  (${q(p.id)}, ${q(p.mission.type)}, ${q(p.mission.title)}, ${q(p.mission.prompt)}, ${q(p.mission.done_label)}, ${p.mission.seconds ?? 'null'}, ${json(p.mission.cues || [])})`).join(',\n') + ';'
)
lines.push('delete from public.kia_faq;')
lines.push('insert into public.kia_faq (id, patterns, answer, poi_id, sort_order) values')
lines.push(faq.map((f) => `  (${q(f.id)}, ${arr(f.patterns)}, ${q(f.answer)}, ${q(f.poi_id)}, ${f.sort_order})`).join(',\n') + ';')
lines.push('delete from public.daily_challenge;')
lines.push('insert into public.daily_challenge (id, title, description, goal_type, goal_count, before_time, xp, sort_order) values')
lines.push(
  daily_challenges.map((d) => `  (${q(d.id)}, ${q(d.title)}, ${q(d.description)}, ${q(d.goal_type)}, ${d.goal_count}, ${d.before ? tq(d.before) : 'null'}, ${d.xp}, ${d.sort_order})`).join(',\n') + ';'
)
lines.push('commit;')
mkdirSync(resolve(root, 'supabase'), { recursive: true })
writeFileSync(resolve(root, 'supabase/seed.sql'), lines.join('\n') + '\n')

console.log(`poi.json + seed.sql ditulis (${pois.length} POI, ${trails.length} trail, ${badges.length} badge)`)
for (const t of trails) console.log(`  ${t.id} ${t.name}: ${t.distance_m} m, ±${t.est_minutes} menit`)
console.log(close.length ? `  POI < 40 m: ${close.join('; ')}` : '  Semua POI berjarak ≥ 40 m')
