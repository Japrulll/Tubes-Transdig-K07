-- SETARA · Akun pengguna & sinkronisasi progres (24 Nov 2026)
-- Aditif dan aman dijalankan ulang. Jalankan di Supabase Dashboard → SQL Editor, lalu jalankan
-- supabase/seed.sql untuk memperbarui POI (Kampung Korea & Lolipops disembunyikan; gerbang utara,
-- gerbang timur, Food Court 2, dan Masjid Al-Maleeq ditambahkan).
--
-- Progres yang disimpan: stempel, bintang/XP, riwayat kunjungan, trail, dan preferensi audio.
-- TIDAK disimpan: lokasi GPS dan foto Jurnal Kunjungan (tetap hanya di ponsel).

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_progress_data_size check (pg_column_size(data) < 512000)
);

comment on table public.user_progress is 'Progres SETARA per akun (stempel, XP, riwayat). Hanya pemilik yang bisa membaca/menulis.';

alter table public.user_progress enable row level security;

drop policy if exists setara_progress_select on public.user_progress;
create policy setara_progress_select on public.user_progress for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists setara_progress_insert on public.user_progress;
create policy setara_progress_insert on public.user_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists setara_progress_update on public.user_progress;
create policy setara_progress_update on public.user_progress for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists setara_progress_delete on public.user_progress;
create policy setara_progress_delete on public.user_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.user_progress from anon;
grant select, insert, update, delete on public.user_progress to authenticated;
