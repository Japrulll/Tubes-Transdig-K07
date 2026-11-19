<script setup>
// Kia — maskot SETARA: tunas pohon kiara (Ficus) yang tumbuh seiring level pengunjung.
// stage 1 Tunas · 2 Daun · 3 Ranting · 4 Pohon · 5 Kiara Agung
// mood: wave | happy | think | cheer | sleep
import { computed } from 'vue'

const props = defineProps({
  mood: { type: String, default: 'happy' },
  stage: { type: Number, default: 1 },
  size: { type: [Number, String], default: 64 },
  still: { type: Boolean, default: false },
  label: { type: String, default: 'Kia, maskot SETARA' },
})

const LEAF = 'M0 0C5-6.5 15-6.5 20 0C15 6.5 5 6.5 0 0Z'
const leaf = (x, y, r, s = 1) => `translate(${x} ${y}) rotate(${r}) scale(${s})`
const st = computed(() => Math.min(5, Math.max(1, Math.round(props.stage))))

const arms = computed(() => {
  const restL = leaf(31, 101, 158, 0.85)
  const restR = leaf(89, 101, 22, 0.85)
  switch (props.mood) {
    case 'wave':
      return { left: restL, right: leaf(88, 96, -58, 0.9), waving: true }
    case 'cheer':
      return { left: leaf(32, 96, -122, 0.9), right: leaf(88, 96, -58, 0.9) }
    case 'think':
      return { left: restL, right: leaf(84, 110, -152, 0.75) }
    default:
      return { left: restL, right: restR }
  }
})

