<script setup>
import { useRouter } from 'vue-router'
import Icon from "./Icon.vue"
import iconLocate from "../assets/icon-locate.png"
import { settings } from '../stores/settings'
import { setSimulation } from '../stores/location'
import { stampCount } from '../stores/visits'
import { content } from '../stores/content'
import { level, play } from '../stores/play'
import { openKia } from '../stores/ui'
import { auth, isLoggedIn, profile } from '../stores/auth'
import { remindersSupported, syncReminders } from '../lib/reminders'
import Kia from './Kia.vue'
import { ref } from 'vue'

defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const router = useRouter()

const go = (to) => {
  emit('close')
  router.push(to)
}
const reminderNote = ref('')
async function toggleReminders(on) {
  settings.reminders = on
  const r = await syncReminders()
  reminderNote.value = r === 'denied' ? 'Izin notifikasi ditolak di pengaturan ponsel.' : r === 'ok' ? 'Sabtu & Minggu 06.30, setiap hari 18.00.' : ''
}
function askKia() {
  emit('close')
  openKia()
}
const items = [
  { to: '/home', icon: 'home', label: 'Beranda' },
  { to: '/stamps', icon: 'award', label: 'Koleksi & Progres' },
  { to: '/summary', icon: 'flag', label: 'Ringkasan Kunjungan' },
  { to: '/trail', icon: 'trail', label: 'Wellness Trail' },
  { to: '/qr', icon: 'qr', label: 'Scan QR Spot' },
  { to: '/privacy', icon: 'shield', label: 'Privasi Lokasi' },
  { to: '/about', icon: 'info', label: 'Tentang & Sumber Data' },
]
const tools = [
  { to: '/log', icon: 'list', label: 'Log Trigger & Uji' },
  { to: '/print-qr', icon: 'printer', label: 'Cetak QR Spot' },
]
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="absolute inset-0 z-[950] bg-brand-950/40" @click="emit('close')" />
  </Transition>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="-translate-x-full"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="-translate-x-full"
  >
    <aside v-if="open" class="safe-top absolute inset-y-0 left-0 z-[960] flex w-[82%] max-w-[320px] flex-col bg-canvas shadow-2xl" aria-label="Menu">
      <div class="flex items-center justify-between px-5 pt-5">
        <div class="flex items-center gap-2 text-brand-900">
          <img :src="iconLocate" alt="" class="size-9" />
          <span class="text-lg font-extrabold tracking-[0.18em]">SETARA</span>
        </div>
        <button class="icon-btn" aria-label="Tutup menu" @click="emit('close')"><Icon name="x" /></button>
      </div>
      <p class="px-5 pt-1 text-xs text-muted">Sekitar Kiara Artha · {{ stampCount }}/{{ content.pois.length }} stempel</p>

      <!-- Akun -->
      <button v-if="isLoggedIn" class="mx-3 mt-3 flex items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left" @click="go('/home')">
        <img v-if="profile.avatar" :src="profile.avatar" referrerpolicy="no-referrer" alt="" class="size-10 shrink-0 rounded-full object-cover" />
        <span v-else class="grid size-10 shrink-0 place-items-center rounded-full bg-brand-500 text-[13px] font-bold text-white">{{ profile.initials }}</span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[14px] font-bold text-ink">{{ profile.name }}</span>
          <span class="flex items-center gap-1 text-[11px]" :class="auth.sync.status === 'error' ? 'text-coral-600' : 'text-muted'">
            <Icon :name="auth.sync.status === 'synced' ? 'cloud-check' : 'cloud'" :size="13" />
            {{ { synced: 'Progres tersimpan di akun', syncing: 'Menyimpan…', pending: 'Menunggu disimpan', error: 'Gagal menyimpan' }[auth.sync.status] || 'Akun SETARA' }}
          </span>
        </span>
        <Icon name="chevron-right" :size="18" class="text-subtle" />
      </button>
      <button v-else class="mx-3 mt-3 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-3 text-left" @click="go('/home?login=1')">
        <span class="grid size-10 shrink-0 place-items-center rounded-full bg-white text-brand-700"><Icon name="user" :size="19" /></span>
        <span class="min-w-0 flex-1">
          <span class="block text-[14px] font-bold text-ink">Masuk / Daftar</span>
          <span class="block text-[11px] text-muted">Simpan stempel & bintang ke akunmu</span>
        </span>
        <Icon name="chevron-right" :size="18" class="text-brand-600" />
      </button>
      <button class="mx-3 mt-2 flex items-center gap-3 rounded-2xl bg-mint p-3 text-left" @click="askKia">
        <Kia mood="wave" :stage="level.level" :size="44" class="shrink-0" />
        <span class="min-w-0 flex-1">
          <span class="block text-[14px] font-bold text-ink">Tanya Kia</span>
          <span class="block text-[11px] text-muted">Kia si {{ level.name }} · {{ play.xp }} XP</span>
        </span>
        <Icon name="chat" :size="19" class="text-brand-700" />
      </button>

      <nav class="mt-4 flex-1 overflow-y-auto px-3 pb-6">
        <button v-for="i in items" :key="i.to" class="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-ink hover:bg-white" @click="go(i.to)">
          <Icon :name="i.icon" :size="19" class="text-brand-600" /> {{ i.label }}
        </button>

        <div class="mx-3 my-3 border-t border-line" />
        <label class="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold">
          <Icon name="volume" :size="19" class="text-brand-600" />
          <span class="flex-1">Mode Audio<br /><span class="text-[11px] font-normal text-muted">Narasi otomatis saat trigger</span></span>
          <input v-model="settings.audioMode" type="checkbox" class="size-5 accent-brand-500" />
        </label>
        <label class="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold">
          <Icon name="moon" :size="19" class="text-brand-600" />
          <span class="flex-1">Mode tenang<br /><span class="text-[11px] font-normal text-muted">Kia tidak menampilkan ajakan</span></span>
          <input v-model="settings.quiet" type="checkbox" class="size-5 accent-brand-500" />
        </label>
        <label class="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold">
          <Icon name="chat" :size="19" class="text-brand-600" />
          <span class="flex-1">Suara Kia<br /><span class="text-[11px] font-normal text-muted">Jawaban Tanya Kia dibacakan</span></span>
          <input v-model="settings.kiaVoice" type="checkbox" class="size-5 accent-brand-500" />
        </label>
        <label v-if="remindersSupported" class="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold">
          <Icon name="bell" :size="19" class="text-brand-600" />
          <span class="flex-1">Pengingat jadwal<br /><span class="text-[11px] font-normal text-muted">{{ reminderNote || 'Jogging akhir pekan & air mancur malam' }}</span></span>
          <input :checked="settings.reminders" type="checkbox" class="size-5 accent-brand-500" @change="toggleReminders($event.target.checked)" />
        </label>
        <label class="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold">
          <Icon name="walk" :size="19" class="text-brand-600" />
          <span class="flex-1">Panduan suara navigasi</span>
          <input v-model="settings.navVoice" type="checkbox" class="size-5 accent-brand-500" />
        </label>
        <label class="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold">
          <Icon name="pin" :size="19" class="text-coral-500" />
          <span class="flex-1">Mode Simulasi Lokasi<br /><span class="text-[11px] font-normal text-muted">Ketuk peta untuk berpindah (uji/demo)</span></span>
          <input :checked="settings.simulation" type="checkbox" class="size-5 accent-coral-500" @change="setSimulation($event.target.checked)" />
        </label>

        <div class="mx-3 my-3 border-t border-line" />
        <p class="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-subtle">Untuk tim & pengelola</p>
        <button v-for="i in tools" :key="i.to" class="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-ink hover:bg-white" @click="go(i.to)">
          <Icon :name="i.icon" :size="19" class="text-brand-600" /> {{ i.label }}
        </button>

        <template v-if="isLoggedIn">
          <div class="mx-3 my-3 border-t border-line" />
          <button class="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-coral-600 hover:bg-white" @click="go('/home?logout=1')">
            <Icon name="logout" :size="19" /> Keluar dari akun
          </button>
        </template>
      </nav>
    </aside>
  </Transition>
</template>
