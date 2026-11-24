// Konten interaksi dua arah SETARA (dipakai oleh scripts/build-data.mjs):
// narasi bergaya Kia (aku–kamu), kuis, misi, kuis trail, jawaban Tanya Kia, dan tantangan harian.
// Semua fakta diambil dari konten spot yang sudah ada (deskripsi, trivia, tips) — tidak ada fakta baru.
// Pada kuis, opsi PERTAMA selalu jawaban benar; urutan diacak saat build.

// ---------------------------------------------------------------------------
// Narasi spot dalam suara Kia
// ---------------------------------------------------------------------------
export const NARASI = {
  P01: 'Wilujeng sumping di Kiara Artha Park! Aku Kia, teman jelajahmu. Kamu sekarang di gerbang barat, sisi Jalan Banten. Taman ini diresmikan tanggal tujuh belas Agustus dua ribu sembilan belas, dan sekarang jadi salah satu ruang publik favorit warga Bandung. Tata letaknya melingkar, lho. Di tengah ada danau dengan air mancur menari. Di sisi utara ada titik start jogging track dan musala. Di sisi timur ada Food Court 2, dan area kuliner utama di sisi selatan. Ikuti jalur pejalan kaki ke timur untuk sampai di lingkar taman. Nanti aku sapa lagi setiap kamu dekat spot seru. Oh iya, di tiap spot ada kuis dan misi kecil. Kumpulkan bintangnya, ya!',
  P02: 'Halo, selamat datang! Kamu ada di gerbang area parkir, sisi barat laut taman. Mau ke Pintu Utama? Jalan saja sekitar sembilan puluh meter ke selatan. Kalau mau langsung olahraga, titik start jogging track ada di sebelah timur, dekat musala dan toilet. Selter sepeda BOSEH juga dekat dari sini. Sebelum jalan, ingat-ingat dulu lokasi kendaraanmu, ya. Itu misi pertamamu di sini!',
  P03: 'Kamu sampai di tepi danau, jantung Kiara Artha Park! Di tengah danau inilah air mancur menari tampil setiap malam. Pertunjukannya biasanya mulai jam setengah tujuh malam sampai setengah sembilan, dengan tema berbeda tiap jam. Semburan airnya bergerak mengikuti musik dan disinari lampu warna-warni. Coba lihat ke tepi utara danau. Ada patung dua tangan yang berjabat, namanya Friendship Shake Hand, simbol persahabatan. Kalau kamu datang siang, nikmati angin di tepi danau dulu, lalu balik lagi saat matahari terbenam. Bisa temukan patungnya? Itu misimu!',
  P05: 'Wilujeng sumping di Taman Asia Afrika, spot foto paling ikonik di Kiara Artha Park! Namanya mengingatkan kita pada Konferensi Asia Afrika tahun seribu sembilan ratus lima puluh lima, waktu pemimpin dua puluh sembilan negara berkumpul di Gedung Merdeka, Bandung. Dari sini, danau dan air mancur menari kelihatan utuh. Untuk foto terbaik, menghadaplah ke utara. Pagi hari cahayanya lembut dari samping, malam hari air mancurnya warna-warni. Siapkan gaya terbaikmu, lalu simpan fotonya di Jurnal Kunjungan!',
  P06: 'Kamu di titik start jogging track! Jalur di depanmu mengikuti lingkar Jalan Kiara Artha yang mengelilingi danau, kira-kira tujuh ratus lima puluh meter satu putaran. Sebelum mulai, yuk pemanasan tiga sampai lima menit: putar pergelangan kaki, ayunkan lengan, lalu jalan di tempat. Mau dipandu? Mulai Wellness Trail dari menu Trail, nanti aku temani di setiap checkpoint dan catat jarak serta durasimu. Ayo, pemanasan bareng aku dulu!',
  P07: 'Ini Selter Sepeda BOSEH, singkatan dari Bike on the Street Everybody Happy, program sepeda sewa Pemerintah Kota Bandung. Cara sewanya gampang: daftar pakai kartu identitas di petugas atau aplikasi BOSEH, lalu pilih sepeda yang tersedia. Tarif resminya mulai seribu rupiah untuk jam pertama. Di dalam taman juga ada sewa sepeda dan skuter listrik, sekitar tiga puluh sampai empat puluh ribu rupiah. Rute favorit: lingkar Jalan Kiara Artha mengelilingi danau. Tetap utamakan pejalan kaki, ya!',
  P08: 'Kamu tiba di Area Kuliner! Di kawasan Kiara Pelangi ini ada food court dengan banyak tenant, dari makanan berat sampai jajanan dan minuman segar. Di sekitarnya ada kafe populer seperti Ludo Sports Kitchen and Coffee dan Monday Co. Menariknya, paket Kiara Pelangi Food Court disebut sudah termasuk akses menonton air mancur menari, jadi kamu bisa makan malam sambil menunggu pertunjukan. Jam buka tiap tenant beda-beda, cek papan info di lokasi, ya. Selamat makan, dan jangan lupa foto menu favoritmu!',
  P09: 'Kamu ada di Area Kafe dan Lapangan Padel, sisi utara taman. Tahu nggak, padel lahir di Meksiko tahun seribu sembilan ratus enam puluh sembilan? Mainnya mirip tenis, tapi lapangannya lebih kecil, dikelilingi dinding kaca, dan bolanya boleh memantul ke dinding. Lapangan semi-outdoor di sini bisa dipesan langsung ke pengelola. Kalau cuma mau santai, kafe di sekitarnya pas untuk minum sambil nonton pertandingan. Coba tonton satu reli sampai selesai, deh!',
  P11: 'Selamat datang di Zona Teduh, di bawah kanopi pepohonan sisi timur danau. Yuk, berhenti sebentar bareng aku. Berdiri dengan nyaman atau duduk di bangku terdekat. Tarik napas pelan lewat hidung, empat hitungan. Tahan sebentar. Lalu hembuskan pelan lewat mulut, enam hitungan. Ulangi tiga kali. Sekarang angkat kedua bahu ke arah telinga, tahan, lalu lepaskan. Putar leher pelan ke kiri dan ke kanan. Rasakan udara yang lebih sejuk di bawah pohon ini. Kalau sudah siap, lanjutkan perjalananmu dengan langkah yang lebih ringan.',
  P12: 'Kamu di area Musala dan Toilet, fasilitas umum utama di sisi utara taman. Di sini ada musala, tempat wudu, dan toilet umum. Menjelang magrib musala biasanya ramai, jadi datang beberapa menit lebih awal, ya. Simpan alas kaki di rak yang tersedia dan bantu jaga kebersihan bareng-bareng. Setelah ini, kamu bisa lanjut ke titik start jogging track di sebelah barat, atau ke danau dan air mancur di selatan. Hatur nuhun sudah ikut menjaga taman!',
  P13: 'Halo, selamat datang dari sisi utara! Kamu di Gerbang Utara, dekat halte bus di Jalan Jakarta. Jalan lurus saja ke selatan lewat Jalan Kiara Artha Utara, kira-kira seratus meter, sampai ketemu lingkar taman. Di sana ada lapangan padel, titik start jogging track, juga musala dan toilet. Hati-hati menyeberang, ya, Jalan Jakarta ramai. Begitu sampai di lingkar taman, aku sapa lagi. Misi pertamamu: hitung berapa langkah sampai ke lingkar taman!',
  P14: 'Wilujeng sumping dari sisi timur! Kamu di Gerbang Timur, menghadap Jalan Ibrahim Adjie, arah Kiaracondong. Tepat di sebelah selatanmu ada Food Court 2, deretan kafe dan resto kayak Steak Ranjang dan Pang Waffle. Kalau lurus ke barat, kamu ketemu Zona Teduh lalu danau dengan air mancur menari. Malam hari, pertunjukannya mulai jam setengah tujuh. Oh iya, halte bus di depan gerbang ini namanya juga Gerbang Timur, jadi gampang dijadikan patokan pulang. Yuk, masuk pelan-pelan dan nikmati tamannya!',
  P15: 'Kamu tiba di Food Court 2, sisi timur taman! Di bangunan memanjang ini ada Steak Ranjang, Siloka, Pang Waffle, dan RD Coffee and Eatery. Mau makan berat, jajan manis, atau sekadar ngopi, semuanya ada. Jam buka tiap tenan beda-beda, jadi cek papan di depannya, ya. Habis makan, jalan ke barat sekitar seratus empat puluh meter untuk sampai di danau. Pas banget kalau mau nonton air mancur menari malam nanti!',
  P16: 'Assalamualaikum! Kamu di dekat Masjid Al-Maleeq, di sisi barat kawasan Kiara Artha, dekat Jalan Banten. Kalau sudah masuk waktu salat, kamu bisa beribadah di sini sebelum lanjut menjelajah. Simpan alas kaki di tempatnya dan jaga kebersihan, ya. Kalau sedang di sisi utara taman, ada juga musala dekat Layana Hall. Menjelang magrib biasanya ramai, jadi datang sedikit lebih awal. Setelah salat, Pintu Utama dan Selter BOSEH ada tidak jauh di sebelah selatan dan timur, siap jadi titik awal jelajahmu berikutnya.',
}

