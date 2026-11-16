import { createRouter, createWebHashHistory } from 'vue-router'
import { settings } from './stores/settings'

// Hash history: aman untuk GitHub Pages (subpath) dan Capacitor (.apk)
const routes = [
  { path: '/', redirect: () => (settings.onboarded ? '/explore' : '/onboarding') },
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

router.beforeEach((to) => {
  const open = ['onboarding', 'qr-link', 'privacy', 'print-qr']
  if (!settings.onboarded && !open.includes(to.name)) return { name: 'onboarding' }
})

export default router
