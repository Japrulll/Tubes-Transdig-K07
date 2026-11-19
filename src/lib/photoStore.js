// Jurnal Kunjungan: foto misi disimpan HANYA di ponsel (IndexedDB), tidak pernah diunggah.
const DB_NAME = 'setara-jurnal'
const STORE = 'photos'

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB tidak tersedia'))
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const out = fn(t.objectStore(STORE))
    t.oncomplete = () => resolve(out?.result ?? out)
    t.onerror = () => reject(t.error)
  })
}

/** Perkecil foto kamera (maks. 1280 px) agar hemat ruang penyimpanan */
export async function resizeImage(file, max = 1280, quality = 0.82) {
  let source
  try {
    source = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    source = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }
  const w = source.width
  const h = source.height
  const k = Math.min(1, max / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * k)
  canvas.height = Math.round(h * k)
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), 'image/jpeg', quality))
}

export async function savePhoto(poiId, blob) {
  const id = `${poiId}-${Date.now()}`
  await tx('readwrite', (s) => s.put({ id, poiId, at: Date.now(), blob }))
  return id
}

export async function listPhotos() {
  try {
    const all = await tx('readonly', (s) => s.getAll())
    return (all || []).sort((a, b) => b.at - a.at)
  } catch {
    return []
  }
}

export async function deletePhoto(id) {
  await tx('readwrite', (s) => s.delete(id))
}

export async function clearPhotos() {
  try {
    await tx('readwrite', (s) => s.clear())
  } catch {
    /* abaikan */
  }
}