// ---------------------------------------------------------------------------
// Kuis per spot (2 soal). options[0] = jawaban benar.
// ---------------------------------------------------------------------------
export const KUIS = {
  P01: [
    { q: 'Kapan Kiara Artha Park diresmikan?', options: ['17 Agustus 2019', '1 Januari 2020', '17 Agustus 2015', '24 April 2019'], explain: 'Taman ini diresmikan 17 Agustus 2019, bertepatan dengan HUT ke-74 Republik Indonesia.' },
    { q: 'Kiara Artha Park berada di antara dua flyover. Flyover apa saja?', options: ['Antapani dan Kiaracondong', 'Pasupati dan Cimindi', 'Pelangi dan Pasupati', 'Cimindi dan Antapani'], explain: 'Taman ini terletak di antara flyover Antapani dan flyover Kiaracondong, Kelurahan Kebonwaru.' },
  ],
  P02: [
    { q: 'Berapa tiket masuk per orang menurut detikJabar (2024)?', options: ['Rp10.000', 'Rp5.000', 'Rp25.000', 'Gratis'], explain: 'Tiket tercatat Rp10.000 per orang, hari kerja maupun akhir pekan. Cek lagi di loket karena harga bisa berubah.' },
    { q: 'Dari gerbang parkir, ke arah mana Pintu Utama?', options: ['Selatan, sekitar 90 m', 'Utara, sekitar 300 m', 'Timur, sekitar 500 m', 'Di seberang Jl. Banten'], explain: 'Pintu Utama ada sekitar 90 meter ke arah selatan dari gerbang parkir.' },
  ],
  P03: [
    { q: 'Jam berapa pertunjukan air mancur menari biasanya dimulai?', options: ['18.30', '16.00', '21.00', '12.00'], explain: 'Pertunjukan umumnya mulai pukul 18.30 sampai 20.30, dengan pertunjukan berbeda tiap jam (Orami, 2024).' },
    { q: 'Apa nama patung jabat tangan di tepi utara danau?', options: ['Friendship Shake Hand', 'Tugu Asia Afrika', 'Monumen Persahabatan', 'Patung Merdeka'], explain: 'Patung Friendship Shake Hand menggambarkan jabat tangan persahabatan, sejalan dengan semangat Asia Afrika.' },
  ],
  P05: [
    { q: 'Konferensi Asia Afrika 1955 digelar di gedung apa di Bandung?', options: ['Gedung Merdeka', 'Gedung Sate', 'Gedung Pakuan', 'Layana Hall'], explain: 'KAA digelar di Gedung Merdeka, Bandung, 18–24 April 1955.' },
    { q: 'Berapa negara yang hadir di Konferensi Asia Afrika 1955?', options: ['29 negara', '10 negara', '55 negara', '100 negara'], explain: 'Konferensi Asia Afrika 1955 dihadiri 29 negara.' },
  ],
  P06: [
    { q: 'Kira-kira berapa panjang satu putaran jalur lingkar taman?', options: ['±750 m', '±2 km', '±200 m', '±5 km'], explain: 'Jalur lingkar Jl. Kiara Artha sekitar 750 meter per putaran.' },
    { q: 'Acara lari apa yang pernah digelar di Kiara Artha Park?', options: ['Pocari Run 2025', 'Jakarta Marathon', 'Borobudur Marathon', 'Tour de Bandung'], explain: 'Kiara Artha Park pernah menjadi tuan rumah acara lari Pocari Run 2025.' },
  ],
  P07: [
    { q: 'BOSEH adalah singkatan dari…', options: ['Bike on the Street Everybody Happy', 'Bandung Ongkos Sepeda Hemat', 'Bike Of Smart Eco Hub', 'Bersepeda Olahraga Sehat'], explain: 'BOSEH = Bike on the Street Everybody Happy, program sepeda sewa Pemkot Bandung.' },
    { q: 'Berapa tarif resmi BOSEH untuk jam pertama?', options: ['Rp1.000', 'Rp10.000', 'Rp30.000', 'Rp50.000'], explain: 'Tarif resmi BOSEH tercatat Rp1.000 untuk jam pertama dan Rp2.000 untuk jam berikutnya.' },
  ],
  P08: [
    { q: 'Paket Kiara Pelangi Food Court Rp35.000 disebut sudah termasuk apa?', options: ['Akses menonton air mancur menari', 'Sewa sepeda satu jam', 'Parkir gratis', 'Tiket masuk taman'], explain: 'Paketnya disebut sudah termasuk akses menonton air mancur menari (Orami, 2024).' },
    { q: 'Kafe dekat area ini yang punya rating 4,8 dengan lebih dari seribu ulasan di Google Maps?', options: ['Ludo Sports Kitchen and Coffee', 'Kopi Kiara', 'Padel Co.', 'Kopi Taman Kota'], explain: 'Ludo Sports Kitchen and Coffee punya lebih dari seribu ulasan dengan rating 4,8.' },
  ],
  P09: [
    { q: 'Di negara mana olahraga padel lahir?', options: ['Meksiko', 'Spanyol', 'Inggris', 'Brasil'], explain: 'Padel lahir di Acapulco, Meksiko, pada 1969.' },
    { q: 'Apa yang membedakan padel dari tenis?', options: ['Bola boleh memantul ke dinding', 'Dimainkan tanpa raket', 'Lapangan tanpa net', 'Dimainkan sendirian'], explain: 'Dalam padel, bola boleh memantul ke dinding kaca sebelum dipukul kembali.' },
  ],
  P11: [
    { q: 'Pola napas apa yang Kia ajak latih di Zona Teduh?', options: ['Tarik 4 hitungan, hembuskan 6', 'Tarik 10, tahan 10', 'Napas cepat 20 kali', 'Tahan napas 1 menit'], explain: 'Menghembuskan napas lebih panjang (6) daripada menarik (4) membantu menenangkan detak jantung.' },
    { q: 'Mengapa udara di bawah kanopi pohon terasa lebih sejuk?', options: ['Kanopi menaungi dari terik matahari', 'Ada pendingin udara', 'Karena dekat parkiran', 'Karena tanahnya basah'], explain: 'Kanopi pohon menaungi area di bawahnya sehingga terasa lebih sejuk dibanding area terbuka.' },
  ],
  P12: [
    { q: 'Musala Kiara Artha Park berdekatan dengan gedung apa?', options: ['Layana Hall', 'Gedung Merdeka', 'Gedung Sate', 'Padel Co.'], explain: 'Musala ini tercatat di Google Maps berdekatan dengan Layana Hall.' },
    { q: 'Selain di sini, di mana lagi toilet umum tersedia?', options: ['Sekitar area parkir sisi barat laut', 'Di tengah danau', 'Di Taman Asia Afrika', 'Tidak ada lagi'], explain: 'Toilet umum lain tersedia di sekitar area parkir sisi barat laut taman.' },
  ],
  P13: [
    { q: 'Gerbang Utara menghadap jalan apa?', options: ['Jl. Jakarta', 'Jl. Banten', 'Jl. Ibrahim Adjie', 'Jl. Asia Afrika'], explain: 'Gerbang Utara ada di sisi Jl. Jakarta, terhubung ke taman lewat Jl. Kiara Artha Utara.' },
    { q: 'Dari Gerbang Utara, ke arah mana lingkar taman?', options: ['Lurus ke selatan, ±100 m', 'Ke utara, ±1 km', 'Ke barat, ±500 m', 'Menyeberang Jl. Jakarta'], explain: 'Ikuti Jl. Kiara Artha Utara lurus ke selatan sekitar 100 meter.' },
  ],
  P14: [
    { q: 'Gerbang Timur menghadap jalan apa?', options: ['Jl. H. Ibrahim Adjie', 'Jl. Jakarta', 'Jl. Banten', 'Jl. Pasirkoja'], explain: 'Gerbang Timur ada di sisi Jl. H. Ibrahim Adjie, arah Kiaracondong.' },
    { q: 'Spot apa yang tepat berada di sebelah selatan Gerbang Timur?', options: ['Food Court 2', 'Selter BOSEH', 'Area parkir', 'Taman Asia Afrika'], explain: 'Food Court 2 dengan deretan kafe dan resto ada tepat di sebelah selatan gerbang.' },
  ],
  P15: [
    { q: 'Tenan mana yang ada di Food Court 2?', options: ['Steak Ranjang', 'Ludo Sports Kitchen', 'Padel Co.', 'Kiara Pelangi'], explain: 'Food Court 2 berisi Steak Ranjang, Siloka, Pang Waffle, dan RD Coffee & Eatery.' },
    { q: 'Kira-kira berapa jarak Food Court 2 ke danau?', options: ['±140 m', '±1 km', '±10 m', '±600 m'], explain: 'Danau dan air mancur sekitar 140 meter ke arah barat dari sini.' },
  ],
  P16: [
    { q: 'Masjid Al-Maleeq berada di sisi mana kawasan Kiara Artha?', options: ['Barat, dekat Jl. Banten', 'Timur, dekat Jl. Ibrahim Adjie', 'Di tengah danau', 'Selatan, di Kiara Pelangi'], explain: 'Masjid Al-Maleeq ada di sisi barat, di pojok deretan toko dekat Jl. Banten.' },
    { q: 'Selain masjid ini, di mana lagi bisa salat di taman?', options: ['Musala dekat Layana Hall', 'Food Court 2', 'Selter BOSEH', 'Lapangan padel'], explain: 'Ada musala di sisi utara taman, dekat Layana Hall dan titik start jogging track.' },
  ],
}

