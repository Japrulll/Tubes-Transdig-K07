// Lapisan UI global: lembar tantangan, Tanya Kia, ajakan rating saat meninggalkan spot.
import { reactive } from 'vue'
import { onExit } from './geofence'
import { visits } from './visits'
import { play, ratedThisVisit } from './play'
import { settings } from './settings'

export const ui = reactive({
  challenge: null, // { poiId, step: 'quiz' | 'mission' | 'rate' }
  kiaOpen: false,
  kiaPrefill: '',
  ratePrompt: null, // id POI yang baru ditinggalkan
})

export function openChallenge(poiId, step = null) {
  ui.challenge = { poiId, step }
}
export const closeChallenge = () => (ui.challenge = null)

export function openKia(question = '') {
  ui.kiaPrefill = question
  ui.kiaOpen = true
}
export const closeKia = () => (ui.kiaOpen = false)

// Rating ditanyakan sekali per spot per kunjungan: setelah tantangan, atau saat
// pengguna meninggalkan spot bila tantangan dilewati.
onExit((poi) => {
  if (settings.quiet || ui.challenge) return
  if (!visits.session.visited.includes(poi.id) || ratedThisVisit(poi.id)) return
  const key = `rate:${poi.id}:${visits.session.startedAt}`
  if (play.dismissed[key]) return
  play.dismissed[key] = Date.now()
  ui.ratePrompt = poi.id
})
