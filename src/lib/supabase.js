// Klien Supabase (dimuat saat dibutuhkan agar bundle awal tetap kecil).
//
// Ada DUA klien terpisah:
//   - getSupabase()   → anonim, tanpa sesi. Dipakai untuk membaca konten taman dan mengirim
//                        umpan balik anonim, sehingga umpan balik tidak pernah membawa identitas akun.
//   - getAuthClient() → menyimpan sesi login (email) dan sinkronisasi progres pengguna.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'

export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

let createClientFn = null
async function loadCreateClient() {
  if (!createClientFn) createClientFn = (await import('@supabase/supabase-js')).createClient
  return createClientFn
}

let client = null
export async function getSupabase() {
  if (!client) {
    const createClient = await loadCreateClient()
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'setara-anon' },
    })
  }
  return client
}

let authClient = null
export async function getAuthClient() {
  if (!authClient) {
    const createClient = await loadCreateClient()
    authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // PKCE: hasil login kembali sebagai ?code=… (bukan #access_token=…) sehingga
        // tidak bentrok dengan router berbasis hash (#/home).
        flowType: 'pkce',
        detectSessionInUrl: true,
        storageKey: 'setara-auth',
      },
    })
  }
  return authClient
}
