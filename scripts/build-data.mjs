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

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

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
  ticket: 'Rp10.000 per orang (detikJabar, 2024) — cek kembali di loket',
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
    { label: 'Pemkot Bandung — Bike on The Street Everybody Happy (BOSEH)', url: 'https://www.bandung.go.id/sub-etalase/27/sepeda' },
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

const pois = [
  {
    id: 'P01',
    name: 'Pintu Utama Kiara Artha Park',
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
      'Pintu masuk utama Kiara Artha Park berada di sisi barat, menghadap Jl. Banten. Dari sini jalur pejalan kaki mengarah ke lingkar Jl. Kiara Artha yang mengelilingi danau dan air mancur menari di tengah taman. Zona taman tersusun melingkar: area kuliner dan kafe di sisi selatan, danau dan air mancur di tengah, area bermain anak di sisi timur, serta jalur jogging dan musala di sisi utara.',
    trivia: [
      'Kiara Artha Park diresmikan pada 17 Agustus 2019, bertepatan dengan HUT ke-74 Republik Indonesia.',
      'Taman ini terletak di antara flyover Antapani dan flyover Kiaracondong, di Kelurahan Kebonwaru, Kecamatan Batununggal.',
    ],
    activities: ['Peta ringkas zona taman', 'Titik kumpul rombongan', 'Akses ke Selter BOSEH dan area parkir'],
    tips: [
      'Foto papan peta di gerbang sebagai cadangan bila baterai menipis.',
      'Sore hari (15.00–18.00) cocok untuk jalan santai sebelum pertunjukan air mancur.',
    ],
    trigger_response: 'Audio sambutan, ringkasan zona taman, dan rekomendasi rute sesuai jam kunjungan.',
    narration:
      'Selamat datang di Kiara Artha Park! Anda berada di gerbang barat, sisi Jalan Banten. Taman kota ini diresmikan pada tujuh belas Agustus dua ribu sembilan belas dan kini menjadi salah satu ruang publik favorit warga Bandung. Tata letaknya melingkar. Di tengah ada danau dengan air mancur menari. Di sisi utara terdapat titik start jogging track dan musala. Area bermain anak ada di sisi timur, sedangkan area kuliner dan kafe berada di sisi selatan. Ikuti jalur pejalan kaki ke arah timur untuk mencapai lingkar taman. SETARA akan memberi tahu Anda setiap kali mendekati spot menarik, jadi silakan simpan ponsel dan nikmati perjalanan.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'siang', 'sore', 'malam'],
    keywords: ['gerbang', 'pintu', 'masuk', 'jl banten', 'peta', 'tiket'],
    status_note: null,
  },
  {
    id: 'P02',
    name: 'Gerbang Area Parkir',
    short_name: 'Area Parkir',
    category_id: 'akses',
    location_label: 'Area parkir sisi barat laut, dekat gerbang utama',
    source: 'Google Maps: "Kiara Artha Parking Lot"',
    lat: -6.9154692,
    lng: 107.6411222,
    radius_m: 25,
    art: 'parking',
    summary: 'Area parkir utama; arah ke Pintu Utama dan fasilitas terdekat.',
    description:
      'Area parkir utama berada di sisi barat laut taman, tidak jauh dari Jl. Banten. Dari gerbang parkir, pengunjung dapat berjalan ke selatan menuju Pintu Utama, atau ke timur menuju titik start jogging track, musala, dan toilet di sisi utara taman. Selter Sepeda BOSEH juga berada di dekat sini.',
    trivia: [
      'Lokasi taman yang berada di antara dua flyover besar Bandung timur membuatnya mudah dijangkau dari arah Antapani maupun Kiaracondong.',
      'Tiket masuk taman tercatat Rp10.000 per orang, baik hari kerja maupun akhir pekan (detikJabar, 2024). Cek kembali di loket karena harga dapat berubah.',
    ],
    activities: ['Parkir mobil dan motor', 'Arah ke Pintu Utama (±90 m ke selatan)', 'Toilet terdekat di sisi utara taman'],
    tips: ['Catat blok parkir kendaraan Anda.', 'Akhir pekan sore hari biasanya ramai; datang sebelum pukul 16.00.'],
    trigger_response: 'Notifikasi selamat datang, arah ke pintu utama, dan info fasilitas terdekat.',
    narration:
      'Halo, selamat datang di Kiara Artha Park! Anda berada di gerbang area parkir di sisi barat laut taman. Untuk menuju Pintu Utama, berjalanlah sekitar sembilan puluh meter ke arah selatan. Jika Anda ingin langsung berolahraga, titik start jogging track ada di sebelah timur, tidak jauh dari musala dan toilet. Selter sepeda BOSEH juga berada di dekat sini bila Anda ingin berkeliling dengan sepeda. Jangan lupa mencatat lokasi kendaraan Anda. Selamat menjelajah!',
    hours: PARK_HOURS,
    best_times: ['pagi', 'siang', 'sore', 'malam'],
    keywords: ['parkir', 'mobil', 'motor', 'kendaraan', 'gerbang'],
    status_note: null,
  },
  {
    id: 'P03',
    name: 'Danau & Air Mancur Menari',
    short_name: 'Air Mancur',
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
    narration:
      'Anda kini berada di tepi danau, jantung Kiara Artha Park. Di tengah danau inilah air mancur menari tampil setiap malam. Pertunjukan biasanya dimulai pukul setengah tujuh malam dan berlangsung hingga pukul setengah sembilan, dengan tema yang berbeda setiap jamnya. Semburan air bergerak mengikuti irama musik dan disinari lampu warna-warni. Coba perhatikan patung dua tangan yang berjabat di tepi utara danau. Itulah Friendship Shake Hand, simbol persahabatan. Jika Anda datang siang hari, nikmati angin di tepian danau, lalu kembali saat matahari terbenam untuk menyaksikan pertunjukannya.',
    hours: PARK_HOURS,
    schedules: [
      { title: 'Pertunjukan Air Mancur Menari', days: DAILY, start: '18:30', end: '18:50' },
      { title: 'Pertunjukan Air Mancur Menari', days: DAILY, start: '19:30', end: '19:50' },
      { title: 'Pertunjukan Air Mancur Menari', days: DAILY, start: '20:30', end: '20:50' },
    ],
    best_times: ['sore', 'malam'],
    keywords: ['danau', 'air mancur', 'fountain', 'pertunjukan', 'malam', 'lampu', 'show'],
    status_note: 'Jadwal pertunjukan dapat berubah; cek Instagram @kiaraarthapark.',
  },
  {
    id: 'P04',
    name: 'Area Tematik Asia',
    short_name: 'Tematik Asia',
    category_id: 'atraksi',
    location_label: 'Zona bergaya Korea di sisi barat, dekat Jl. Banten',
    source: 'Google Maps: "KAMPUNG KOREA BANDUNG"',
    lat: -6.9156793,
    lng: 107.6406188,
    radius_m: 30,
    art: 'asia',
    summary: 'Zona tematik bernuansa Asia, dikenal sebagai Kampung Korea.',
    description:
      'Zona tematik bergaya Asia berada di sisi barat taman, dekat Jl. Banten. Area ini dikenal sebagai Kampung Korea: deretan bangunan dan ornamen bernuansa Korea yang sejak awal menjadi magnet foto pengunjung dan membuat Kiara Artha Park dijuluki destinasi "ala Korea" di tengah Kota Bandung.',
    trivia: [
      'Kiara Artha Park sempat dipromosikan media sebagai destinasi wisata Bandung ala Korea berkat Kampung Korea-nya (VIVA).',
      'Selain zona Asia, taman ini punya Taman Asia Afrika di sisi selatan danau, yang namanya menggemakan Konferensi Asia Afrika 1955 di Bandung.',
    ],
    activities: ['Berfoto dengan ornamen bernuansa Asia', 'Mendengarkan cerita budaya lewat narasi audio'],
    tips: ['Cahaya terbaik untuk foto: pagi 08.00–10.00 saat matahari dari timur.'],
    trigger_response: 'Prompt suara, kartu informasi, dan stempel POI.',
    narration:
      'Anda sedang berada di Area Tematik Asia, di sisi barat Kiara Artha Park. Kawasan ini dikenal sebagai Kampung Korea. Ketika taman dibuka pada tahun dua ribu sembilan belas, deretan bangunan dan ornamen bernuansa Korea di sini langsung menjadi magnet foto, sampai Kiara Artha Park dijuluki destinasi ala Korea di tengah Kota Bandung. Perhatikan detail atap, warna, dan tulisan Hangeul yang menghiasi area ini. Setelah dari sini, Anda bisa melanjutkan ke Taman Asia Afrika di sisi selatan danau, spot foto paling ikonik di taman ini.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'siang', 'sore'],
    keywords: ['asia', 'korea', 'kampung korea', 'budaya', 'tematik', 'foto'],
    status_note:
      'Google Maps menandai "Kampung Korea Bandung" sebagai tutup permanen (diakses 16 Nov 2026). Konfirmasi kondisi area saat survei lapangan.',
  },
  {
    id: 'P05',
    name: 'Spot Foto Ikonik: Taman Asia Afrika',
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
    narration:
      'Selamat datang di Taman Asia Afrika, spot foto paling ikonik di Kiara Artha Park. Nama taman ini mengingatkan kita pada Konferensi Asia Afrika tahun seribu sembilan ratus lima puluh lima, ketika para pemimpin dua puluh sembilan negara berkumpul di Gedung Merdeka, Bandung. Dari sini, danau dan air mancur menari terlihat utuh. Untuk foto terbaik, menghadaplah ke utara. Pagi hari cahaya matahari lembut dari samping, sedangkan malam hari Anda bisa menangkap air mancur yang berwarna-warni. Siapkan gaya terbaik Anda!',
    hours: PARK_HOURS,
    best_times: ['pagi', 'sore', 'malam'],
    keywords: ['foto', 'ikonik', 'asia afrika', 'spot foto', 'instagram', 'selfie'],
    status_note: null,
  },
  {
    id: 'P06',
    name: 'Titik Start Jogging Track',
    short_name: 'Start Jogging',
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
    narration:
      'Anda berada di titik start jogging track Kiara Artha Park. Jalur di depan Anda mengikuti lingkar Jalan Kiara Artha yang mengelilingi danau, kira-kira tujuh ratus lima puluh meter untuk satu putaran. Sebelum mulai, lakukan pemanasan ringan selama tiga sampai lima menit: putar pergelangan kaki, ayunkan lengan, lalu jalan di tempat. Jika ingin dipandu, mulailah Wellness Trail dari menu Trail. SETARA akan memandu setiap checkpoint dengan suara dan mencatat jarak serta durasi Anda. Selamat berolahraga!',
    hours: [{ days: DAILY, open: '06:00', close: '21:00' }],
    best_times: ['pagi', 'sore'],
    keywords: ['jogging', 'lari', 'olahraga', 'track', 'trail', 'jalan pagi', 'wellness'],
    status_note: null,
  },
  {
    id: 'P07',
    name: 'Selter Sepeda BOSEH',
    short_name: 'Selter BOSEH',
    category_id: 'wellness',
    location_label: 'Sisi barat taman, dekat area parkir',
    source: 'Google Maps: "Stasiun Boseh Kiara Artha Park"',
    lat: -6.915669,
    lng: 107.6408092,
    radius_m: 20,
    art: 'bike',
    summary: 'Sewa sepeda BOSEH untuk berkeliling taman dan kota.',
    description:
      'Selter Bike on the Street Everybody Happy (BOSEH) di sisi barat taman. Pengunjung dapat menyewa sepeda untuk berkeliling lingkar taman maupun menjelajah Bandung. Di dalam taman juga tersedia persewaan sepeda dan skuter listrik swasta.',
    trivia: [
      'BOSEH adalah program sepeda sewa Pemerintah Kota Bandung; tarif resmi tercatat Rp1.000 untuk jam pertama dan Rp2.000 untuk jam berikutnya.',
      'Persewaan sepeda dan skuter listrik di dalam taman bertarif Rp30.000 pada hari kerja dan Rp40.000 pada akhir pekan (detikJabar, 2024).',
    ],
    activities: ['Sewa sepeda BOSEH', 'Sewa sepeda/skuter listrik di dalam taman', 'Bersepeda di lingkar taman'],
    tips: ['Siapkan kartu identitas untuk registrasi.', 'Gunakan jalur lingkar dan utamakan pejalan kaki.'],
    trigger_response: 'Info cara sewa sepeda/skuter, tarif dan jam operasional, serta rute bersepeda.',
    narration:
      'Anda berada di Selter Sepeda BOSEH, singkatan dari Bike on the Street Everybody Happy, program sepeda sewa milik Pemerintah Kota Bandung. Untuk menyewa, daftarkan diri dengan kartu identitas di petugas atau aplikasi BOSEH, lalu pilih sepeda yang tersedia. Tarif resminya sangat terjangkau, mulai seribu rupiah untuk jam pertama. Di dalam taman juga ada persewaan sepeda dan skuter listrik dengan tarif sekitar tiga puluh hingga empat puluh ribu rupiah. Rute favorit adalah lingkar Jalan Kiara Artha mengelilingi danau. Selalu utamakan pejalan kaki, ya!',
    hours: [
      { days: WEEKDAY, open: '08:00', close: '16:00' },
      { days: WEEKEND, open: '06:00', close: '18:00' },
    ],
    best_times: ['pagi', 'sore'],
    keywords: ['sepeda', 'boseh', 'skuter', 'sewa', 'bike', 'bersepeda'],
    status_note: 'Jam layanan mengacu pada jam booth BOSEH Pemkot Bandung; konfirmasi saat survei.',
  },
  {
    id: 'P08',
    name: 'Area Kuliner / Food Court',
    short_name: 'Area Kuliner',
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
    narration:
      'Anda tiba di Area Kuliner Kiara Artha Park. Di kawasan Kiara Pelangi ini terdapat food court dengan beragam tenant, mulai dari makanan berat hingga jajanan dan minuman segar. Di sekitarnya ada kafe-kafe populer seperti Ludo Sports Kitchen and Coffee dan Monday Co. Menariknya, paket Kiara Pelangi Food Court disebut sudah termasuk akses menonton air mancur menari, jadi Anda bisa makan malam sambil menunggu pertunjukan. Jam buka setiap tenant berbeda, jadi cek papan informasi di lokasi. Selamat menikmati kuliner!',
    hours: [{ days: DAILY, open: '10:00', close: '21:00' }],
    best_times: ['siang', 'sore', 'malam'],
    keywords: ['makan', 'kuliner', 'food court', 'kiara pelangi', 'restoran', 'minum', 'jajan'],
    status_note: 'Jam buka tenant bervariasi; konfirmasi saat survei.',
  },
  {
    id: 'P09',
    name: 'Area Kafe & Lapangan Padel',
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
    narration:
      'Anda berada di Area Kafe dan Lapangan Padel di sisi utara Kiara Artha Park. Padel adalah olahraga raket yang lahir di Meksiko pada tahun seribu sembilan ratus enam puluh sembilan. Permainannya mirip tenis, tetapi lapangannya lebih kecil dan dikelilingi dinding kaca, dan bola boleh memantul ke dinding. Lapangan semi-outdoor di sini bisa dipesan langsung ke pengelola. Jika hanya ingin bersantai, kafe di sekitar lapangan cocok untuk menikmati minuman sambil menonton pertandingan. Tempat yang pas untuk beristirahat setelah jogging!',
    hours: [{ days: DAILY, open: '07:00', close: '22:00' }],
    best_times: ['pagi', 'sore', 'malam'],
    keywords: ['padel', 'kafe', 'cafe', 'kopi', 'olahraga', 'raket', 'nongkrong'],
    status_note: 'Jam operasional perlu dikonfirmasi ke pengelola saat survei.',
  },
  {
    id: 'P10',
    name: 'Area Bermain Anak',
    short_name: 'Area Bermain',
    category_id: 'keluarga',
    location_label: 'Lollipop Playland, sisi timur danau',
    source: 'Google Maps: "Lolipops Playland and Cafe"',
    lat: -6.9164994,
    lng: 107.6428604,
    radius_m: 25,
    art: 'playground',
    summary: 'Lollipop Playland: wahana bermain anak dan kafe untuk pendamping.',
    description:
      'Lollipop Playland adalah area bermain anak di sisi timur danau, lengkap dengan kafe bagi orang tua dan pendamping. Lokasinya dekat Zona Relaksasi, sehingga pendamping bisa beristirahat di tempat teduh setelah anak-anak bermain.',
    trivia: [
      'Lollipop Playland termasuk fasilitas yang paling sering disebut media saat membahas Kiara Artha Park, bersama air mancur menari dan Kampung Korea.',
      'Area ini berada sekitar 80 meter dari air mancur, titik temu yang mudah diingat bila anggota keluarga terpisah.',
    ],
    activities: ['Wahana bermain anak', 'Kafe untuk pendamping', 'Titik istirahat keluarga'],
    tips: [
      'Sepakati titik temu (misalnya air mancur) bila anggota rombongan terpisah.',
      'Cek ketentuan usia dan tinggi badan di loket wahana; bawa kaus kaki untuk area bermain indoor.',
    ],
    trigger_response: 'Info wahana, batas usia, tips keamanan anak, dan fasilitas terdekat bagi pendamping.',
    narration:
      'Halo keluarga! Anda berada di dekat Lollipop Playland, area bermain anak di sisi timur danau. Di sini anak-anak bisa bermain di berbagai wahana, sementara orang tua dan pendamping beristirahat di kafe. Sebelum bermain, cek ketentuan usia dan tinggi badan di loket, dan siapkan kaus kaki untuk area bermain indoor. Untuk keamanan, sepakati satu titik temu yang mudah diingat, misalnya air mancur di tengah danau, sekitar delapan puluh meter dari sini. Jika ingin beristirahat, Zona Relaksasi yang teduh ada di sebelah utara. Selamat bermain!',
    hours: [{ days: DAILY, open: '09:00', close: '21:00' }],
    best_times: ['pagi', 'siang', 'sore'],
    keywords: ['anak', 'bermain', 'playground', 'lollipop', 'keluarga', 'wahana', 'balita'],
    status_note: 'Jam operasional wahana perlu dikonfirmasi saat survei.',
  },
  {
    id: 'P11',
    name: 'Zona Relaksasi / Spot Teduh',
    short_name: 'Zona Teduh',
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
    narration:
      'Selamat datang di Zona Relaksasi, area teduh di bawah kanopi pepohonan di sisi timur danau. Mari berhenti sejenak. Berdirilah dengan nyaman atau duduk di bangku terdekat. Tarik napas perlahan melalui hidung selama empat hitungan. Tahan sebentar. Lalu hembuskan perlahan melalui mulut selama enam hitungan. Ulangi tiga kali. Sekarang angkat kedua bahu ke arah telinga, tahan, lalu lepaskan. Putar leher perlahan ke kiri dan ke kanan. Rasakan udara yang lebih sejuk di bawah pepohonan ini. Jika sudah siap, lanjutkan perjalanan Anda dengan langkah yang lebih ringan.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'siang', 'sore'],
    keywords: ['teduh', 'relaksasi', 'istirahat', 'napas', 'peregangan', 'pohon', 'duduk'],
    status_note: 'Titik ditentukan dari citra satelit Google Maps; validasi saat survei lapangan.',
  },
  {
    id: 'P12',
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
      'Fasilitas umum utama di sisi utara taman: musala, tempat wudu, dan toilet. Lokasinya dekat Layana Hall dan titik start jogging track, sehingga mudah dijangkau sebelum atau sesudah berolahraga.',
    trivia: [
      'Musala ini tercatat di Google Maps sebagai "Mushalla Kiara Artha Park", berdekatan dengan Layana Hall.',
      'Toilet umum lain juga tersedia di sekitar area parkir sisi barat laut taman.',
    ],
    activities: ['Salat', 'Wudu', 'Toilet umum'],
    tips: ['Menjelang magrib musala biasanya ramai; datang beberapa menit lebih awal.', 'Jaga kebersihan dan simpan alas kaki di rak yang tersedia.'],
    trigger_response: 'Info fasilitas dan arah; tampil sebagai hasil cepat pada filter Fasilitas.',
    narration:
      'Anda berada di area Musala dan Toilet Kiara Artha Park, fasilitas umum utama di sisi utara taman. Di sini tersedia musala, tempat wudu, dan toilet umum. Menjelang waktu magrib, musala biasanya ramai, jadi datanglah beberapa menit lebih awal. Simpan alas kaki di rak yang tersedia dan bantu jaga kebersihan bersama. Setelah ini, Anda bisa melanjutkan ke titik start jogging track di sebelah barat, atau menuju danau dan air mancur di selatan.',
    hours: PARK_HOURS,
    best_times: ['pagi', 'siang', 'sore', 'malam'],
    keywords: ['musala', 'mushola', 'masjid', 'salat', 'sholat', 'toilet', 'wc', 'kamar mandi', 'wudu'],
    status_note: null,
  },
]