// ---------------------------------------------------------------------------
// Misi per spot. type: confirm (tombol "Sudah!") | photo (kamera, disimpan di ponsel) | timer (aktivitas berpemandu)
// ---------------------------------------------------------------------------
export const MISI = {
  P01: { type: 'photo', title: 'Foto pertama di Jurnal', prompt: 'Foto gerbang barat dari tempatmu berdiri. Ini jadi halaman pertama Jurnal Kunjunganmu!' },
  P02: { type: 'confirm', title: 'Ingat tempat parkirmu', prompt: 'Catat blok atau patokan tempat kendaraanmu diparkir supaya mudah ditemukan saat pulang.', done_label: 'Sudah kucatat!' },
  P03: { type: 'confirm', title: 'Cari patung jabat tangan', prompt: 'Lihat ke tepi utara danau dan temukan patung Friendship Shake Hand, dua tangan yang berjabat.', done_label: 'Ketemu!' },
  P05: { type: 'photo', title: 'Foto ikonik Asia Afrika', prompt: 'Menghadaplah ke utara dan ambil foto berlatar danau dan air mancur.' },
  P06: {
    type: 'timer',
    title: 'Pemanasan 60 detik',
    prompt: 'Ikuti aba-aba Kia sampai waktunya habis. Gerakkan badan pelan-pelan saja.',
    seconds: 60,
    cues: [
      { at: 0, text: 'Putar pergelangan kaki kanan.' },
      { at: 15, text: 'Ganti, putar pergelangan kaki kiri.' },
      { at: 30, text: 'Ayunkan kedua lengan ke depan dan ke belakang.' },
      { at: 45, text: 'Sekarang jalan di tempat.' },
    ],
  },
  P07: { type: 'confirm', title: 'Intip selter BOSEH', prompt: 'Lihat ke selter: ada sepeda yang siap disewa sekarang? Perhatikan juga papan tarifnya.', done_label: 'Sudah kuintip!' },
  P08: { type: 'photo', title: 'Foto menu favorit', prompt: 'Foto makanan atau minuman yang paling menggoda di area kuliner.' },
  P09: { type: 'confirm', title: 'Tonton satu reli', prompt: 'Tonton pemain padel sampai satu reli selesai. Perhatikan bola yang memantul ke dinding kaca!', done_label: 'Sudah kutonton!' },
  P11: {
    type: 'timer',
    title: 'Napas 4-6 selama 60 detik',
    prompt: 'Tarik napas 4 hitungan, hembuskan 6 hitungan. Ikuti aba-aba Kia.',
    seconds: 60,
    cues: [0, 10, 20, 30, 40, 50].flatMap((t) => [
      { at: t, text: 'Tarik napas.' },
      { at: t + 4, text: 'Hembuskan perlahan.' },
    ]),
  },
  P12: { type: 'confirm', title: 'Jaga kebersihan', prompt: 'Simpan alas kaki di rak dan buang satu sampah yang kamu lihat ke tempatnya.', done_label: 'Sudah!' },
  P13: { type: 'confirm', title: 'Hitung langkahmu', prompt: 'Hitung langkahmu dari gerbang sampai lingkar taman. Lebih atau kurang dari 150 langkah?', done_label: 'Sudah kuhitung!' },
  P14: { type: 'confirm', title: 'Cari papan nama', prompt: 'Temukan papan nama atau tulisan Kiara Artha Park di sekitar gerbang timur.', done_label: 'Ketemu!' },
  P15: { type: 'photo', title: 'Foto menu Food Court 2', prompt: 'Foto menu atau tenan favoritmu di Food Court 2.' },
  P16: { type: 'confirm', title: 'Rapikan alas kaki', prompt: 'Simpan alas kakimu dengan rapi di tempat yang disediakan, lalu bantu rapikan satu pasang lainnya.', done_label: 'Sudah rapi!' },
}

