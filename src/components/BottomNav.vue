<script setup>
import { useRoute } from 'vue-router'
import Icon from './Icon.vue'

const route = useRoute()
const tabs = [
  { to: '/explore', label: 'Explore', icon: 'compass', match: ['explore'] },
  { to: '/search', label: 'Cari', icon: 'search', match: ['search'] },
  { to: '/trail', label: 'Trail', icon: 'trail', match: ['trail'] },
  { to: '/stamps', label: 'Stempel', icon: 'user', match: ['stamps', 'summary'] },
]
</script>

<template>
  <nav class="safe-bottom relative z-[500] border-t border-line bg-white" aria-label="Navigasi utama">
    <ul class="grid grid-cols-4">
      <li v-for="t in tabs" :key="t.to">
        <RouterLink
          :to="t.to"
          class="flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold"
          :class="t.match.includes(route.name) ? 'text-brand-800' : 'text-subtle'"
          :aria-current="t.match.includes(route.name) ? 'page' : undefined"
        >
          <span
            class="grid h-7 w-12 place-items-center rounded-full transition"
            :class="t.match.includes(route.name) ? 'bg-brand-100' : ''"
          >
            <Icon :name="t.icon" :size="19" :stroke="t.match.includes(route.name) ? 2.4 : 2" />
          </span>
          {{ t.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