// ---------------------------------------------------------------------------
// Wellness Trail (F08)
// ---------------------------------------------------------------------------
const byId = Object.fromEntries(pois.map((p) => [p.id, p]))
const at = (id) => [byId[id].lat, byId[id].lng]

const t1Anchors = [at('P06'), at('P12'), ringPoint(60), at('P11'), at('P10'), at('P05'), at('P08'), ringPoint(180)]
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
      { name: 'Titik Start Jogging Track', poi_id: 'P06', coords: at('P06'), radius_m: 25, exercise: 'Pemanasan 1 menit', coaching: 'Checkpoint satu, titik start. Mari pemanasan. Putar pergelangan kaki kanan dan kiri masing-masing lima kali, lalu ayunkan kedua lengan ke depan dan ke belakang. Setelah itu, mulailah berjalan santai ke arah timur menuju musala.' },
      { name: 'Musala & Layana Hall', poi_id: 'P12', coords: at('P12'), radius_m: 20, exercise: 'Cek hidrasi', coaching: 'Checkpoint dua, sisi utara taman. Di sini ada musala dan toilet. Jika haus, minumlah beberapa teguk air. Jaga postur: bahu rileks, pandangan ke depan. Lanjutkan ke arah timur menuju zona teduh.' },
      { name: 'Zona Teduh', poi_id: 'P11', coords: at('P11'), radius_m: 20, exercise: 'Peregangan ringan 1 menit', coaching: 'Checkpoint tiga, Zona Teduh. Saatnya peregangan ringan satu menit. Tarik lengan kanan menyilang ke depan dada, tahan sepuluh hitungan, lalu ganti lengan kiri. Kemudian tarik napas empat hitungan dan hembuskan enam hitungan. Ulangi tiga kali.' },
      { name: 'Taman Asia Afrika', poi_id: 'P05', coords: at('P05'), radius_m: 25, exercise: 'Latihan napas 4-6', coaching: 'Checkpoint empat, Taman Asia Afrika. Pandanglah danau dan air mancur di utara. Tarik napas dalam empat hitungan, hembuskan enam hitungan. Rasakan langkah Anda kini lebih ringan. Lanjutkan ke barat lalu ke utara kembali ke titik start.' },
      { name: 'Finish: Titik Start', poi_id: 'P06', coords: at('P06'), radius_m: 25, exercise: 'Pendinginan', coaching: 'Selamat, Anda menyelesaikan Rute Santai Kelilingi Danau! Lakukan pendinginan: tarik tumit ke arah bokong untuk meregangkan paha depan, tahan lima belas hitungan untuk setiap kaki. Jangan lupa minum air.' },
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
      { name: 'Start: Sisi Barat Laut', poi_id: null, coords: ringPoint(135), radius_m: 25, exercise: 'Pemanasan dinamis', coaching: 'Selamat datang di Jogging Lingkar Kiara Artha. Lakukan pemanasan dinamis: angkat lutut bergantian selama tiga puluh detik. Lalu mulai jogging pelan searah jarum jam.' },
      { name: 'Sisi Timur Laut', poi_id: null, coords: ringPoint(40), radius_m: 25, exercise: 'Atur ritme napas', coaching: 'Checkpoint dua, sisi timur laut. Atur ritme napas: tarik napas dua langkah, hembuskan dua langkah. Anda seharusnya masih bisa berbicara dengan nyaman.' },
      { name: 'Sisi Tenggara', poi_id: null, coords: ringPoint(315), radius_m: 25, exercise: 'Postur lari', coaching: 'Checkpoint tiga, sisi tenggara. Periksa postur: badan tegak sedikit condong ke depan, lengan menekuk sembilan puluh derajat, dan mendarat dengan tengah telapak kaki.' },
      { name: 'Sisi Barat Daya', poi_id: null, coords: ringPoint(225), radius_m: 25, exercise: 'Jaga kecepatan', coaching: 'Checkpoint empat, sisi barat daya. Sedikit lagi! Pertahankan kecepatan yang nyaman. Area kuliner ada di sebelah kanan Anda bila ingin beristirahat setelah ini.' },
      { name: 'Finish: Sisi Barat Laut', poi_id: null, coords: ringPoint(135), radius_m: 25, exercise: 'Pendinginan', coaching: 'Satu putaran selesai, kerja bagus! Berjalanlah pelan selama dua menit untuk pendinginan, lalu regangkan betis dengan bertumpu pada dinding atau pohon.' },
    ],
  },
]
for (const t of trails) {
  t.distance_m = Math.round(pathLength(t.path) / 10) * 10
  t.est_minutes = Math.round((t.distance_m / (t.level === 'Santai' ? 70 : 140)) + t.checkpoints.length * 1)
}