// ---------------------------------------------------------------------------
// Panduan audio checkpoint Wellness Trail (suara Kia) dan kuis setelah trail
// ---------------------------------------------------------------------------
export const COACHING = {
  T01: [
    'Checkpoint satu, titik start. Yuk pemanasan! Putar pergelangan kaki kanan dan kiri masing-masing lima kali, lalu ayunkan kedua lengan ke depan dan ke belakang. Setelah itu, jalan santai ke timur menuju musala.',
    'Checkpoint dua, sisi utara taman. Di sini ada musala dan toilet. Kalau haus, minum beberapa teguk air. Jaga postur: bahu rileks, pandangan ke depan. Lanjut ke timur menuju Zona Teduh.',
    'Checkpoint tiga, Zona Teduh. Saatnya peregangan ringan satu menit. Tarik lengan kanan menyilang ke depan dada, tahan sepuluh hitungan, lalu ganti lengan kiri. Kemudian tarik napas empat hitungan dan hembuskan enam hitungan. Ulangi tiga kali.',
    'Checkpoint empat, Taman Asia Afrika. Pandang danau dan air mancur di utara. Tarik napas dalam empat hitungan, hembuskan enam hitungan. Rasakan langkahmu jadi lebih ringan. Lanjut ke barat lalu ke utara, kembali ke titik start.',
    'Hore, kamu menyelesaikan Rute Santai Kelilingi Danau! Yuk pendinginan: tarik tumit ke arah bokong untuk meregangkan paha depan, tahan lima belas hitungan untuk tiap kaki. Jangan lupa minum air, ya.',
  ],
  T02: [
    'Selamat datang di Jogging Lingkar Kiara Artha! Pemanasan dinamis dulu: angkat lutut bergantian selama tiga puluh detik. Lalu mulai jogging pelan searah jarum jam.',
    'Checkpoint dua, sisi timur laut. Atur ritme napas: tarik napas dua langkah, hembuskan dua langkah. Kamu seharusnya masih bisa ngobrol dengan nyaman.',
    'Checkpoint tiga, sisi tenggara. Cek postur: badan tegak sedikit condong ke depan, lengan menekuk sembilan puluh derajat, dan mendarat dengan tengah telapak kaki.',
    'Checkpoint empat, sisi barat daya. Sedikit lagi! Pertahankan kecepatan yang nyaman. Area kuliner ada di sebelah kananmu kalau mau istirahat setelah ini.',
    'Satu putaran selesai, keren! Jalan pelan dua menit untuk pendinginan, lalu regangkan betis dengan bertumpu pada dinding atau pohon.',
  ],
}

