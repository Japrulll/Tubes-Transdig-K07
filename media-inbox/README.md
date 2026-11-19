# media-inbox: tempat menaruh foto untuk aplikasi

Taruh foto di folder ini, lalu jalankan dari folder proyek:

```bash
npm run media
```

Skrip `scripts/import-media.mjs` memperkecil foto (maks. 1280 px, WebP) ke `public/media/`
sehingga foto ikut terbundel di aplikasi: cepat dimuat dan tetap tampil saat offline.
Slot yang belum punya foto tetap memakai ilustrasi.

## Nama berkas = slot

| Nama berkas | Dipakai untuk |
|---|---|
| `p01_1.jpg` … `p12_2.jpg` | Foto spot, 2 per spot (urutan galeri di halaman detail) |
| `onboarding_1.jpg` … `onboarding_3.jpg` | Slide pengenalan aplikasi |
| `t01.jpg`, `t02.jpg` | Sampul Wellness Trail |

Format yang diterima: jpg, jpeg, png, webp. Usahakan foto mendatar (landscape).
Keterangan tiap foto spot sudah ada di database (tabel `photo`, kolom `caption`).

## Kredit & izin foto

Isi `credits.json` di folder ini agar kredit tampil di halaman **Tentang**:

```json
{
  "p05_1.jpg": "Foto: Tim K07",
  "p03_1.jpg": "Foto: Nama Fotografer (CC BY 4.0)"
}
```

Aplikasi ini dipublikasikan (GitHub Pages dan APK), jadi pakai foto milik tim sendiri, foto berlisensi
terbuka (mis. Creative Commons dengan atribusi), atau foto yang sudah diizinkan pemiliknya,
misalnya pengelola Kiara Artha Park. Jangan memakai foto dari Google Maps, Instagram, atau berita tanpa izin.

## Menghapus foto dari aplikasi

```bash
npm run media -- --remove p05_1
```

Folder ini tidak ikut dibundel; hanya hasil di `public/media/` yang masuk ke aplikasi.