// ---------------------------------------------------------------------------
// Badge koleksi stempel (A01)
// ---------------------------------------------------------------------------
const badges = [
  { id: 'B01', name: 'Langkah Pertama', description: 'Kumpulkan stempel pertama Anda.', poi_ids: [], min_count: 1, requires_trail: false, sort_order: 1 },
  { id: 'B02', name: 'Penjelajah Danau', description: 'Kunjungi 4 spot di sekitar danau.', poi_ids: ['P03', 'P05', 'P10', 'P11'], min_count: 4, requires_trail: false, sort_order: 2 },
  { id: 'B03', name: 'Pencicip Kuliner', description: 'Kunjungi area kuliner dan kafe.', poi_ids: ['P08', 'P09'], min_count: 2, requires_trail: false, sort_order: 3 },
  { id: 'B04', name: 'Sahabat Sehat', description: 'Kunjungi 3 spot wellness dan selesaikan satu Wellness Trail.', poi_ids: ['P06', 'P07', 'P11'], min_count: 3, requires_trail: true, sort_order: 4 },
  { id: 'B05', name: 'Penjelajah Sejati', description: 'Kumpulkan seluruh 12 stempel Kiara Artha Park.', poi_ids: pois.map((p) => p.id), min_count: 12, requires_trail: false, sort_order: 5 },
]

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
const version = '2026-11-16'
const dataset = { version, park, categories, pois, trails, badges }
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
  P04: [['VIVA: Kiara Artha Park, Destinasi Wisata Bandung Ala Korea', true], ['Google Maps: Taman Asia Afrika - Kiara Artha Park', true]],
  P05: [['Sejarah KAA 1955 (Museum KAA) — perlu dicek tim', false], ['Pengamatan peta Google Maps', true]],
  P06: [['Orami (30 Sep 2024)', true], ['Asia Property Awards — profil Kiara Artha Park', true]],
  P07: [['Pemkot Bandung — BOSEH', true], ['detikJabar (Mar 2024)', true]],
  P08: [['Orami (30 Sep 2024)', true], ['Google Maps: Ludo Sports Kitchen and Coffee (16 Nov 2026)', true]],
  P09: [['Pengetahuan umum olahraga padel — perlu dicek tim', false], ['Pengetahuan umum olahraga padel — perlu dicek tim', false]],
  P10: [['Ringkasan media (Orami 2024, Republika 2019)', false], ['Hitungan jarak koordinat Google Maps', true]],
  P11: [['Pengetahuan umum kesehatan — perlu dicek tim', false], ['Pengetahuan umum kesehatan — perlu dicek tim', false]],
  P12: [['Google Maps: Mushalla Kiara Artha Park', true], ['Google Maps: "Kamar Cai" dekat parkir — perlu dicek tim', false]],
}