export const KUIS_TRAIL = {
  T01: [
    { q: 'Pola napas di Rute Santai: tarik berapa hitungan, hembuskan berapa?', options: ['Tarik 4, hembuskan 6', 'Tarik 6, hembuskan 4', 'Tarik 2, hembuskan 2', 'Tarik 10, hembuskan 10'], explain: 'Hembusan yang lebih panjang (6) dari tarikan (4) membantu tubuh lebih rileks.' },
    { q: 'Setelah selesai berjalan, sebaiknya kamu…', options: ['Pendinginan dan minum air', 'Langsung lari sprint', 'Duduk tanpa bergerak lama', 'Tidak perlu apa-apa'], explain: 'Pendinginan meregangkan otot, dan minum air mengganti cairan yang keluar.' },
  ],
  T02: [
    { q: 'Saat jogging dengan ritme nyaman, kamu seharusnya…', options: ['Masih bisa ngobrol dengan nyaman', 'Terengah-engah tak bisa bicara', 'Menahan napas', 'Berhenti tiap 10 meter'], explain: 'Kalau masih bisa ngobrol, intensitas jogging-mu pas.' },
    { q: 'Posisi lengan yang dianjurkan saat berlari?', options: ['Menekuk sekitar 90 derajat', 'Lurus kaku ke bawah', 'Diangkat di atas kepala', 'Dimasukkan ke saku'], explain: 'Lengan menekuk 90 derajat membantu ayunan yang efisien.' },
  ],
}

