# SETARA · Sekitar Kiara Artha

Pemandu eksplorasi berbasis lokasi untuk pengunjung **Kiara Artha Park, Bandung** — Tugas Besar II4011 Transformasi Digital, Kelompok 07.

Info spot muncul otomatis saat pengunjung mendekat (GPS geofencing, QR sebagai cadangan), lengkap dengan narasi audio, pencarian & navigasi, rekomendasi sesuai waktu, Wellness Trail berpemandu suara, serta koleksi stempel.

## Fitur (pemetaan PRD)

| Req. | Fitur | Lokasi kode |
| --- | --- | --- |
| F01 | Izin & posisi GPS (`watchPosition`, akurasi tinggi, abaikan akurasi > 30 m), titik + lingkaran akurasi di peta | `src/stores/location.js`, `src/components/ParkMap.vue` |
| F02 | Geofence Haversine radius 20–40 m, POI terdekat dipilih, hysteresis radius + 10 m, QR sebagai cadangan | `src/stores/geofence.js`, `src/views/QrScanView.vue` |
| F03 | Kartu POI: ≥2 visual, deskripsi, ≥1 trivia, jam & jadwal, narasi 27–39 detik (putar/jeda/ulang) | `src/views/PoiDetailView.vue`, `src/components/AudioPlayer.vue` |
| F04 | Getar + nada + prompt suara saat trigger, Mode Audio (narasi otomatis), tombol ≥ 48 dp, panduan suara navigasi & trail | `src/lib/audio.js`, `src/components/TriggerSheet.vue` |
| F05 | Cari nama/kata kunci (≥2 huruf), filter 6 kategori, urut jarak, pencarian suara | `src/views/SearchView.vue` |
| F06 | Garis arah, jarak, estimasi waktu, penunjuk arah (kompas), notifikasi "Anda telah tiba", tautan Google Maps | `src/stores/navigation.js`, `src/views/NavigationView.vue` |
| F07 | 2–3 rekomendasi: jarak + belum dikunjungi + slot waktu (pagi/siang/sore/malam) + jadwal atraksi | `src/lib/recommend.js`, `src/components/RecommendationList.vue` |
| F08 | Wellness Trail: 2 rute, 5 checkpoint berpemandu audio, jarak & durasi, jeda/lanjut, stempel penyelesaian | `src/stores/trail.js`, `src/views/TrailView.vue` |
| A01 | Koleksi 14 stempel + 5 badge, ringkasan kunjungan (spot, jarak, durasi), disimpan di ponsel | `src/stores/visits.js`, `src/views/StampsView.vue`, `src/views/SummaryView.vue` |
| A02 | Mode offline **dihapus** (25 Nov 2026). Aplikasi memerlukan internet; `public/sw.js` kini hanya menghapus cache & service worker lama di browser pengguna. Dataset bawaan tetap dipakai bila database belum diperbarui. | `src/main.js`, `public/sw.js` |
| A03 | Penjelasan lokasi sebelum izin, lokasi tidak pernah dikirim ke server, halaman privasi | `src/views/OnboardingView.vue`, `src/views/PrivacyView.vue` |
| Akun | Beranda "Selamat datang di SETARA" sebagai titik masuk; masuk dengan email (Supabase Auth); progres (stempel, bintang, XP, riwayat, trail, preferensi audio) tersinkron per pengguna; keluar akun & kembali ke Beranda dari menu | `src/views/HomeView.vue`, `src/components/AuthSheet.vue`, `src/stores/auth.js` |

### Interaksi dua arah bersama Kia

Pengunjung tidak hanya mendengar; mereka menjawab, beraksi, dan memberi pendapat. Maskot **Kia** (tunas pohon kiara) menjadi teman bicaranya.