// Keterangan foto yang perlu diambil tim (berkas diunggah ke bucket poi-media)
const PHOTO_CAPTIONS = {
  P01: ['Gerbang barat dari arah Jl. Banten', 'Papan peta zona taman di dekat gerbang'],
  P02: ['Pintu masuk area parkir', 'Jalur pejalan kaki dari parkir ke gerbang'],
  P03: ['Pertunjukan air mancur menari pada malam hari', 'Danau dan air mancur pada siang hari'],
  P04: ['Bangunan bernuansa Korea', 'Detail ornamen dan tulisan Hangeul'],
  P05: ['Spot foto Taman Asia Afrika berlatar danau', 'Sudut foto menghadap air mancur'],
  P06: ['Titik start jogging track', 'Jalur lingkar Jl. Kiara Artha'],
  P07: ['Selter sepeda BOSEH', 'Sepeda dan skuter yang siap disewa'],
  P08: ['Kiara Pelangi Food Court', 'Deretan tenant kuliner'],
  P09: ['Lapangan padel semi-outdoor', 'Area kafe di sekitar lapangan'],
  P10: ['Gerbang Lollipop Playland', 'Wahana bermain anak'],
  P11: ['Bangku teduh di bawah pepohonan', 'Kanopi pohon di sisi timur danau'],
  P12: ['Bangunan musala', 'Toilet umum dan tempat wudu'],
}
const estSeconds = (text) => Math.round(text.split(/\s+/).filter(Boolean).length / 2.6)

