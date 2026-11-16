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
| A01 | Koleksi 12 stempel + 5 badge, ringkasan kunjungan (spot, jarak, durasi), disimpan di ponsel | `src/stores/visits.js`, `src/views/StampsView.vue`, `src/views/SummaryView.vue` |
| A02 | Mode offline: dataset bawaan + cache konten + service worker (aplikasi, tile peta, font) | `src/data/poi.json`, `public/sw.js` |
| A03 | Penjelasan lokasi sebelum izin, lokasi tidak pernah dikirim ke server, halaman privasi | `src/views/OnboardingView.vue`, `src/views/PrivacyView.vue` |

Layar tambahan untuk tim: **Log Trigger & Uji** (jarak ke tiap POI, waktu fix GPS, skenario jam pagi/sore/malam, ekspor CSV), **Cetak QR Spot**, dan **Mode Simulasi Lokasi** (ketuk peta untuk berpindah — untuk demo di luar taman).

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

Sumber data tunggal ada di `scripts/build-data.mjs` (12 POI, kategori, trail, badge). Jalankan `node scripts/build-data.mjs` untuk menghasilkan:

- `src/data/poi.json` — dataset bawaan aplikasi (dipakai saat offline/pertama kali dibuka)
- `supabase/seed.sql` — isi database yang sama

Database Supabase (proyek `diyjdxwjuparfmdrqxcp`) memakai skema tim (`poi`, `category`, `poi_category`, `trivia`, `photo`, `audio`, `schedule`, PostGIS) yang dilengkapi secara aditif oleh `supabase/migrations/20261116000000_setara_lengkapi_skema.sql`:

- kolom konten baru di `poi` (narasi, ringkasan, aktivitas, tips, slot waktu, kata kunci)
- tabel `poi_event` (jadwal air mancur), `wellness_trail`, `trail_checkpoint`, `badge`, `park_info`
- RPC `get_app_content()` (dibaca aplikasi) dan `pois_within(lat, lng, m)` (validasi spasial tim, ST_DWithin)
- bucket publik **`poi-media`**

Aplikasi membaca konten dengan kunci *publishable* (RLS hanya-baca). Isi database sebelum pembaruan disimpan di `supabase/backup/20261116_sebelum_update_rollback.sql`.

### Mengunggah foto & narasi survei

Unggah berkas ke bucket `poi-media` sesuai `file_path` di tabel `photo`/`audio`, contoh `foto/p03_1.jpg` dan `audio/p03.mp3`. Aplikasi otomatis memakainya; selama berkas belum ada, ditampilkan ilustrasi dan narasi dibacakan dengan suara (TTS) dari kolom `poi.narration`. Kolom `caption` di tabel `photo` berisi foto yang perlu diambil.

## Koordinat POI (Google Maps, diakses 16 Nov 2026)

| ID | POI | Acuan Google Maps | Lat, Lng | Radius |
| --- | --- | --- | --- | --- |
| P01 | Pintu Utama | Gerbang Barat Taman Kiara Artha | -6.9161917, 107.6407033 | 25 m |
| P02 | Gerbang Area Parkir | Kiara Artha Parking Lot | -6.9154692, 107.6411222 | 25 m |
| P03 | Danau & Air Mancur Menari | Dancing Fountain | -6.9160874, 107.6422657 | 40 m |
| P04 | Area Tematik Asia | KAMPUNG KOREA BANDUNG | -6.9156793, 107.6406188 | 30 m |
| P05 | Spot Foto Ikonik | Taman Asia Afrika - Kiara Artha Park | -6.9166173, 107.6421607 | 25 m |
| P06 | Titik Start Jogging Track | Jogging Track Kiara Artha Park | -6.9152676, 107.6417524 | 25 m |
| P07 | Selter Sepeda BOSEH | Stasiun Boseh Kiara Artha Park | -6.9156690, 107.6408092 | 20 m |
| P08 | Area Kuliner / Food Court | Pelangi Graha Park (Kiara Pelangi) | -6.9170555, 107.6417750 | 30 m |
| P09 | Area Kafe & Lapangan Padel | Padel Co. Semi Outdoor | -6.9149564, 107.6422184 | 30 m |
| P10 | Area Bermain Anak | Lolipops Playland and Cafe | -6.9164994, 107.6428604 | 25 m |
| P11 | Zona Relaksasi / Spot Teduh | Citra satelit (kanopi pohon timur danau) | -6.9159300, 107.6431120 | 20 m |
| P12 | Musala & Toilet | Mushalla Kiara Artha Park | -6.9151658, 107.6421597 | 20 m |

## Change Log

| Versi | Tanggal | Perubahan | Alasan |
| --- | --- | --- | --- |
| 1.0 | Week 9 | Baseline PRD | — |
| 1.1 | 16 Nov 2026 | Koordinat simulasi diganti koordinat Google Maps; radius P03 30 → 40 m, P06 30 → 25 m, P10 30 → 25 m, P04 25 → 30 m, P07/P11/P12 → 20 m | Mengikuti PRD §4.1 |
| 1.1 | 16 Nov 2026 | P04–P07 berjarak 21 m dan P09–P12 berjarak 24 m (< 40 m) | Posisi nyata di Google Maps; aturan "POI terdekat dipilih" menangani radius yang tumpang tindih. Validasi saat survei. |
| 1.1 | 16 Nov 2026 | Google Maps menandai Kampung Korea (P04) tutup permanen | Perlu dikonfirmasi saat survei lapangan |
| 1.1 | 16 Nov 2026 | Tile peta memakai OpenStreetMap | Tile CARTO kini memerlukan API key |

## Teknologi

Vue 3 + Vite, Tailwind CSS 4, Leaflet + OpenStreetMap, Supabase (PostgreSQL + PostGIS), Web Speech API, Vibration API, html5-qrcode, Service Worker, Capacitor (Android/iOS).
