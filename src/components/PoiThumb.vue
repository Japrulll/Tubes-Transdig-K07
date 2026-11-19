<script setup>
import { computed, watchEffect } from 'vue'
import PoiArt from './PoiArt.vue'
import { probeImage, imageReady } from '../lib/media'

const props = defineProps({
  poi: { type: Object, required: true },
  size: { type: String, default: 'size-11' },
  variant: { type: Number, default: 0 },
})
const url = computed(() => props.poi.photo_thumb || props.poi.photo_urls?.[0] || null)
watchEffect(() => probeImage(url.value))
</script>

<template>
  <div class="relative shrink-0 overflow-hidden rounded-xl bg-mint" :class="size">
    <img v-if="url && imageReady(url)" :src="url" :alt="poi.name" class="h-full w-full object-cover" loading="lazy" />
    <PoiArt v-else :art="poi.art" :variant="variant" :label="poi.name" />
  </div>
</template>
