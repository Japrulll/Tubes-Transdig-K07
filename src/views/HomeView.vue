<script setup>
// Beranda / landing "Selamat datang di SETARA": titik masuk setiap kali aplikasi dibuka.
// Berisi akun (masuk Google/email, status sinkron, keluar) dan jalan pintas ke peta.
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import Kia from '../components/Kia.vue'
import AuthSheet from '../components/AuthSheet.vue'
import GoogleButton from '../components/GoogleButton.vue'
import heroImg from '../assets/hero-setara.png'
import iconLocate from '../assets/icon-locate.png'
import { slotImage } from '../lib/mediaSlots'
import { settings } from '../stores/settings'
import { content } from '../stores/content'
import { stampCount } from '../stores/visits'
import { play, level, totalStars } from '../stores/play'
import { trail, activeTrail } from '../stores/trail'
import { auth, isLoggedIn, profile, googleAvailable, signInWithGoogle, signOut, pushNow } from '../stores/auth'
import { unlockAudio } from '../lib/audio'
import { timeSlot } from '../lib/time'

const route = useRoute()
const router = useRouter()
const hero = slotImage('onboarding/1')

const sheet = ref(false)
const sheetMode = ref('login')
const confirmOut = ref(null) // null | 'ask' | 'unsynced'

function openAuth(mode = 'login') {
  sheetMode.value = mode
  sheet.value = true
}

// Dari menu samping: #/home?login=1 atau #/home?logout=1
watch(
  () => route.query,
  (q) => {
    if (q.login && !isLoggedIn.value) openAuth(q.login === 'register' ? 'register' : 'login')
    if (q.logout && isLoggedIn.value) confirmOut.value = 'ask'
    if (q.login || q.logout) router.replace('/home')
  },
  { immediate: true }
)
// Tutup lembar login setelah berhasil masuk (termasuk kembali dari Google)
watch(isLoggedIn, (v) => v && (sheet.value = false))

const greeting = computed(() => ({ pagi: 'Selamat pagi', siang: 'Selamat siang', sore: 'Selamat sore', malam: 'Selamat malam' })[timeSlot()] || 'Halo')
const trailActive = computed(() => activeTrail.value && ['running', 'paused'].includes(trail.status))

const syncText = computed(() => {
  const s = auth.sync
  if (s.status === 'syncing') return 'Menyimpan progres ke akun…'
  if (s.status === 'pending') return navigator.onLine === false ? 'Offline · disimpan saat online' : 'Menunggu disimpan…'
  if (s.status === 'error') return 'Gagal menyimpan · ketuk untuk coba lagi'
  if (s.at) {
    const min = Math.round((Date.now() - s.at) / 60000)
    return min < 1 ? 'Progres tersimpan di akun · baru saja' : min < 60 ? `Progres tersimpan di akun · ${min} menit lalu` : 'Progres tersimpan di akun'
  }
  return 'Progres tersimpan di akun'
})

async function google() {
  unlockAudio()
  await signInWithGoogle()
}

function start() {
  unlockAudio()
  if (!settings.onboarded) return router.push('/onboarding')
  router.push(trailActive.value ? '/trail' : '/explore')
}

async function logout(force = false) {
  const r = await signOut({ force })
  if (r.unsynced) confirmOut.value = 'unsynced'
  else if (r.ok) confirmOut.value = null
}
</script>