| Fitur | Isi | Lokasi kode |
| --- | --- | --- |
| Tantangan di tiap spot | Setelah cerita: kuis 2 soal (salah → Kia memberi penjelasan, boleh coba lagi) → misi di lokasi (konfirmasi, foto, atau aktivitas berpemandu 60 detik; hanya terbuka di radius spot, setelah scan QR, atau Mode Simulasi) → nilai spot 1–5, "Berguna?", laporkan info salah | `src/components/ChallengeSheet.vue`, `QuizPanel.vue`, `MissionPanel.vue`, `RatePanel.vue` |
| Bintang & XP | ⭐ dengar cerita (+10) · ⭐ kuis benar (+20, +5 bila langsung tepat) · ⭐ misi (+30, foto +10) · nilai spot +5 · tanya Kia +2 (maks. 5/hari) · Wellness Trail +50 · kuis trail +20 · tantangan harian +25 | `src/stores/play.js` |
| Kia tumbuh | Level Tunas (0) → Daun (100) → Ranting (250) → Pohon (500) → Kiara Agung (900 XP); gambar Kia berubah tiap level, 5 ekspresi | `src/components/Kia.vue`, `Celebration.vue` |
| Tanya Kia (rule-based) | Jadwal air mancur (hitung mundur), fasilitas terdekat (jarak nyata), buka/tutup sekarang, jarak ke spot, "ada apa di sini", rekomendasi, progres, tantangan, + 11 jawaban dari database; input suara; kotak Cari juga menjawab pertanyaan | `src/lib/kia.js`, `src/components/KiaChat.vue`, `src/views/SearchView.vue` |
| Alasan kembali | Tantangan Hari Ini (7 tantangan bergilir), kunjungan mingguan berturut-turut, ajakan Kia di peta, pengingat terjadwal di APK (opt-in, Sabtu & Minggu 06.30, setiap hari 18.00) | `src/components/KiaNudge.vue`, `src/lib/reminders.js` |
| Badge baru | Penjawab Jitu (kuis 6 spot), Misi Tuntas (misi 6 spot), Juru Foto (3 misi foto), Langganan Taman (3 minggu beruntun) | `scripts/data-interaksi.mjs` |
| Jurnal Kunjungan | Foto misi disimpan hanya di ponsel (IndexedDB), tampil di Ringkasan & detail spot | `src/lib/photoStore.js`, `src/views/SummaryView.vue` |
| Mode tenang | Menyembunyikan ajakan Kia bagi yang hanya ingin panduan audio | `src/components/SideMenu.vue` |

Konten interaksi (narasi gaya Kia, kuis, misi, jawaban Tanya Kia, tantangan harian) ditulis di `scripts/data-interaksi.mjs`; **mohon tim meninjau isinya**.

Layar tambahan untuk tim: **Log Trigger & Uji** (jarak ke tiap POI, waktu fix GPS, skenario jam pagi/sore/malam, ekspor CSV), **Cetak QR Spot**, dan **Mode Simulasi Lokasi** (ketuk peta untuk berpindah — untuk demo di luar taman).

### Akun & sinkronisasi progres

- **Beranda (`#/home`)** adalah titik masuk setiap kali aplikasi dibuka dari awal (tab/aplikasi baru). Pertimbangannya dari sisi pengguna: kunjungan ke taman biasanya berjarak hari, jadi saat membuka aplikasi lagi pengguna disambut, melihat status akun & progres, lalu satu ketukan "Lanjut Jelajah" ke peta (atau "Lanjutkan trail" bila Wellness Trail sedang berjalan). Muat ulang di tab yang sama tetap di halaman yang sama, dan tautan QR (`#/qr/P05`) tetap langsung membuka spotnya.
- **Masuk**: email + kata sandi (daftar, masuk, lupa kata sandi); login Google dihapus. Tanpa akun aplikasi tetap berjalan penuh (mode tamu).
- **Sinkronisasi**: saat masuk, progres tamu di ponsel **digabung** dengan progres akun (stempel digabung, XP diambil yang tertinggi, bintang per spot digabung), lalu setiap perubahan disimpan otomatis (jeda 2,5 detik; antre saat offline). Disimpan di tabel `setara_progress` (RLS: hanya pemilik). Selama migrasi belum dijalankan, progres sementara disimpan di `user_metadata` akun.
- **Keluar**: dari Beranda atau menu samping. Progres disimpan dulu, lalu ponsel kembali ke mode tamu. Lokasi GPS dan foto Jurnal **tidak pernah** disinkronkan; umpan balik anonim tetap memakai klien tanpa sesi.

