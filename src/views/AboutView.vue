<script setup>
import TopBar from '../components/TopBar.vue'
import Icon from '../components/Icon.vue'
import heroImg from '../assets/hero-setara.png'
import { content, syncContent, supabaseEnabled } from '../stores/content'
import { settings } from '../stores/settings'
import { useRouter } from 'vue-router'
import Kia from '../components/Kia.vue'
import { level } from '../stores/play'
import { photoCredits } from '../lib/mediaSlots'

const credits = photoCredits()

const router = useRouter()
const sourceLabel = { bundled: 'Dataset bawaan aplikasi (offline)', cache: 'Salinan Supabase tersimpan di ponsel', supabase: 'Supabase (terbaru)' }
const fmt = (t) => (t ? new Date(t).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '–')
function replayOnboarding() {
  settings.onboarded = false
  router.push('/onboarding')
}
</script>

<template>
  <main class="flex flex-col bg-canvas">
    <TopBar title="Tentang SETARA" />
    <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
      <img :src="heroImg" alt="" class="w-full rounded-3xl" />
      <h2 class="mt-5 text-[22px] font-medium text-ink">SETARA <span class="text-muted">· Sekitar Kiara Artha</span></h2>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">
        Pemandu eksplorasi berbasis lokasi untuk pengunjung {{ content.park.name }}, Bandung: location trigger GPS (dengan QR sebagai cadangan), narasi audio,
        pencarian & navigasi, rekomendasi sesuai waktu, Wellness Trail, dan koleksi stempel.
      </p>
      <div class="mt-4 flex gap-3 rounded-2xl bg-mint p-4">
        <Kia mood="wave" :stage="level.level" :size="56" class="shrink-0" />
        <p class="text-[12px] leading-relaxed text-muted">
          <span class="block text-[14px] font-bold text-ink">Kia, teman jelajahmu</span>
          Kia adalah tunas pohon kiara (Ficus), pohon yang konon menjadi asal nama Kiaracondong. Kia bercerita di setiap spot, memberi kuis dan misi,
          menjawab pertanyaan secara offline, lalu tumbuh dari Tunas sampai Kiara Agung seiring bintang yang kamu kumpulkan.
        </p>
      </div>
      <dl class="mt-4 grid grid-cols-2 gap-2 text-[12px]">
        <div class="card p-3"><dt class="text-subtle">Alamat</dt><dd class="mt-0.5 font-semibold text-ink">{{ content.park.address }}</dd></div>
        <div class="card p-3"><dt class="text-subtle">Jam buka</dt><dd class="mt-0.5 font-semibold text-ink">{{ content.park.opening_hours.open.replace(':', '.') }}–{{ content.park.opening_hours.close.replace(':', '.') }} WIB</dd></div>
        <div class="card p-3"><dt class="text-subtle">Tiket</dt><dd class="mt-0.5 font-semibold text-ink">{{ content.park.ticket }}</dd></div>
        <div class="card p-3"><dt class="text-subtle">Info resmi</dt><dd class="mt-0.5 font-semibold text-ink">{{ content.park.instagram }} · {{ content.park.phone }}</dd></div>
      </dl>

      <section class="mt-6 card p-4">
        <p class="eyebrow">Sumber konten</p>
        <p class="mt-2 text-[13px] text-ink">{{ sourceLabel[content.source] }}</p>
        <p class="mt-0.5 text-[11px] text-muted">Versi data {{ content.version }} · sinkron terakhir {{ fmt(content.syncedAt) }}</p>
        <p v-if="content.syncError" class="mt-2 rounded-lg bg-coral-500/10 p-2 text-[11px] text-coral-600">Sinkronisasi gagal: {{ content.syncError }}</p>
        <p v-if="!supabaseEnabled" class="mt-2 text-[11px] text-muted">Kunci Supabase belum diatur; aplikasi memakai dataset bawaan.</p>
        <button v-else class="btn-outline mt-3 min-h-10 w-full text-[13px]" :disabled="content.syncing" @click="syncContent">
          <Icon name="refresh" :size="15" :class="content.syncing ? 'animate-spin' : ''" /> {{ content.syncing ? 'Menyinkronkan…' : 'Sinkronkan konten' }}
        </button>
      </section>

      <section class="mt-4 card p-4">
        <p class="eyebrow">Referensi data</p>
        <ul class="mt-2 space-y-2 text-[12px]">
          <li v-for="s in content.park.sources" :key="s.url">
            <a :href="s.url" target="_blank" rel="noopener" class="font-semibold text-brand-700 hover:underline">{{ s.label }}</a>
          </li>
        </ul>
        <p class="mt-3 text-[11px] leading-relaxed text-muted">Koordinat {{ content.pois.length }} spot diambil dari Google Maps dan OpenStreetMap (16 &amp; 24 Nov 2026) dan perlu divalidasi saat survei lapangan. Ilustrasi spot dipakai sampai foto tim ditambahkan.</p>
        <template v-if="credits.length">
          <p class="eyebrow mt-4">Kredit foto</p>
          <ul class="mt-1.5 space-y-1 text-[11px] text-muted">
            <li v-for="c in credits" :key="c.key">{{ c.key.replace('foto/', '').toUpperCase() }} · {{ c.credit }}</li>
          </ul>
        </template>
      </section>

      <p class="mt-6 text-center text-[11px] text-subtle">Kelompok 07 · II4011 Transformasi Digital · STEI ITB 2026</p>
      <button class="btn-ghost mx-auto mt-2 flex text-[12px]" @click="replayOnboarding">Tampilkan pengenalan lagi</button>
    </div>
  </main>
</template>