// Daun di kepala untuk tahap tunas–ranting
const sprout = computed(() => {
  if (st.value === 1)
    return { stem: 'M60 61V49', leaves: [leaf(60, 50, -150, 0.8), leaf(60, 50, -30, 0.8)] }
  if (st.value === 2)
    return { stem: 'M60 61V43', leaves: [leaf(60, 50, -155, 0.95), leaf(60, 47, -25, 0.95), leaf(60, 44, -90, 0.85)] }
  return {
    stem: 'M60 61V40M60 50Q68 44 77 41',
    leaves: [leaf(60, 52, -160, 1), leaf(60, 44, -110, 0.9), leaf(77, 41, -40, 0.9), leaf(77, 41, -100, 0.8), leaf(68, 46, -70, 0.7)],
  }
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 120 140"
    role="img"
    :aria-label="label"
    class="kia overflow-visible"
    :class="still ? '' : 'kia-bob'"
  >
    <!-- Mahkota pohon (tahap 4–5) -->
    <g v-if="st >= 4">
      <template v-if="st === 5">
        <!-- akar gantung khas pohon kiara -->
        <path d="M27 52v26M34 58v30M86 58v30M93 52v26M44 60v14M76 60v14" stroke="#246b61" stroke-width="2" stroke-linecap="round" fill="none" />
        <circle cx="30" cy="40" r="17" fill="#2f8577" />
        <circle cx="90" cy="40" r="17" fill="#2f8577" />
      </template>
      <circle cx="60" cy="34" :r="st === 5 ? 27 : 21" fill="#3f9e8e" />
      <circle :cx="st === 5 ? 40 : 44" cy="46" :r="st === 5 ? 19 : 15" fill="#2f8577" />
      <circle :cx="st === 5 ? 80 : 76" cy="46" :r="st === 5 ? 19 : 15" fill="#2f8577" />
      <circle cx="52" :cy="st === 5 ? 22 : 27" :r="st === 5 ? 12 : 9" fill="#5bb6a9" />
      <circle cx="72" cy="30" r="6" fill="#86cfc4" opacity=".8" />
      <g v-if="st === 5" fill="#ee7b5b">
        <circle cx="38" cy="36" r="2.6" /><circle cx="64" cy="18" r="2.6" /><circle cx="84" cy="34" r="2.6" /><circle cx="27" cy="46" r="2.2" /><circle cx="94" cy="47" r="2.2" /><circle cx="56" cy="44" r="2.2" />
      </g>
    </g>
    <!-- Tunas (tahap 1–3) -->
    <g v-else>
      <path :d="sprout.stem" stroke="#2f8577" stroke-width="3.2" stroke-linecap="round" fill="none" />
      <path v-for="(t, i) in sprout.leaves" :key="i" :d="LEAF" :transform="t" :fill="i % 2 ? '#86cfc4' : '#5bb6a9'" />
    </g>

    <!-- Lengan daun -->
    <path :d="LEAF" :transform="arms.left" fill="#2f8577" />
    <g :class="arms.waving && !still ? 'kia-wave' : ''" style="transform-origin: 88px 96px">
      <path :d="LEAF" :transform="arms.right" fill="#2f8577" />
    </g>

    <!-- Badan -->
    <path d="M60 60C83 60 92 79 92 98C92 118 78 128 60 128C42 128 28 118 28 98C28 79 37 60 60 60Z" fill="#3f9e8e" />
    <ellipse cx="60" cy="108" rx="20" ry="14" fill="#86cfc4" opacity=".55" />
    <ellipse cx="48" cy="128.5" rx="8" ry="3.6" fill="#17524b" />
    <ellipse cx="72" cy="128.5" rx="8" ry="3.6" fill="#17524b" />

    <!-- Wajah -->
    <g fill="#1d2b29" stroke="#1d2b29" stroke-linecap="round" stroke-width="2.6">
      <template v-if="mood === 'cheer'">
        <path d="M45.5 92.5Q50 87 54.5 92.5M65.5 92.5Q70 87 74.5 92.5" fill="none" />
      </template>
      <template v-else-if="mood === 'sleep'">
        <path d="M45.5 92Q50 96 54.5 92M65.5 92Q70 96 74.5 92" fill="none" />
      </template>
      <template v-else>
        <circle cx="50" :cy="mood === 'think' ? 89.5 : 92" r="4.3" stroke="none" />
        <circle cx="70" :cy="mood === 'think' ? 89.5 : 92" r="4.3" stroke="none" />
        <circle cx="51.4" :cy="mood === 'think' ? 88 : 90.4" r="1.4" fill="#fff" stroke="none" />
        <circle cx="71.4" :cy="mood === 'think' ? 88 : 90.4" r="1.4" fill="#fff" stroke="none" />
      </template>

      <path v-if="mood === 'happy' || mood === 'cheer'" d="M51.5 103Q60 115 68.5 103Z" stroke-width="2" stroke-linejoin="round" />
      <path v-else-if="mood === 'think'" d="M55 106.5Q59 104.5 64 106" fill="none" stroke-width="2.4" />
      <circle v-else-if="mood === 'sleep'" cx="60" cy="106" r="2.3" stroke="none" />
      <path v-else d="M53 104Q60 110.5 67 104" fill="none" stroke-width="2.6" />
    </g>
    <ellipse cx="42.5" cy="101" rx="5" ry="3" fill="#ff8e70" opacity=".5" />
    <ellipse cx="77.5" cy="101" rx="5" ry="3" fill="#ff8e70" opacity=".5" />

    <!-- Aksen suasana -->
    <g v-if="mood === 'think'" fill="#b5e4dc">
      <circle cx="98" cy="74" r="2.4" /><circle cx="104" cy="65" r="3.4" /><circle cx="111" cy="54" r="4.6" />
    </g>
    <g v-else-if="mood === 'sleep'" fill="#246b61" font-family="Plus Jakarta Sans, sans-serif" font-weight="800">
      <text x="92" y="72" font-size="11">z</text><text x="100" y="60" font-size="15">z</text>
    </g>
    <g v-else-if="mood === 'cheer'" fill="#f7ca63">
      <path d="M14 74l2.2 5.3 5.3 2.2-5.3 2.2L14 89l-2.2-5.3-5.3-2.2 5.3-2.2zM106 80l1.7 4 4 1.7-4 1.7-1.7 4-1.7-4-4-1.7 4-1.7z" />
    </g>
  </svg>
</template>

<style scoped>
.kia-bob {
  animation: kia-bob 3.2s ease-in-out infinite;
}
@keyframes kia-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3%);
  }
}
.kia-wave {
  animation: kia-wave 1.4s ease-in-out infinite;
}
@keyframes kia-wave {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-14deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .kia-bob,
  .kia-wave {
    animation: none;
  }
}
</style>
