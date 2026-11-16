// Konten taman: dataset bawaan (offline) → cache → Supabase (bila online).
// Permintaan ke Supabase hanya MEMBACA konten; tidak ada data lokasi yang dikirim (A03).
import { reactive, computed } from 'vue'
import bundled from '../data/poi.json'
import { load, save } from '../lib/storage'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'

const CACHE_KEY = 'content:v2'

/** Path berkas di Storage ("poi-media/foto/p01_1.jpg") → URL publik */
export function mediaUrl(src) {
  if (!src) return null
  if (/^https?:\/\//.test(src)) return src
  return `${SUPABASE_URL}/storage/v1/object/public/${src.replace(/^\/+/, '')}`
}

function normalize(d) {
  const categories = [...d.categories].sort((a, b) => a.sort_order - b.sort_order)
  const pois = d.pois.map((p, i) => ({
    ...p,
    sort_order: p.sort_order ?? i + 1,
    number: Number(p.id.slice(1)),
    trivia: p.trivia || [],
    activities: p.activities || [],
    tips: p.tips || [],
    photo_urls: p.photo_urls || [],
    schedules: p.schedules || [],
    hours: p.hours || [],
    keywords: p.keywords || [],
    best_times: p.best_times || [],
  }))
  pois.sort((a, b) => a.sort_order - b.sort_order)
  const trails = d.trails.map((t) => ({ ...t, checkpoints: t.checkpoints.map((c, k) => ({ ...c, seq: k + 1 })) }))
  return { version: d.version, park: d.park, categories, pois, trails, badges: d.badges }
}

const cached = load(CACHE_KEY, null)
const initial = normalize(cached?.data || bundled)

export const content = reactive({
  ...initial,
  source: cached ? 'cache' : 'bundled', // bundled | cache | supabase
  syncedAt: cached?.syncedAt || null,
  syncing: false,
  syncError: null,
})

export const poiById = computed(() => Object.fromEntries(content.pois.map((p) => [p.id, p])))
export const categoryById = computed(() => Object.fromEntries(content.categories.map((c) => [c.id, c])))
export const trailById = computed(() => Object.fromEntries(content.trails.map((t) => [t.id, t])))
export const getPoi = (id) => poiById.value[String(id || '').toUpperCase()] || null

export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/** Ambil konten terbaru dari Supabase; dataset bawaan tetap dipakai bila gagal */
export async function syncContent() {
  if (!supabaseEnabled || content.syncing) return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return
  content.syncing = true
  content.syncError = null
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    // Satu RPC (public.get_app_content) mengembalikan seluruh konten yang dipublikasikan
    const { data: remote, error } = await sb.rpc('get_app_content')
    if (error) throw error
    if (!remote?.pois?.length) throw new Error('Belum ada POI yang dipublikasikan di Supabase')

    const fallbackPoi = Object.fromEntries(bundled.pois.map((p) => [p.id, p]))
    const data = {
      version: remote.version || 'supabase',
      park: { ...bundled.park, ...(remote.park || {}) },
      categories: remote.categories.map((c, i) => ({ ...c, label: c.label || c.name, sort_order: c.sort_order ?? i + 1 })),
      pois: remote.pois.map((p) => ({
        ...fallbackPoi[p.id],
        ...Object.fromEntries(Object.entries(p).filter(([, v]) => v !== null && v !== undefined)),
        photo_urls: (p.photos || []).map((f) => mediaUrl(f.src)).filter(Boolean),
        photo_captions: (p.photos || []).map((f) => f.caption),
        audio_url: mediaUrl(p.audio?.src),
        audio_duration: p.audio?.duration_s || null,
      })),
      trails: remote.trails.length ? remote.trails : bundled.trails,
      badges: remote.badges.length ? remote.badges : bundled.badges,
    }
    Object.assign(content, normalize(data))
    content.source = 'supabase'
    content.syncedAt = new Date().toISOString()
    save(CACHE_KEY, { data, syncedAt: content.syncedAt })
  } catch (e) {
    content.syncError = e?.message || String(e)
  } finally {
    content.syncing = false
  }
}
