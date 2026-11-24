<script setup>
// Lembar masuk / daftar akun (Google atau email). Dipakai di Beranda.
import { computed, ref, watch } from 'vue'
import Icon from './Icon.vue'
import Kia from './Kia.vue'
import GoogleButton from './GoogleButton.vue'
import { auth, googleAvailable, signInWithEmail, signUpWithEmail, resetPassword } from '../stores/auth'

const props = defineProps({ open: Boolean, initialMode: { type: String, default: 'login' } })
const emit = defineEmits(['close', 'done', 'google'])

const mode = ref(props.initialMode) // login | register | reset
const name = ref('')
const email = ref('')
const password = ref('')
const showPw = ref(false)

watch(
  () => props.open,
  (v) => {
    if (!v) return
    mode.value = props.initialMode
    auth.error = null
    auth.notice = null
  }
)
watch(mode, () => {
  auth.error = null
  auth.notice = null
})

const title = computed(() => ({ login: 'Masuk ke SETARA', register: 'Buat akun SETARA', reset: 'Atur ulang kata sandi' })[mode.value])
const subtitle = computed(
  () =>
    ({
      login: 'Lanjutkan stempel, bintang, dan level Kia dari ponsel mana pun.',
      register: 'Gratis. Progresmu di ponsel ini langsung ikut tersimpan ke akun.',
      reset: 'Masukkan email akunmu, kami kirim tautan untuk membuat kata sandi baru.',
    })[mode.value]
)
const valid = computed(() => {
  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
  if (mode.value === 'reset') return okEmail
  if (mode.value === 'register') return okEmail && password.value.length >= 6 && name.value.trim().length >= 2
  return okEmail && password.value.length >= 1
})

async function submit() {
  if (!valid.value || auth.busy) return
  if (mode.value === 'login') {
    if (await signInWithEmail(email.value, password.value)) emit('done')
  } else if (mode.value === 'register') {
    const r = await signUpWithEmail(name.value, email.value, password.value)
    if (r && r !== 'confirm') emit('done')
    if (r === 'confirm') password.value = ''
  } else {
    await resetPassword(email.value)
  }
}
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="absolute inset-0 z-[940] bg-brand-950/40" @click="emit('close')" />
  </Transition>
  <Transition name="sheet-up">
    <section v-if="open" class="sheet safe-bottom absolute inset-x-0 bottom-0 z-[950] flex max-h-[92%] flex-col" role="dialog" :aria-label="title">
      <div class="sheet-handle shrink-0" />
      <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        <div class="flex items-start gap-3">
          <Kia :mood="auth.error ? 'think' : 'wave'" :stage="1" :size="48" class="shrink-0" />
          <div class="min-w-0 flex-1 pt-1">
            <h2 class="text-[19px] font-bold leading-tight text-ink">{{ title }}</h2>
            <p class="mt-1 text-[12px] leading-relaxed text-muted">{{ subtitle }}</p>
          </div>
          <button class="icon-btn -mr-2 -mt-1 size-10 text-muted" aria-label="Tutup" @click="emit('close')"><Icon name="x" /></button>
        </div>

        <template v-if="mode !== 'reset' && googleAvailable">
          <GoogleButton class="mt-5" :disabled="auth.busy" @click="emit('google')" />
          <div class="my-4 flex items-center gap-3 text-[11px] font-semibold text-subtle">
            <span class="h-px flex-1 bg-line" /> atau dengan email <span class="h-px flex-1 bg-line" />
          </div>
        </template>
        <div v-else class="h-4" />

        <form class="space-y-3" novalidate @submit.prevent="submit">
          <label v-if="mode === 'register'" class="field">
            <Icon name="user" :size="18" class="text-muted" />
            <input v-model="name" type="text" autocomplete="name" placeholder="Nama panggilan" aria-label="Nama panggilan" />
          </label>
          <label class="field">
            <Icon name="mail" :size="18" class="text-muted" />
            <input v-model="email" type="email" inputmode="email" autocomplete="email" placeholder="Email" aria-label="Email" />
          </label>
          <label v-if="mode !== 'reset'" class="field">
            <Icon name="lock" :size="18" class="text-muted" />
            <input
              v-model="password"
              :type="showPw ? 'text' : 'password'"
              :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
              :placeholder="mode === 'register' ? 'Kata sandi (min. 6 karakter)' : 'Kata sandi'"
              aria-label="Kata sandi"
            />
            <button type="button" class="-mr-1 grid size-9 place-items-center rounded-full text-muted" :aria-label="showPw ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'" @click="showPw = !showPw">
              <Icon name="eye" :size="18" :class="showPw ? 'text-brand-600' : ''" />
            </button>
          </label>

          <p v-if="auth.error" class="flex gap-2 rounded-2xl bg-coral-500/10 p-3 text-[12px] font-semibold leading-relaxed text-coral-600" role="alert">
            <Icon name="info" :size="16" class="mt-px shrink-0" /> {{ auth.error }}
          </p>
          <p v-if="auth.notice" class="flex gap-2 rounded-2xl bg-mint p-3 text-[12px] font-semibold leading-relaxed text-brand-800" role="status">
            <Icon name="mail" :size="16" class="mt-px shrink-0" /> {{ auth.notice }}
          </p>

          <button type="submit" class="btn-primary min-h-13 w-full" :disabled="!valid || auth.busy">
            <span v-if="auth.busy" class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            {{ mode === 'login' ? 'Masuk' : mode === 'register' ? 'Daftar & simpan progres' : 'Kirim tautan' }}
          </button>
        </form>

        <div class="mt-4 flex flex-col items-center gap-2 text-[13px]">
          <p v-if="mode === 'login'" class="text-muted">
            Belum punya akun?
            <button class="font-bold text-brand-700" @click="mode = 'register'">Daftar</button>
          </p>
          <p v-else class="text-muted">
            Sudah punya akun?
            <button class="font-bold text-brand-700" @click="mode = 'login'">Masuk</button>
          </p>
          <button v-if="mode === 'login'" class="text-[12px] font-semibold text-muted underline-offset-2 hover:underline" @click="mode = 'reset'">Lupa kata sandi?</button>
        </div>
        <p class="mt-4 text-center text-[11px] leading-relaxed text-subtle">
          Yang disimpan ke akun: stempel, bintang, XP, riwayat, dan preferensi audio. Lokasi dan foto Jurnal tetap hanya di ponselmu.
        </p>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.field {
  display: flex;
  min-height: 3.25rem;
  align-items: center;
  gap: 0.625rem;
  border-radius: 1rem;
  border: 1.5px solid var(--color-line);
  background: #fff;
  padding: 0 0.875rem;
  transition: border-color 0.15s;
}
.field:focus-within {
  border-color: var(--color-brand-500);
}
.field input {
  min-width: 0;
  flex: 1;
  background: transparent;
  font-size: 15px;
  outline: none;
}
.field input::placeholder {
  color: var(--color-subtle);
}
</style>