const lines = []
lines.push('-- SETARA — isi konten database (dibuat otomatis oleh scripts/build-data.mjs; jangan edit manual)')
lines.push(`-- Versi dataset: ${version}. Mengganti data simulasi dengan data Kiara Artha Park (koordinat Google Maps).`)
lines.push('-- Jalankan SETELAH supabase/migrations/20261116000000_setara_lengkapi_skema.sql')
lines.push('begin;')
lines.push('')
lines.push(`insert into public.park_info (id, data, version) values ('kiara-artha', ${json(park)}, ${q(version)})`)
lines.push('  on conflict (id) do update set data = excluded.data, version = excluded.version, updated_at = now();')
lines.push('')
lines.push('-- Kategori (atribut tampilan)')
for (const c of categories) lines.push(`update public.category set color = ${q(c.color)}, icon = ${q(c.icon)}, sort_order = ${c.sort_order} where id = ${q(c.id)};`)
lines.push('')
lines.push('-- POI: koordinat nyata, radius, konten')
for (const [i, p] of pois.entries()) {
  lines.push(
    `update public.poi set ` +
      [
        `name = ${q(p.name)}`, `short_name = ${q(p.short_name)}`, `category_id = ${q(p.category_id)}`, `zone = ${q(p.location_label)}`,
        `location = ${geog(p.lat, p.lng)}`, `radius_m = ${p.radius_m}`, `description = ${q(p.description)}`,
        `trigger_response = ${q(p.trigger_response)}`, `qr_code = ${q('SETARA:POI:' + p.id)}`, `data_source = 'google_maps'`,
        `is_published = true`, `summary = ${q(p.summary)}`, `narration = ${q(p.narration)}`, `activities = ${arr(p.activities)}`,
        `tips = ${arr(p.tips)}`, `best_times = ${arr(p.best_times)}`, `keywords = ${arr(p.keywords)}`, `art = ${q(p.art)}`,
        `status_note = ${q(p.status_note)}`, `source_place = ${q(p.source)}`, `sort_order = ${i + 1}`,
      ].join(', ') +
      ` where id = ${q(p.id)};`
  )
}
lines.push('')
lines.push('-- Kategori ganda (P09 = Kuliner & Olahraga)')
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
for (const p of pois)
  for (const k of [1, 2])
    lines.push(
      `update public.photo set file_path = ${q(`poi-media/foto/${p.id.toLowerCase()}_${k}.jpg`)}, caption = ${q(PHOTO_CAPTIONS[p.id][k - 1])} where poi_id = ${q(p.id)} and display_order = ${k};`
    )
