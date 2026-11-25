<script setup>
// Ilustrasi spot bergaya hero SETARA (langit mint, matahari, awan, pohon bulat, figur koral).
// Dipakai sebagai visual POI selama foto survei tim belum diunggah ke Supabase (photo_urls).
import { computed } from 'vue'

const props = defineProps({
  art: { type: String, default: 'gate' },
  variant: { type: Number, default: 0 }, // 0 = siang, 1 = senja (diperbesar)
  label: { type: String, default: '' },
})

const uid = Math.random().toString(36).slice(2, 8)
const dusk = computed(() => props.variant % 2 === 1)
const sky = computed(() => (dusk.value ? ['#ffd8bd', '#cdeee8'] : ['#c8eee9', '#a9ddd6']))
const sun = computed(() => (dusk.value ? { x: 80, y: 92, r: 26, c: '#ff9b73' } : { x: 318, y: 58, r: 24, c: '#f7ca63' }))
</script>

<template>
  <svg viewBox="0 0 400 260" class="block h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" :aria-label="label">
    <defs>
      <linearGradient :id="`sky-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="sky[0]" />
        <stop offset="1" :stop-color="sky[1]" />
      </linearGradient>
    </defs>
    <rect width="400" height="260" :fill="`url(#sky-${uid})`" />
    <circle :cx="sun.x" :cy="sun.y" :r="sun.r" :fill="sun.c" />
    <g fill="#fff" opacity=".8">
      <rect x="40" y="40" width="70" height="18" rx="9" /><circle cx="70" cy="40" r="13" />
      <rect x="250" y="96" width="62" height="16" rx="8" /><circle cx="276" cy="96" r="11" />
    </g>

    <g :transform="dusk ? 'translate(-34 -36) scale(1.17)' : ''">
      <!-- bukit -->
      <path d="M-10 210 Q120 170 230 178 T410 196 V270 H-10Z" fill="#84cdc6" />

      <!-- ===== Gerbang ===== -->
      <g v-if="art === 'gate'">
        <rect x="120" y="110" width="22" height="100" rx="4" fill="#2f8577" />
        <rect x="258" y="110" width="22" height="100" rx="4" fill="#2f8577" />
        <path d="M112 116 Q200 66 288 116" stroke="#0d4f4a" stroke-width="14" fill="none" stroke-linecap="round" />
        <rect x="150" y="92" width="100" height="26" rx="8" fill="#fff" />
        <text x="200" y="110" text-anchor="middle" font-size="12" font-weight="800" fill="#0d4f4a" letter-spacing="1.5">KIARA ARTHA</text>
        <rect x="60" y="208" width="290" height="10" rx="5" fill="#dff3f6" />
        <g transform="translate(186 168)"><circle cx="8" cy="0" r="7" fill="#714d45" /><rect x="0" y="7" width="16" height="30" rx="7" fill="#ff7a59" /></g>
      </g>

      <!-- ===== Parkir ===== -->
      <g v-else-if="art === 'parking'">
        <rect x="0" y="196" width="400" height="40" fill="#cfe1dd" />
        <path d="M20 216 H380" stroke="#fff" stroke-width="4" stroke-dasharray="18 14" />
        <rect x="70" y="170" width="70" height="30" rx="10" fill="#ff8e70" /><rect x="82" y="160" width="44" height="18" rx="7" fill="#ffb39f" />
        <circle cx="88" cy="201" r="7" fill="#1d2b29" /><circle cx="124" cy="201" r="7" fill="#1d2b29" />
        <rect x="170" y="172" width="64" height="28" rx="10" fill="#5bb6a9" /><rect x="180" y="163" width="40" height="16" rx="7" fill="#86cfc4" />
        <circle cx="186" cy="201" r="7" fill="#1d2b29" /><circle cx="218" cy="201" r="7" fill="#1d2b29" />
        <rect x="300" y="110" width="6" height="90" fill="#477a71" />
        <rect x="282" y="84" width="42" height="42" rx="10" fill="#4a93c4" />
        <text x="303" y="114" text-anchor="middle" font-size="28" font-weight="800" fill="#fff">P</text>
      </g>

      <!-- ===== Air mancur ===== -->
      <g v-else-if="art === 'fountain'">
        <ellipse cx="200" cy="214" rx="170" ry="30" fill="#dff3f6" />
        <ellipse cx="200" cy="216" rx="156" ry="24" fill="#b6e5ec" />
        <g fill="none" stroke-linecap="round" stroke-width="5" :stroke="dusk ? '#ff9b73' : '#6cc0cf'">
          <path d="M200 210 V96" /><path d="M200 120 Q170 70 140 200" /><path d="M200 120 Q230 70 260 200" />
          <path d="M200 150 Q150 110 100 206" opacity=".7" /><path d="M200 150 Q250 110 300 206" opacity=".7" />
        </g>
        <g :fill="dusk ? '#f7ca63' : '#ffffff'"><circle cx="200" cy="90" r="6" /><circle cx="160" cy="96" r="4" /><circle cx="240" cy="96" r="4" /><circle cx="125" cy="150" r="3" /><circle cx="275" cy="150" r="3" /></g>
      </g>

      <!-- ===== Tematik Asia ===== -->
      <g v-else-if="art === 'asia'">
        <rect x="120" y="136" width="160" height="72" rx="6" fill="#f3e7d3" />
        <path d="M96 142 Q200 96 304 142 L290 132 Q200 92 110 132Z" fill="#0d4f4a" />
        <path d="M96 142 Q200 104 304 142" stroke="#0d4f4a" stroke-width="10" fill="none" stroke-linecap="round" />
        <rect x="186" y="160" width="28" height="48" rx="4" fill="#c25b42" />
        <rect x="136" y="156" width="34" height="24" rx="3" fill="#b6e5ec" /><rect x="230" y="156" width="34" height="24" rx="3" fill="#b6e5ec" />
        <g transform="translate(70 120)"><rect x="-2" y="-12" width="4" height="14" fill="#477a71" /><ellipse cx="0" cy="14" rx="12" ry="16" fill="#ee7b5b" /><rect x="-12" y="12" width="24" height="3" fill="#f7ca63" /></g>
        <g transform="translate(330 120)"><rect x="-2" y="-12" width="4" height="14" fill="#477a71" /><ellipse cx="0" cy="14" rx="12" ry="16" fill="#ee7b5b" /><rect x="-12" y="12" width="24" height="3" fill="#f7ca63" /></g>
      </g>

      <!-- ===== Spot foto ===== -->
      <g v-else-if="art === 'photo'">
        <ellipse cx="200" cy="222" rx="190" ry="22" fill="#b6e5ec" />
        <rect x="118" y="78" width="164" height="124" rx="12" fill="none" stroke="#fff" stroke-width="10" />
        <rect x="150" y="200" width="100" height="22" rx="8" fill="#0d4f4a" />
        <text x="200" y="215" text-anchor="middle" font-size="10" font-weight="800" fill="#fff" letter-spacing="1">ASIA AFRIKA</text>
        <path d="M200 196 V120" stroke="#6cc0cf" stroke-width="5" stroke-linecap="round" />
        <path d="M200 132 Q180 108 166 190 M200 132 Q220 108 234 190" stroke="#6cc0cf" stroke-width="4" fill="none" stroke-linecap="round" />
        <g transform="translate(300 166)"><circle cx="8" cy="0" r="7" fill="#714d45" /><rect x="0" y="7" width="16" height="30" rx="7" fill="#ff7a59" /><rect x="-14" y="10" width="16" height="11" rx="3" fill="#1d2b29" /></g>
      </g>

      <!-- ===== Jogging ===== -->
      <g v-else-if="art === 'jogging'">
        <path d="M-10 236 Q200 170 410 236" stroke="#f3e7d3" stroke-width="36" fill="none" />
        <path d="M-10 236 Q200 170 410 236" stroke="#fff" stroke-width="2" stroke-dasharray="10 10" fill="none" />
        <g transform="translate(180 150) rotate(-10)"><circle cx="10" cy="0" r="8" fill="#714d45" /><rect x="2" y="8" width="16" height="30" rx="7" fill="#ff7a59" />
          <path d="M6 36 L-4 54 M14 36 L26 50" stroke="#1d2b29" stroke-width="5" stroke-linecap="round" /><path d="M4 16 L-8 28 M16 16 L28 24" stroke="#ff7a59" stroke-width="5" stroke-linecap="round" /></g>
        <g transform="translate(300 120)"><rect x="0" y="0" width="44" height="30" rx="6" fill="#fff" /><text x="22" y="20" text-anchor="middle" font-size="10" font-weight="800" fill="#2f8577">START</text><rect x="20" y="30" width="4" height="60" fill="#477a71" /></g>
      </g>

      <!-- ===== Sepeda ===== -->
      <g v-else-if="art === 'bike'">
        <rect x="60" y="120" width="230" height="10" rx="5" fill="#0d4f4a" />
        <rect x="70" y="128" width="6" height="80" fill="#477a71" /><rect x="274" y="128" width="6" height="80" fill="#477a71" />
        <rect x="140" y="104" width="70" height="18" rx="6" fill="#ee7b5b" /><text x="175" y="117" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">SEWA</text>
        <g v-for="(x, i) in [100, 170, 240]" :key="i" :transform="`translate(${x} 182)`" fill="none" stroke-width="4">
          <circle cx="0" cy="12" r="14" stroke="#1d2b29" /><circle cx="42" cy="12" r="14" stroke="#1d2b29" />
          <path d="M0 12 L14 -6 H34 L42 12 M14 -6 L22 12 H0 M34 -6 L30 -16" :stroke="i === 1 ? '#ee7b5b' : '#3f9e8e'" stroke-linejoin="round" />
        </g>
      </g>

      <!-- ===== Kuliner ===== -->
      <g v-else-if="art === 'food'">
        <g v-for="(x, i) in [40, 150, 260]" :key="i" :transform="`translate(${x} 110)`">
          <rect x="6" y="34" width="88" height="66" rx="6" fill="#fff" />
          <path d="M0 34 H100 L92 10 H8 Z" :fill="['#ee7b5b', '#3f9e8e', '#f7ca63'][i]" />
          <path d="M8 34 v8 M28 34 v8 M50 34 v8 M72 34 v8 M92 34 v8" stroke="#fff" stroke-width="10" />
          <rect x="20" y="58" width="60" height="8" rx="4" fill="#d9f2ee" />
          <circle cx="36" cy="54" r="7" fill="#f9d98a" /><circle cx="62" cy="54" r="7" fill="#ffb39f" />
        </g>
      </g>

      <!-- ===== Kafe & padel ===== -->
      <g v-else-if="art === 'padel'">
        <rect x="150" y="120" width="220" height="92" rx="4" fill="#5bb6a9" />
        <rect x="150" y="120" width="220" height="92" rx="4" fill="none" stroke="#e3f5f8" stroke-width="6" opacity=".9" />
        <path d="M260 120 V212" stroke="#fff" stroke-width="3" /><path d="M150 166 H370" stroke="#fff" stroke-width="2" opacity=".7" />
        <g transform="translate(206 150) rotate(-20)"><ellipse cx="0" cy="0" rx="13" ry="16" fill="#ee7b5b" /><rect x="-3" y="14" width="6" height="18" rx="3" fill="#1d2b29" /></g>
        <circle cx="300" cy="140" r="6" fill="#f7ca63" />
        <path d="M30 120 Q72 92 114 120 Z" fill="#ee7b5b" /><rect x="70" y="120" width="4" height="70" fill="#477a71" />
        <rect x="44" y="180" width="56" height="8" rx="4" fill="#fff" /><rect x="58" y="164" width="12" height="16" rx="3" fill="#fff" />
      </g>

      <!-- ===== Area bermain ===== -->
      <g v-else-if="art === 'playground'">
        <path d="M70 210 L70 110 H120 L190 210" stroke="#ee7b5b" stroke-width="10" fill="none" stroke-linejoin="round" />
        <path d="M120 110 Q170 130 200 206" stroke="#f7ca63" stroke-width="16" fill="none" stroke-linecap="round" />
        <path d="M250 210 L280 110 L310 210 M280 110 H340 L360 210" stroke="#3f9e8e" stroke-width="7" fill="none" />
        <path d="M322 110 V170 M338 110 V170" stroke="#1d2b29" stroke-width="2" /><rect x="316" y="168" width="28" height="7" rx="3" fill="#ee7b5b" />
        <g transform="translate(220 96)"><rect x="-2" y="18" width="4" height="96" fill="#fff" /><circle cx="0" cy="0" r="22" fill="#ffb39f" /><path d="M0 0 m-14 0 a14 14 0 1 1 14 14" stroke="#fff" stroke-width="5" fill="none" /></g>
      </g>

      <!-- ===== Zona teduh ===== -->
      <g v-else-if="art === 'shade'">
        <rect x="186" y="110" width="16" height="104" fill="#477a71" />
        <circle cx="160" cy="96" r="54" fill="#149c85" /><circle cx="236" cy="92" r="58" fill="#149c85" /><circle cx="196" cy="58" r="50" fill="#1aa68e" />
        <ellipse cx="200" cy="216" rx="130" ry="12" fill="#5bb6a9" opacity=".5" />
        <rect x="236" y="186" width="80" height="8" rx="4" fill="#f3e7d3" /><rect x="244" y="194" width="5" height="18" fill="#477a71" /><rect x="304" y="194" width="5" height="18" fill="#477a71" />
        <g transform="translate(262 152)"><circle cx="8" cy="0" r="7" fill="#714d45" /><rect x="0" y="7" width="16" height="28" rx="7" fill="#ff7a59" /></g>
      </g>

      <!-- ===== Musala ===== -->
      <g v-else-if="art === 'musala'">
        <rect x="130" y="130" width="140" height="80" rx="6" fill="#fff" />
        <path d="M160 132 Q200 70 240 132 Z" fill="#3f9e8e" />
        <rect x="197" y="70" width="6" height="18" fill="#0d4f4a" /><circle cx="200" cy="66" r="5" fill="#f7ca63" />
        <path d="M184 210 V172 Q200 154 216 172 V210 Z" fill="#2f8577" />
        <rect x="146" y="156" width="22" height="26" rx="10" fill="#b6e5ec" /><rect x="232" y="156" width="22" height="26" rx="10" fill="#b6e5ec" />
        <rect x="292" y="150" width="56" height="60" rx="6" fill="#e3f5f8" /><text x="320" y="186" text-anchor="middle" font-size="14" font-weight="800" fill="#4a93c4">WC</text>
      </g>

      <!-- pohon latar (semua ilustrasi) -->
      <g v-if="art !== 'shade'">
        <g transform="translate(26 150)"><rect x="-4" y="20" width="8" height="46" fill="#477a71" /><circle cx="0" cy="12" r="26" fill="#149c85" /></g>
        <g transform="translate(372 160)"><rect x="-4" y="16" width="8" height="40" fill="#477a71" /><circle cx="0" cy="8" r="22" fill="#149c85" /></g>
      </g>
    </g>
  </svg>
</template>
