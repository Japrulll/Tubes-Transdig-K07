// Klien Supabase bersama (dimuat saat dibutuhkan agar bundle awal tetap kecil).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'

export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

let client = null
export async function getSupabase() {
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js')
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  }
  return client
}
