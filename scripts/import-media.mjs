// Impor foto ke aplikasi (dibundel agar cepat & bisa offline).
//
// 1. Taruh foto di folder media-inbox/ dengan nama slot:
//      p01_1.jpg … p12_2.jpg   → foto spot (2 per spot, urutan = urutan galeri)
//      onboarding_1.jpg … _3   → slide pengenalan
//      t01.jpg, t02.jpg        → sampul Wellness Trail
//    (jpg/jpeg/png/webp; huruf besar/kecil bebas)
// 2. (Opsional) media-inbox/credits.json → { "p05_1.jpg": "Foto: Tim K07 (CC BY 4.0)" }
// 3. Jalankan: node scripts/import-media.mjs
//
// Hasil: public/media/<slot>.webp (maks. 1280 px) + <slot>-thumb.webp (320 px),
// dan daftar slot di src/data/media.json. Slot tanpa foto tetap memakai ilustrasi.
// Hapus foto dari aplikasi: node scripts/import-media.mjs --remove p05_1
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { dirname, resolve, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const inbox = resolve(root, 'media-inbox')
const outDir = resolve(root, 'public/media')
const manifestPath = resolve(root, 'src/data/media.json')
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { files: {} }
manifest.files ||= {}

// Nama berkas → kunci slot
function slotOf(name) {
  const n = basename(name, extname(name)).toLowerCase()
  let m
  if ((m = n.match(/^p(\d{2})_([12])$/))) return `foto/p${m[1]}_${m[2]}`
  if ((m = n.match(/^onboarding_([123])$/))) return `onboarding/${m[1]}`
  if ((m = n.match(/^t(\d{2})$/))) return `trail/t${m[1]}`
  return null
}

const args = process.argv.slice(2)
if (args[0] === '--remove') {
  for (const name of args.slice(1)) {
    const key = slotOf(name)
    if (!key || !manifest.files[key]) {
      console.log(`  lewati ${name}: slot tidak ada`)
      continue
    }
    for (const suffix of ['', '-thumb']) rmSync(resolve(outDir, `${key}${suffix}.webp`), { force: true })
    delete manifest.files[key]
    console.log(`  dihapus ${key}`)
  }
} else {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.error('Paket "sharp" belum terpasang. Jalankan: npm install')
    process.exit(1)
  }
  if (!existsSync(inbox)) {
    mkdirSync(inbox, { recursive: true })
    console.log('Folder media-inbox/ dibuat. Taruh foto di sana lalu jalankan lagi.')
    process.exit(0)
  }
  const credits = existsSync(resolve(inbox, 'credits.json')) ? JSON.parse(readFileSync(resolve(inbox, 'credits.json'), 'utf8')) : {}
  const files = readdirSync(inbox).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  if (!files.length) console.log('Tidak ada foto di media-inbox/.')
  for (const f of files) {
    const key = slotOf(f)
    if (!key) {
      console.log(`  lewati ${f}: nama tidak cocok (contoh: p05_1.jpg, onboarding_2.jpg, t01.jpg)`)
      continue
    }
    const src = resolve(inbox, f)
    const dest = resolve(outDir, `${key}.webp`)
    mkdirSync(dirname(dest), { recursive: true })
    const img = sharp(src).rotate()
    const full = await img.clone().resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toFile(dest)
    await img.clone().resize({ width: 320, height: 320, fit: 'cover' }).webp({ quality: 70 }).toFile(resolve(outDir, `${key}-thumb.webp`))
    const credit = credits[f] ?? credits[basename(f, extname(f))] ?? manifest.files[key]?.credit ?? null
    manifest.files[key] = { w: full.width, h: full.height, thumb: true, credit }
    console.log(`  ${f} → public/media/${key}.webp (${full.width}×${full.height}, ${Math.round(full.size / 1024)} KB)`)
  }
}

manifest.generated = new Date().toISOString()
manifest.files = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(`src/data/media.json: ${Object.keys(manifest.files).length} slot berisi foto.`)