// ---------------------------------------------------------------------------
// Tanya Kia: jawaban statis (kata kunci → jawaban). Pertanyaan dinamis (jarak, buka/tutup,
// jadwal air mancur, fasilitas terdekat, rekomendasi) dijawab langsung oleh src/lib/kia.js.
// ---------------------------------------------------------------------------
export const FAQ = [
  { id: 'tiket', patterns: ['tiket', 'harga masuk', 'bayar masuk', 'htm', 'biaya masuk'], answer: 'Tiket masuk tercatat Rp10.000 per orang, hari kerja maupun akhir pekan (detikJabar, 2024). Cek lagi di loket, ya, harga bisa berubah.', poi_id: 'P02' },
  { id: 'alamat', patterns: ['alamat', 'lokasi taman', 'letak taman', 'taman ini di mana'], answer: 'Kiara Artha Park ada di Jl. Banten, Kebonwaru, Kecamatan Batununggal, Kota Bandung, di antara flyover Antapani dan flyover Kiaracondong.', poi_id: 'P01' },
  { id: 'kontak', patterns: ['kontak', 'telepon', 'nomor hp', 'nomor telepon', 'instagram', 'ig', 'pengelola'], answer: 'Info resmi taman: Instagram @kiaraarthapark dan telepon 0822-1583-8889.', poi_id: null },
  { id: 'angkutan', patterns: ['angkot', 'bus', 'transportasi', 'naik apa', 'trans metro', 'kendaraan umum', 'halte'], answer: 'Bus Trans Metro Bandung Koridor 5 berhenti di halte Kiara Artha. Dari selter BOSEH di sisi barat, kamu juga bisa lanjut bersepeda.', poi_id: 'P07' },
  { id: 'sewa', patterns: ['sewa sepeda', 'skuter', 'otoped', 'harga sepeda', 'tarif sepeda', 'boseh'], answer: 'BOSEH (sepeda Pemkot Bandung) mulai Rp1.000 untuk jam pertama. Sewa sepeda dan skuter listrik di dalam taman sekitar Rp30.000 di hari kerja dan Rp40.000 di akhir pekan (detikJabar, 2024).', poi_id: 'P07' },
  { id: 'paket', patterns: ['paket', 'food court', 'makan malam', 'paket makan'], answer: 'Paket Kiara Pelangi Food Court Rp35.000 disebut sudah termasuk akses menonton air mancur menari (Orami, 2024). Konfirmasi lagi di lokasi, ya.', poi_id: 'P08' },
  { id: 'padel', patterns: ['booking padel', 'sewa lapangan', 'reservasi', 'pesan lapangan', 'main padel'], answer: 'Lapangan padel dipesan langsung ke pengelola Padel Co. SETARA belum menyediakan reservasi.', poi_id: 'P09' },
  { id: 'masjid', patterns: ['salat jumat', 'jumatan', 'masjid besar', 'al maleeq', 'al-maleeq'], answer: 'Untuk salat, ada Masjid Al-Maleeq di sisi barat dekat Jl. Banten dan Pintu Utama, serta musala dekat Layana Hall di sisi utara taman.', poi_id: 'P16' },
  { id: 'kia', patterns: ['kamu siapa', 'siapa kamu', 'kia siapa', 'siapa kia', 'kenalan'], answer: 'Aku Kia, tunas pohon kiara! Aku menemanimu menjelajah, membacakan cerita spot, dan memberi kuis serta misi. Makin banyak bintang yang kamu kumpulkan, makin tinggi aku tumbuh.', poi_id: null },
  { id: 'kiara', patterns: ['pohon kiara', 'asal nama', 'arti kiara', 'nama kiara'], answer: 'Kiara adalah pohon sejenis beringin (Ficus). Nama Kiaracondong konon berasal dari pohon kiara yang tumbuh condong.', poi_id: null },
  { id: 'privasi', patterns: ['privasi', 'data saya', 'lokasi saya dikirim', 'aman nggak'], answer: 'Lokasimu hanya diproses di ponsel dan tidak pernah dikirim ke server. Yang terkirim tanpa identitas hanya rating, laporan, hasil kuis, dan pertanyaan yang belum bisa kujawab.', poi_id: null },
]