lines.push('')
lines.push('-- Audio narasi: path di bucket poi-media; durasi = estimasi naskah narasi (TTS dipakai sampai berkas diunggah)')
for (const p of pois)
  lines.push(`update public.audio set file_path = ${q(`poi-media/audio/${p.id.toLowerCase()}.mp3`)}, duration_seconds = ${estSeconds(p.narration)}, language_code = 'id' where poi_id = ${q(p.id)};`)
lines.push('')
lines.push('-- Jam operasional per hari (0 = Minggu … 6 = Sabtu)')
for (const p of pois) {
  for (let d = 0; d < 7; d++) {
    const rule = p.hours.find((h) => h.days.includes(d))
    const note = p.status_note && /jam|Jadwal/i.test(p.status_note) ? p.status_note : 'Jam taman 07.00–21.00 (Google Maps/detikJabar 2024)'
    lines.push(
      rule
        ? `update public.schedule set open_time = ${tq(rule.open)}, close_time = ${tq(rule.close)}, is_closed = false, notes = ${q(note)} where poi_id = ${q(p.id)} and day_of_week = ${d};`
        : `update public.schedule set open_time = null, close_time = null, is_closed = true, notes = 'Tutup' where poi_id = ${q(p.id)} and day_of_week = ${d};`
    )
  }
}
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
lines.push('insert into public.badge (id, name, description, poi_ids, min_count, requires_trail, sort_order) values')
lines.push(badges.map((b) => `  (${q(b.id)}, ${q(b.name)}, ${q(b.description)}, ${arr(b.poi_ids)}, ${b.min_count}, ${b.requires_trail}, ${b.sort_order})`).join(',\n') + ';')
lines.push('commit;')
mkdirSync(resolve(root, 'supabase'), { recursive: true })
writeFileSync(resolve(root, 'supabase/seed.sql'), lines.join('\n') + '\n')

console.log(`poi.json + seed.sql ditulis (${pois.length} POI, ${trails.length} trail, ${badges.length} badge)`)
for (const t of trails) console.log(`  ${t.id} ${t.name}: ${t.distance_m} m, ±${t.est_minutes} menit`)
console.log(close.length ? `  POI < 40 m: ${close.join('; ')}` : '  Semua POI berjarak ≥ 40 m')