<template>
  <div class="flex flex-col bg-white">
  <main class="safe-top safe-bottom flex min-h-0 flex-1 flex-col overflow-y-auto">
    <!-- Bilah atas -->
    <header class="flex items-center justify-between px-5 pt-3">
      <div class="flex items-center gap-2 text-brand-900">
        <img :src="iconLocate" alt="" class="size-9" />
        <span class="text-[17px] font-extrabold tracking-[0.18em]">SETARA</span>
      </div>
      <button v-if="isLoggedIn" class="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-[12px] font-bold text-ink" @click="confirmOut = confirmOut ? null : 'ask'">
        <img v-if="profile.avatar" :src="profile.avatar" referrerpolicy="no-referrer" alt="" class="size-7 rounded-full object-cover" />
        <span v-else class="grid size-7 place-items-center rounded-full bg-brand-500 text-[11px] text-white">{{ profile.initials }}</span>
        {{ profile.first }}
      </button>
      <button v-else-if="auth.ready" class="btn-ghost min-h-10 px-3 text-[13px]" @click="openAuth('login')"><Icon name="user" :size="17" /> Masuk</button>
    </header>

    <div class="flex flex-1 flex-col px-5 pt-4">
      <!-- Hero -->
      <div class="relative overflow-hidden rounded-[1.75rem]">
        <img :src="hero?.url || heroImg" alt="Ilustrasi taman Kiara Artha dengan danau, pohon, dan pengunjung" class="aspect-[1488/1080] w-full object-cover" />
        <div class="absolute bottom-3 right-3 flex items-end gap-1.5">
          <span class="mb-6 rounded-2xl rounded-br-md bg-white px-3 py-1.5 text-[12px] font-bold text-brand-900 shadow-[var(--shadow-card)]">
            {{ isLoggedIn ? `Halo lagi, ${profile.first}!` : 'Halo, aku Kia!' }}
          </span>
          <Kia mood="wave" :stage="isLoggedIn || settings.onboarded ? level.level : 1" :size="72" />
        </div>
      </div>

      <p class="eyebrow mt-6">{{ isLoggedIn ? greeting : 'Teman jelajah tamanmu' }}</p>
      <h1 class="mt-2 text-[32px] font-medium leading-[1.12] tracking-tight text-ink">
        <template v-if="isLoggedIn">Selamat datang<br />kembali, <span class="text-brand-500">{{ profile.first }}</span></template>
        <template v-else-if="settings.onboarded">Selamat datang<br />kembali di <span class="text-brand-500">SETARA</span></template>
        <template v-else>Selamat datang<br />di <span class="text-brand-500">SETARA</span></template>
      </h1>
      <p class="mt-3 text-[14px] leading-relaxed text-muted">
        Pemandu jelajah Kiara Artha Park. Kia menyapamu di setiap spot, bercerita, lalu mengajakmu ikut kuis dan misi kecil.
      </p>

      <!-- Akun: sudah masuk -->
      <section v-if="isLoggedIn" class="card mt-5 p-4" aria-label="Akun">
        <div class="flex items-center gap-3">
          <img v-if="profile.avatar" :src="profile.avatar" referrerpolicy="no-referrer" alt="" class="size-12 shrink-0 rounded-full object-cover" />
          <span v-else class="grid size-12 shrink-0 place-items-center rounded-full bg-brand-500 text-[16px] font-bold text-white">{{ profile.initials }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[15px] font-bold text-ink">{{ profile.name }}</p>
            <p class="truncate text-[12px] text-muted">{{ profile.email }}</p>
          </div>
          <span class="rounded-full bg-mint px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-brand-700">{{ profile.provider === 'google' ? 'Google' : 'Email' }}</span>
        </div>
        <button
          class="mt-3 flex w-full items-center gap-2 rounded-xl px-1 text-left text-[12px] font-semibold"
          :class="auth.sync.status === 'error' ? 'text-coral-600' : 'text-brand-700'"
          :disabled="auth.sync.status === 'syncing'"
          @click="pushNow"
        >
          <span v-if="auth.sync.status === 'syncing'" class="size-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <Icon v-else :name="auth.sync.status === 'synced' ? 'cloud-check' : 'cloud'" :size="17" />
          {{ syncText }}
        </button>
        <div class="mt-3 grid grid-cols-3 gap-2">
          <div class="stat"><span class="stat-value">{{ stampCount }}<span class="stat-unit">/{{ content.pois.length }}</span></span><span class="stat-label">Stempel</span></div>
          <div class="stat"><span class="stat-value">{{ totalStars }}</span><span class="stat-label">Bintang</span></div>
          <div class="stat"><span class="stat-value">{{ play.xp }}<span class="stat-unit">XP</span></span><span class="stat-label">{{ level.name }}</span></div>
        </div>

        <!-- Konfirmasi keluar -->
        <div v-if="confirmOut" class="mt-3 rounded-2xl p-3" :class="confirmOut === 'unsynced' ? 'bg-coral-500/10' : 'bg-mint'">
          <p class="text-[12px] leading-relaxed" :class="confirmOut === 'unsynced' ? 'font-semibold text-coral-600' : 'text-muted'">
            <template v-if="confirmOut === 'unsynced'">Progres terbaru belum tersimpan ke akun (mungkin sedang offline). Jika tetap keluar, progres yang belum tersimpan akan hilang dari ponsel ini.</template>
            <template v-else>Progresmu aman di akun. Setelah keluar, ponsel ini kembali ke mode tamu dan progres akan muncul lagi saat kamu masuk.</template>
          </p>
          <div class="mt-2.5 grid grid-cols-2 gap-2">
            <button class="btn-outline min-h-11 text-[13px]" @click="confirmOut = null">Batal</button>
            <button class="btn min-h-11 bg-coral-500 text-[13px] text-white hover:bg-coral-600" :disabled="auth.busy" @click="logout(confirmOut === 'unsynced')">
              <Icon name="logout" :size="16" /> {{ confirmOut === 'unsynced' ? 'Tetap keluar' : 'Keluar' }}
            </button>
          </div>
        </div>
        <button v-else class="btn-ghost mt-2 min-h-11 w-full text-[13px] text-coral-600 hover:bg-coral-500/10" @click="confirmOut = 'ask'">
          <Icon name="logout" :size="16" /> Keluar dari akun
        </button>
      </section>

      <!-- Akun: belum masuk -->
      <section v-else class="mt-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4" aria-label="Masuk">
        <div class="flex gap-3">
          <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700"><Icon name="cloud" :size="22" /></span>
          <div>
            <p class="text-[14px] font-bold text-ink">Simpan progresmu</p>
            <p class="mt-1 text-[12px] leading-relaxed text-muted">
              Masuk agar stempel, bintang, dan level Kia tersimpan di akun dan bisa dilanjutkan di ponsel lain.
              <template v-if="stampCount || play.xp">Progres tamu di ponsel ini ({{ stampCount }} stempel, {{ play.xp }} XP) ikut tersimpan.</template>
            </p>
          </div>
        </div>
        <p v-if="auth.error && !sheet" class="mt-3 rounded-xl bg-coral-500/10 p-2.5 text-[12px] font-semibold text-coral-600" role="alert">{{ auth.error }}</p>
        <div class="mt-4 flex flex-col gap-2.5">
          <GoogleButton v-if="googleAvailable" :disabled="auth.busy || !auth.ready" @click="google" />
          <button class="btn-outline min-h-13 w-full" :disabled="!auth.ready" @click="openAuth('login')"><Icon name="mail" :size="18" /> Masuk dengan Email</button>
        </div>
        <p class="mt-3 text-center text-[12px] text-muted">
          Belum punya akun? <button class="font-bold text-brand-700" @click="openAuth('register')">Daftar gratis</button>
        </p>
      </section>

      <!-- Aksi utama -->
      <div class="mt-auto pt-6 pb-5">
        <div class="flex flex-col gap-3">
          <button class="btn-primary min-h-14" @click="start">
            <template v-if="!settings.onboarded"><Icon name="arrow-right" :size="19" /> {{ isLoggedIn ? 'Mulai Jelajah' : 'Mulai sebagai tamu' }}</template>
            <template v-else-if="trailActive"><Icon name="trail" :size="19" /> Lanjutkan {{ activeTrail.name }}</template>
            <template v-else><Icon name="compass" :size="19" /> Lanjut Jelajah</template>
          </button>
          <button v-if="settings.onboarded" class="btn-outline min-h-14" @click="router.push('/qr')"><Icon name="qr" :size="19" /> Scan QR Spot</button>
        </div>
        <p class="mt-4 text-center text-[11px] text-subtle">
          <RouterLink to="/privacy" class="font-semibold text-brand-700 underline-offset-2 hover:underline">Privasi lokasi</RouterLink>
          · <RouterLink to="/about" class="font-semibold text-brand-700 underline-offset-2 hover:underline">Tentang SETARA</RouterLink>
        </p>
      </div>
    </div>
  </main>
  <AuthSheet :open="sheet" :initial-mode="sheetMode" @close="sheet = false" @done="sheet = false" @google="google" />
  </div>
</template>
