import { createRouter, createWebHashHistory } from 'vue-router'
import { settings } from './stores/settings'

// Hash history: aman untuk GitHub Pages (subpath) dan Capacitor (.apk)
const routes = [
  { path: '/', redirect: '/home' },
  // Beranda / landing "Selamat datang di SETARA" (akun + jalan pintas ke peta)
  { path: '/home', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: '/onboarding', name: 'onboarding', component: () => import('./views/OnboardingView.vue') },
  { path: '/explore', name: 'explore', component: () => import('./views/ExploreView.vue'), meta: { tabs: true } },
  { path: '/search', name: 'search', component: () => import('./views/SearchView.vue'), meta: { tabs: true } },
  { path: '/poi/:id', name: 'poi', component: () => import('./views/PoiDetailView.vue') },
  { path: '/navigate/:id', name: 'navigate', component: () => import('./views/NavigationView.vue') },
  { path: '/trail', name: 'trail', component: () => import('./views/TrailView.vue'), meta: { tabs: true } },
  { path: '/qr', name: 'qr', component: () => import('./views/QrScanView.vue') },
  { path: '/qr/:id', name: 'qr-link', component: () => import('./views/QrLinkView.vue') },
  { path: '/stamps', name: 'stamps', component: () => import('./views/StampsView.vue'), meta: { tabs: true } },
  { path: '/summary', name: 'summary', component: () => import('./views/SummaryView.vue') },
  { path: '/privacy', name: 'privacy', component: () => import('./views/PrivacyView.vue') },
  { path: '/about', name: 'about', component: () => import('./views/AboutView.vue') },
  { path: '/log', name: 'log', component: () => import('./views/LogView.vue') },
  { path: '/print-qr', name: 'print-qr', component: () => import('./views/PrintQrView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHashHistory(), routes })

// Setiap kali aplikasi dibuka dari awal (bukan sekadar muat ulang tab), mulai dari Beranda.
// Tautan langsung (QR papan spot, detail spot, cetak QR) tetap dibuka sesuai tujuannya.
// sessionStorage bertahan saat tab dimuat ulang, tetapi kosong saat aplikasi/tab baru dibuka.
const DEEP_LINKS = ['qr-link', 'poi', 'print-qr', 'privacy', 'about', 'log']
let firstNavigation = true
function freshLaunch() {
  try {
    const alive = sessionStorage.getItem('setara:alive')
    sessionStorage.setItem('setara:alive', '1')
    return !alive
  } catch {
    return true
  }
}

router.beforeEach((to) => {
  if (firstNavigation) {
    firstNavigation = false
    if (freshLaunch() && to.name !== 'home' && !DEEP_LINKS.includes(to.name)) return { name: 'home' }
  }
  const open = ['home', 'onboarding', 'qr-link', 'privacy', 'about', 'print-qr']
  if (!settings.onboarded && !open.includes(to.name)) return { name: 'home' }
})

export default router
