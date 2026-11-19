<script setup>
// Bintang per spot: ⭐ dengar cerita · ⭐ kuis benar · ⭐ misi selesai
defineProps({
  count: { type: Number, default: 0 },
  size: { type: Number, default: 16 },
})
import Icon from './Icon.vue'
</script>

<template>
  <span class="inline-flex items-center gap-0.5" role="img" :aria-label="`${count} dari 3 bintang`">
    <Icon
      v-for="i in 3"
      :key="i"
      name="star"
      :size="size"
      :stroke="1.8"
      :fill="i <= count"
      :class="i <= count ? 'text-sun-400' : 'text-line'"
    />
  </span>
</template>
