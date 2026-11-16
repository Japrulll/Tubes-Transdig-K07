<script setup>
import { useRouter } from 'vue-router'
import Icon from './Icon.vue'

const props = defineProps({
  title: { type: String, default: '' },
  back: { type: [String, Boolean], default: true }, // true = history back, string = rute tujuan
  transparent: { type: Boolean, default: false },
})
const router = useRouter()
function goBack() {
  if (typeof props.back === 'string') router.push(props.back)
  else if (window.history.state?.back) router.back()
  else router.push('/explore')
}
</script>

<template>
  <header
    class="safe-top relative z-[500] shrink-0"
    :class="transparent ? 'bg-transparent' : 'border-b border-line/60 bg-canvas/95 backdrop-blur'"
  >
    <div class="flex h-14 items-center gap-1 px-2">
      <button v-if="back" class="icon-btn" aria-label="Kembali" @click="goBack">
        <Icon name="chevron-left" :size="24" />
      </button>
      <slot name="left" />
      <h1 class="min-w-0 flex-1 truncate text-center text-base font-bold text-ink" :class="back ? 'pr-0' : 'pl-2'">{{ title }}</h1>
      <div class="flex min-w-11 items-center justify-end">
        <slot name="right" />
      </div>
    </div>
  </header>
</template>