**Langkah di Supabase Dashboard (sekali saja):**

1. *SQL Editor*: jalankan `supabase/migrations/20261124000000_setara_akun_pengguna.sql`, lalu `supabase/seed.sql` (versi data 2026-11-24). Sebelum seed dijalankan, aplikasi otomatis memakai dataset bawaan yang lebih baru.
2. *Authentication → URL Configuration*: Site URL `https://japrulll.github.io/Tubes-Transdig-K07/`; Redirect URLs tambahkan URL tersebut dan `http://localhost:5173/`.
3. *Authentication → Sign In / Providers → Email*: matikan **Confirm email** (`mailer_autoconfirm: true`). Pendaftaran cukup nama, email, dan kata sandi; pengguna langsung masuk tanpa kode atau tautan verifikasi. Akun lama yang terlanjur belum terkonfirmasi diaktifkan sekali lewat *SQL Editor*: `update auth.users set email_confirmed_at = now() where email_confirmed_at is null;`


## Menjalankan

```bash
npm install
npm run dev          # http://localhost:5173 (juga terbuka di jaringan lokal)
npm run build        # hasil di dist/
```

Geolocation dan kamera hanya berjalan di **HTTPS** (atau `localhost`). Untuk uji di ponsel gunakan GitHub Pages atau `.apk`.

## Deploy

- **GitHub Pages (HTTPS):** aktifkan *Settings → Pages → Source: GitHub Actions*; setiap push ke `main` menjalankan `.github/workflows/deploy-pages.yml`. URL: `https://japrulll.github.io/Tubes-Transdig-K07/`.
- **APK Android:** workflow `.github/workflows/build-apk.yml` membangun `app-debug.apk` (tab *Actions → Artifacts*). Secara lokal: `npm run build && npx cap sync android`, lalu buka folder `android/` di Android Studio.

## Data & Supabase

Sumber data tunggal ada di `scripts/build-data.mjs` (16 POI, kategori, trail, badge) dan `scripts/data-interaksi.mjs` (narasi Kia, kuis, misi, Tanya Kia, tantangan). Jalankan `npm run data` untuk menghasilkan:

- `src/data/poi.json` — dataset bawaan aplikasi (dipakai selama database Supabase belum menjalankan seed terbaru)
- `supabase/seed.sql` — isi database yang sama

Database Supabase (proyek `diyjdxwjuparfmdrqxcp`) memakai skema tim (`poi`, `category`, `poi_category`, `trivia`, `photo`, `audio`, `schedule`, PostGIS) yang dilengkapi secara aditif oleh `supabase/migrations/20261116000000_setara_lengkapi_skema.sql`:

- kolom konten baru di `poi` (narasi, ringkasan, aktivitas, tips, slot waktu, kata kunci)
- tabel `poi_event` (jadwal air mancur), `wellness_trail`, `trail_checkpoint`, `badge`, `park_info`
- RPC `get_app_content()` (dibaca aplikasi) dan `pois_within(lat, lng, m)` (validasi spasial tim, ST_DWithin)
- bucket publik **`poi-media`**

Migrasi `supabase/migrations/20261119000000_setara_interaksi_dua_arah.sql` (sudah diterapkan, aditif) menambahkan:

- konten interaksi (hanya-baca): `quiz_question`, `mission`, `kia_faq`, `daily_challenge`, kolom `badge.kind`; semuanya ikut dikirim oleh `get_app_content()`
- umpan balik **anonim & hanya-tulis**: `visitor_rating`, `content_report`, `quiz_result`, `kia_question_log` (tanpa akun, tanpa ID perangkat, tanpa lokasi; aplikasi tidak bisa membaca kembali). Rekap untuk laporan tim: view `feedback_summary` (dibuka dari dashboard).

