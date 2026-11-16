// Membuat ikon aplikasi SETARA (logo crosshair) tanpa dependensi gambar:
// PWA (public/), launcher Android (mipmap-*), splash Android & iOS.
// Jalankan: node scripts/make-icons.mjs
import { writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const MINT = hex('#d9f2ee')
const INK = hex('#0d4f4a')
const CANVAS = hex('#f4f9f8')

// ---- PNG encoder (RGBA 8-bit) ----
const CRC = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}
const pngSize = (file) => {
  const b = readFileSync(file)
  return [b.readUInt32BE(16), b.readUInt32BE(20)]
}

// ---- Bentuk (koordinat desain 512×512, seperti public/favicon.svg) ----
const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}
const SEGMENTS = [
  [256, 92, 256, 162],
  [256, 350, 256, 420],
  [92, 256, 162, 256],
  [350, 256, 420, 256],
]
function inMark(x, y) {
  const d = Math.hypot(x - 256, y - 256)
  if (d >= 41 && d <= 75) return true
  return SEGMENTS.some((s) => segDist(x, y, ...s) <= 17)
}
function inRoundRect(x, y, r) {
  const cx = Math.min(Math.max(x, r), 512 - r)
  const cy = Math.min(Math.max(y, r), 512 - r)
  return Math.hypot(x - cx, y - cy) <= r
}

/**
 * bg: 'rounded' | 'circle' | 'full' | 'none'
 * markScale: skala logo terhadap kanvas (1 = seperti favicon)
 * canvas: warna latar seluruh gambar (splash) atau null (transparan)
 */
function render(w, h, { bg = 'rounded', markScale = 1, canvas = null, boxFrac = 1, ss = 3 } = {}) {
  const out = Buffer.alloc(w * h * 4)
  const box = Math.min(w, h) * boxFrac // ukuran kotak ikon 512 di dalam kanvas
  const ox = (w - box) / 2
  const oy = (h - box) / 2
  const k = 512 / box
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < ss; sy++)
        for (let sx = 0; sx < ss; sx++) {
          const u = (x + (sx + 0.5) / ss - ox) * k
          const v = (y + (sy + 0.5) / ss - oy) * k
          let col = canvas
          const inside = u >= 0 && v >= 0 && u <= 512 && v <= 512
          if (inside) {
            const inBg = bg === 'full' || (bg === 'rounded' && inRoundRect(u, v, 112)) || (bg === 'circle' && Math.hypot(u - 256, v - 256) <= 256)
            if (inBg) col = MINT
            const mu = 256 + (u - 256) / markScale
            const mv = 256 + (v - 256) / markScale
            if (inMark(mu, mv)) col = INK
          }
          if (col) {
            r += col[0]
            g += col[1]
            b += col[2]
            a += 255
          }
        }
      const n = ss * ss
      const i = (y * w + x) * 4
      // premultiplied → straight alpha
      out[i + 3] = Math.round(a / n)
      if (a) {
        out[i] = Math.round((r * 255) / a)
        out[i + 1] = Math.round((g * 255) / a)
        out[i + 2] = Math.round((b * 255) / a)
      }
    }
  }
  return encodePng(w, h, out)
}

const write = (rel, buf) => {
  writeFileSync(resolve(root, rel), buf)
  console.log('  ', rel)
}

// PWA
write('public/icon-192.png', render(192, 192))
write('public/icon-512.png', render(512, 512))
write('public/icon-maskable-512.png', render(512, 512, { bg: 'full', markScale: 0.8 }))

// Android launcher
const res = resolve(root, 'android/app/src/main/res')
if (existsSync(res)) {
  const dens = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
  for (const [d, s] of Object.entries(dens)) {
    write(`android/app/src/main/res/mipmap-${d}/ic_launcher.png`, render(s, s))
    write(`android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`, render(s, s, { bg: 'circle' }))
    // Adaptive icon: foreground 108dp, area aman 66dp di tengah
    const f = Math.round((s * 108) / 48)
    write(`android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`, render(f, f, { bg: 'none', markScale: 0.62 }))
  }
  writeFileSync(
    join(res, 'values/ic_launcher_background.xml'),
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#D9F2EE</color>\n</resources>\n'
  )
  // Splash: ukuran mengikuti berkas bawaan Capacitor
  for (const dir of readdirSync(res).filter((d) => d.startsWith('drawable'))) {
    const file = join(res, dir, 'splash.png')
    if (!existsSync(file)) continue
    const [w, h] = pngSize(file)
    write(`android/app/src/main/res/${dir}/splash.png`, render(w, h, { canvas: CANVAS, boxFrac: 0.28, ss: 2 }))
  }
}

// iOS
const ios = resolve(root, 'ios/App/App/Assets.xcassets')
if (existsSync(ios)) {
  write('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', render(1024, 1024, { bg: 'full', ss: 2 }))
  for (const n of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'])
    write(`ios/App/App/Assets.xcassets/Splash.imageset/${n}`, render(2732, 2732, { canvas: CANVAS, boxFrac: 0.16, ss: 1 }))
}
console.log('Ikon selesai dibuat.')