// ---------------------------------------------------------------------------
// Tantangan Hari Ini (bergilir per hari). goal_type: listen | quiz | mission | photo | spot | trail | ask
// ---------------------------------------------------------------------------
export const TANTANGAN = [
  { id: 'D1', title: 'Pendengar Pagi', description: 'Dengarkan 3 cerita spot sebelum pukul 10.00.', goal_type: 'listen', goal_count: 3, before: '10:00' },
  { id: 'D2', title: 'Juru Foto Hari Ini', description: 'Selesaikan 1 misi foto.', goal_type: 'photo', goal_count: 1, before: null },
  { id: 'D3', title: 'Kuis Kilat', description: 'Jawab benar kuis di 2 spot.', goal_type: 'quiz', goal_count: 2, before: null },
  { id: 'D4', title: 'Penjelajah Hari Ini', description: 'Kunjungi 4 spot berbeda.', goal_type: 'spot', goal_count: 4, before: null },
  { id: 'D5', title: 'Langkah Sehat', description: 'Selesaikan 1 Wellness Trail.', goal_type: 'trail', goal_count: 1, before: null },
  { id: 'D6', title: 'Kepo Bareng Kia', description: 'Tanyakan 3 hal ke Kia.', goal_type: 'ask', goal_count: 3, before: null },
  { id: 'D7', title: 'Misi Tuntas', description: 'Selesaikan misi di 2 spot.', goal_type: 'mission', goal_count: 2, before: null },
]

// Badge baru dari bintang & kebiasaan (kind ≠ stamp)
export const BADGE_INTERAKSI = [
  { id: 'B06', name: 'Penjawab Jitu', description: 'Jawab benar kuis di 6 spot.', kind: 'quiz', min_count: 6 },
  { id: 'B07', name: 'Misi Tuntas', description: 'Selesaikan misi di 6 spot.', kind: 'mission', min_count: 6 },
  { id: 'B08', name: 'Juru Foto', description: 'Selesaikan 3 misi foto.', kind: 'photo', min_count: 3 },
  { id: 'B09', name: 'Langganan Taman', description: 'Berkunjung 3 minggu berturut-turut.', kind: 'streak', min_count: 3 },
]