Aplikasi membaca konten dengan kunci *publishable* (RLS hanya-baca). Isi database sebelum pembaruan disimpan di `supabase/backup/20261116_sebelum_update_rollback.sql`.

### Menambahkan foto

Foto **dibundel di aplikasi** agar cepat dimuat: taruh berkas di `media-inbox/` (nama `p05_1.jpg`, `onboarding_1.jpg`, `t01.jpg`, …), lalu jalankan `npm run media`. Petunjuk lengkap, kredit, dan aturan izin foto ada di [`media-inbox/README.md`](media-inbox/README.md). Slot tanpa foto memakai ilustrasi. Kolom `caption` di tabel `photo` berisi foto yang perlu diambil.

Narasi rekaman (opsional) tetap bisa diunggah ke bucket `poi-media` sesuai `file_path` di tabel `audio` (mis. `audio/p03.mp3`); selama belum ada, narasi dibacakan TTS dari kolom `poi.narration`.

## Koordinat POI (Google Maps 16 Nov 2026; OpenStreetMap & Google Maps 24 Nov 2026)

| No. | ID | POI | Acuan | Lat, Lng | Radius |
| --- | --- | --- | --- | --- | --- |
| 1 | P01 | Pintu Utama | Google Maps: "Gerbang Barat Taman Kiara Artha" | -6.9161917, 107.6407033 | 25 m |
| 2 | P18 | Loket Tiket Masuk | Google Maps: plus code 3JMR+HMC (diakses 25 Nov 2026); OpenStreetMap: Kiara Artha Park sign | -6.9160625, 107.6416406 | 20 m |
| 3 | P07 | Papa Skuter | Google Maps: "Papa Skuter" (plus code 3JMR+FM, diakses 25 Nov 2026); OpenStreetMap: Papa Skuter (bicycle_rental) | -6.9163125, 107.6416875 | 20 m |
| 4 | P05 | Taman Asia Afrika | Google Maps: "Taman Asia Afrika - Kiara Artha Park" | -6.9166173, 107.6421607 | 25 m |
| 5 | P08 | Food Court 1 | Google Maps: "Pelangi Graha Park" | -6.9170555, 107.6417750 | 30 m |
| 6 | P03 | Danau & Air Mancur | Google Maps: "Dancing Fountain" | -6.9160874, 107.6422657 | 40 m |
| 7 | P15 | Food Court 2 | OpenStreetMap: Steak Ranjang, Siloka, Pang Waffle, RD Coffee & Eatery (Jl. H. Ibrahim Adjie) | -6.9164900, 107.6435100 | 30 m |
| 8 | P14 | Gerbang Timur | OpenStreetMap: halte "Gerbang Timur Kiara Artha Park", Jl. H. Ibrahim Adjie | -6.9161500, 107.6437000 | 25 m |
| 9 | P11 | Zona Relaksasi | Google Maps (citra satelit): titik di bawah kanopi pohon, timur danau | -6.9159300, 107.6431120 | 20 m |
| 10 | P09 | Kafe & Padel | Google Maps: "Padel Co. Semi Outdoor" | -6.9149564, 107.6422184 | 30 m |
| 11 | P10 | Musala & Toilet | Google Maps: "Mushalla Kiara Artha Park" | -6.9151658, 107.6421597 | 20 m |
| 12 | P06 | Start Jogging Track | Google Maps: "Jogging Track Kiara Artha Park" | -6.9152676, 107.6417524 | 25 m |
| 13 | P13 | Gerbang Utara | OpenStreetMap: halte "Gerbang Utara Kiara Artha Park", Jl. Jakarta; Google Maps: Jl. Kiara Artha Utara | -6.9142000, 107.6412800 | 25 m |
| 14 | P02 | Gerbang Parkir | Google Maps: "Kiara Artha Parking Lot" | -6.9154692, 107.6411222 | 25 m |
| 15 | P17 | Rest Area 78 | Google Maps: tenan Rest Area 78 (diakses 25 Nov 2026); OpenStreetMap: Gubuk Makan Mang Engking | -6.9153000, 107.6408000 | 30 m |
| 16 | P16 | Masjid Al-Maleeq | Google Maps: "Masjid Al-Maleeq" (plus code 3JMR+J7, diakses 25 Nov 2026) | -6.9159375, 107.6406875 | 20 m |

