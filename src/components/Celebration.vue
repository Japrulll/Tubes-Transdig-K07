<script setup>
// Perayaan: naik level (Kia tumbuh), badge baru, Tantangan Hari Ini selesai.
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import Kia from './Kia.vue'
import Icon from './Icon.vue'
import { celebrations, dismissCelebration, level } from '../stores/play'
import { chime, vibrate } from '../lib/audio'

const route = useRoute()
const item = computed(() => (route.name === 'onboarding' ? null : celebrations[0] || null))
watch(
  () => item.value?.id,
  (id) => {
    if (!id) return
    chime()
    vibrate([90, 60, 90, 60, 160])
  }
)
const icon = computed(() => ({ badge: 'award', daily: 'target', level: 'sparkle' })[item.value?.kind] || 'star')
</script>

<template>
  <Transition name="fade">
    <div v-if="item" class="absolute inset-0 z-[980] grid place-items-center bg-brand-950/55 px-8" role="alertdialog" :aria-label="item.title" @click.self="dismissCelebration">
      <div :key="item.id" class="celebrate-pop w-full max-w-[320px] rounded-[1.75rem] bg-white p-6 text-center shadow-2xl">
        <div class="relative mx-auto grid size-32 place-items-center rounded-full bg-gradient-to-b from-[#c8eee9] to-[#a9ddd6]">
          <span class="confetti" aria-hidden="true"><i v-for="n in 10" :key="n" :style="{ '--i': n }" /></span>
          <Kia mood="cheer" :stage="item.stage || level.level" :size="104" />
        </div>
        <p class="eyebrow mt-4 flex items-center justify-center gap-1.5 text-sun-600"><Icon :name="icon" :size="14" /> {{ { badge: 'Badge baru', daily: 'Tantangan harian', level: 'Naik level' }[item.kind] || 'Hore' }}</p>
        <h2 class="mt-1.5 text-[21px] font-semibold leading-tight text-ink">{{ item.title }}</h2>
        <p class="mt-1.5 text-[13px] leading-relaxed text-muted">{{ item.text }}</p>
        <p v-if="item.xp" class="mt-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-[12px] font-bold text-brand-700">+{{ item.xp }} XP</p>
        <button class="btn-primary mt-5 min-h-13 w-full" @click="dismissCelebration">Asyik!</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.celebrate-pop {
  animation: pop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.3) both;
}
@keyframes pop {
  from {
    transform: scale(0.85);
    opacity: 0;
  }
}
.confetti i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7px;
  height: 7px;
  border-radius: 2px;
  background: var(--color-coral-400);
  animation: burst 0.9s ease-out both;
  animation-delay: calc(var(--i) * 18ms);
  transform: rotate(calc(var(--i) * 36deg)) translateY(0);
}
.confetti i:nth-child(3n) {
  background: var(--color-sun-400);
}
.confetti i:nth-child(3n + 1) {
  background: var(--color-brand-400);
}
@keyframes burst {
  to {
    transform: rotate(calc(var(--i) * 36deg)) translateY(-78px);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .celebrate-pop,
  .confetti i {
    animation: none;
  }
  .confetti {
    display: none;
  }
}
</style>