P04 (Area Tematik Asia / Kampung Korea) dan Lolipops Playland **sudah tidak ada** dan dihapus dari aplikasi. Musala & Toilet pindah dari ID P12 ke P10 (25 Nov 2026). Semua ID lama dipetakan di `src/lib/poiIds.js`: QR/tautan `#/qr/P12`, stempel, dan bintang lama otomatis menjadi P10; kode P04 menampilkan pesan bahwa spot sudah tutup. P07 tetap memakai ID yang sama walau isinya berganti dari Selter BOSEH ke Papa Skuter, dan Rest Area 78 memakai ID baru P17 (ID lama P04/P12 tidak dipakai ulang). Nomor spot (1–16) mengikuti urutan array `pois` di `scripts/build-data.mjs`, yaitu rute keliling: masuk dari barat, ke selatan danau, timur, utara, lalu barat laut. Nomor ini yang tampil di peta, Stempel, kartu spot, halaman detail, cetak QR, dan input kode manual. ID (P01…P18) hanya dipakai di belakang layar untuk QR dan progres.

## Change Log

| Versi | Tanggal | Perubahan | Alasan |
| --- | --- | --- | --- |
| 1.0 | Week 9 | Baseline PRD | — |
| 1.1 | 16 Nov 2026 | Koordinat simulasi diganti koordinat Google Maps; radius P03 30 → 40 m, P06 30 → 25 m, P10 30 → 25 m, P04 25 → 30 m, P07/P11/P12 → 20 m | Mengikuti PRD §4.1 |
| 1.1 | 16 Nov 2026 | P04–P07 berjarak 21 m dan P09–P12 berjarak 24 m (< 40 m) | Posisi nyata di Google Maps; aturan "POI terdekat dipilih" menangani radius yang tumpang tindih. Validasi saat survei. |
| 1.1 | 16 Nov 2026 | Google Maps menandai Kampung Korea (P04) tutup permanen | Perlu dikonfirmasi saat survei lapangan |
| 1.1 | 16 Nov 2026 | Tile peta memakai OpenStreetMap | Tile CARTO kini memerlukan API key |
| 1.2 | 19 Nov 2026 | Interaksi dua arah: maskot Kia, kuis/misi/nilai per spot, bintang & XP, Tanya Kia offline, Tantangan Hari Ini, kunjungan mingguan, pengingat APK, umpan balik anonim, Jurnal Kunjungan | Pengunjung terdorong aktif menggunakan aplikasi, bukan hanya mendengar |
| 1.2 | 19 Nov 2026 | Narasi & panduan trail memakai suara Kia (aku–kamu, sapaan Sunda) | Konsisten dengan karakter maskot |
| 1.2 | 19 Nov 2026 | Foto dibundel di aplikasi lewat `npm run media`; belum ada foto berlisensi terbuka untuk 12 spot | Foto web yang ada berhak cipta; tim akan menyediakan foto sendiri |
| 1.3 | 24 Nov 2026 | Akun pengguna: masuk Google/email, progres tersinkron per pengguna (`setara_progress`, RLS), keluar akun | Progres tidak hilang saat ganti ponsel; data pengguna tersimpan di akunnya |
| 1.3 | 24 Nov 2026 | Beranda "Selamat datang di SETARA" jadi titik masuk saat aplikasi dibuka; menu Beranda & Keluar di menu samping | Pengguna kembali ke halaman utama, lalu satu ketukan ke peta |
| 1.3 | 24 Nov 2026 | Hapus P04 Kampung Korea & P10 Lolipops; tambah P13 Gerbang Utara, P14 Gerbang Timur, P15 Food Court 2, P16 Masjid Al-Maleeq; badge B02/B03/B05 disesuaikan | Kondisi lapangan terbaru (Kampung Korea & Lolipops sudah tidak ada) |
| 1.3 | 24 Nov 2026 | Koordinat P16 diperkirakan (belum ada di OSM) | Validasi saat survei lapangan |
| 1.4 | 25 Nov 2026 | Musala & Toilet P12 → P10; ID lama tetap dikenali (QR, stempel, progres akun); kode P04 menampilkan pesan | Tanya Kia sempat macet dan QR P12 tidak terbaca setelah pergantian ID |
| 1.4 | 25 Nov 2026 | Mode offline & login Google dihapus | Disederhanakan; provider Google tidak diaktifkan |
| 1.4 | 25 Nov 2026 | Family POI (`src/lib/families.js`): pencarian & Tanya Kia mengelompokkan spot sejenis (mis. "musala" → Musala & Toilet + Masjid Al-Maleeq) | Spot sejenis tidak terlewat |
| 1.4 | 25 Nov 2026 | Selama navigasi & Wellness Trail, spot yang dilewati hanya dicatat stempelnya (tanpa kartu, suara, atau ajakan rating) | Kartu spot memotong panduan checkpoint dan menumpuk di layar "Anda telah tiba" |
| 1.4 | 25 Nov 2026 | Aturan Tanya Kia diperluas: konser/acara, biaya parkir & nonton air mancur, darurat, barang hilang, hujan, wifi, ATM, aksesibilitas, daftar spot | "Tiket konser" sempat dijawab dengan harga tiket masuk taman |
| 1.5 | 25 Nov 2026 | P07 Selter BOSEH diganti Rental Skuter Papa Skuter (plus code 3JMR+FM); kategori Keluarga; badge B04 memakai P06, P09, P11 | Selter BOSEH diganti persewaan skuter yang ada di lapangan |
| 1.5 | 25 Nov 2026 | Tambah P17 Rest Area 78 (kuliner); badge B03 menjadi 2 dari 4 area kuliner | Deretan restoran & kafe di Jl. Banten No. 78 |
| 1.5 | 25 Nov 2026 | Koordinat P16 dari plus code 3JMR+J7; foto baru untuk P06, P07, P09, P13–P17 | Data lapangan dari tim |
| 1.6 | 25 Nov 2026 | Tambah P18 Loket Tiket Masuk (plus code 3JMR+HMC; papan harga Rp10.000, usia 6+) | Titik pembelian tiket di dalam taman |
| 1.6 | 25 Nov 2026 | Spot diurutkan ulang sebagai rute keliling; nomor spot (1–16) dipakai di semua halaman, bukan ID; satu nama per spot (`name` = `short_name`) | Penomoran & nama di Stempel sempat berbeda dengan peta |
| 1.6 | 25 Nov 2026 | Foto P02 Gerbang Parkir, P11 Zona Relaksasi, P18 Loket Tiket; semua 16 spot kini berfoto | Data lapangan dari tim |
| 1.7 | 25 Nov 2026 | Tanya Kia: aturan keselamatan dicek paling awal dan memakai kombinasi kata (kata "hilang/tersesat/terpisah/ketinggalan…" + orang atau barang), sehingga "anak saya hilang harus ke mana?" dan "barang saya hilang" terjawab; jawaban berisi langkah, nomor 110/112/119, kontak pengelola, dan tombol arah ke Loket Tiket | DF-03: kalimat dengan kata sisipan ("anak **saya** hilang") sebelumnya jatuh ke jawaban cadangan |

## Teknologi

Vue 3 + Vite, Tailwind CSS 4, Leaflet + OpenStreetMap, Supabase (PostgreSQL + PostGIS), Web Speech API (TTS + pengenalan suara), Vibration API, IndexedDB, html5-qrcode, Service Worker, Capacitor (Android/iOS, Local Notifications), sharp (impor foto).
