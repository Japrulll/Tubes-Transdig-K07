-- SETARA — melengkapi skema yang sudah dibuat tim (poi, category, poi_category,
-- trivia, photo, audio, schedule + PostGIS). Semua perubahan bersifat ADITIF:
-- tidak ada tabel/kolom lama yang dihapus.
-- Lokasi pengguna tetap tidak pernah dikirim/disimpan ke server (A03, NG04).

-- 1) Kolom konten tambahan untuk POI (F03, F04, F05, F07)
alter table public.poi
  add column if not exists short_name text,
  add column if not exists summary text,
  add column if not exists narration text,
  add column if not exists activities text[] not null default '{}',
  add column if not exists tips text[] not null default '{}',
  add column if not exists best_times text[] not null default '{}',
  add column if not exists keywords text[] not null default '{}',
  add column if not exists art text,
  add column if not exists status_note text,
  add column if not exists source_place text,
  add column if not exists sort_order int;

comment on column public.poi.narration is 'Naskah narasi audio 30–60 detik (dibacakan TTS bila berkas audio belum ada)';
comment on column public.poi.best_times is 'Slot waktu yang cocok: pagi | siang | sore | malam (rekomendasi F07)';
comment on column public.poi.source_place is 'Nama tempat di Google Maps yang menjadi acuan koordinat';

-- Koordinat kini berasal dari Google Maps
alter table public.poi drop constraint if exists poi_data_source_check;
alter table public.poi add constraint poi_data_source_check
  check (data_source = any (array['simulation', 'survey', 'official', 'google_maps']));

-- Indeks spasial GiST untuk query ST_DWithin / ST_Distance
create index if not exists poi_location_gix on public.poi using gist (location);

-- 2) Atribut tampilan kategori
alter table public.category
  add column if not exists color text,
  add column if not exists icon text,
  add column if not exists sort_order int;

-- 3) Jadwal atraksi (mis. pertunjukan air mancur; bisa >1 kali per hari)
create table if not exists public.poi_event (
  id bigint generated always as identity primary key,
  poi_id varchar not null references public.poi(id) on delete cascade,
  title text not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time,
  notes text
);
create index if not exists poi_event_poi_idx on public.poi_event (poi_id);

-- 4) Wellness Trail (F08)
create table if not exists public.wellness_trail (
  id text primary key,
  name text not null,
  subtitle text,
  description text,
  level text,
  distance_m int not null,
  est_minutes int not null,
  best_times text[] not null default '{}',
  color text,
  path jsonb not null default '[]', -- [[lat, lng], ...]
  sort_order int not null default 0
);

create table if not exists public.trail_checkpoint (
  id bigint generated always as identity primary key,
  trail_id text not null references public.wellness_trail(id) on delete cascade,
  seq int not null,
  name text not null,
  poi_id varchar references public.poi(id) on delete set null,
  location extensions.geography(Point, 4326) not null,
  radius_m int not null default 25 check (radius_m between 10 and 60),
  exercise text,
  coaching text not null,
  unique (trail_id, seq)
);
create index if not exists trail_checkpoint_poi_idx on public.trail_checkpoint (poi_id);

-- 5) Badge koleksi stempel (A01)
create table if not exists public.badge (
  id text primary key,
  name text not null,
  description text not null,
  poi_ids text[] not null default '{}',
  min_count int not null default 1,
  requires_trail boolean not null default false,
  sort_order int not null default 0
);

-- 6) Info taman (pusat peta, lingkar jalan, jam buka, sumber data)
create table if not exists public.park_info (
  id text primary key,
  data jsonb not null,
  version text not null,
  updated_at timestamptz not null default now()
);

-- 7) RLS: konten publik hanya-baca
alter table public.poi_category enable row level security;
alter table public.poi_event enable row level security;
alter table public.wellness_trail enable row level security;
alter table public.trail_checkpoint enable row level security;
alter table public.badge enable row level security;
alter table public.park_info enable row level security;

drop policy if exists setara_read_poi_category on public.poi_category;
create policy setara_read_poi_category on public.poi_category for select to anon, authenticated
  using (exists (select 1 from public.poi p where p.id = poi_category.poi_id and p.is_published = true));

drop policy if exists setara_read_content on public.poi_event;
create policy setara_read_content on public.poi_event for select to anon, authenticated
  using (exists (select 1 from public.poi p where p.id = poi_event.poi_id and p.is_published = true));

drop policy if exists setara_read_trail on public.wellness_trail;
create policy setara_read_trail on public.wellness_trail for select to anon, authenticated using (true);
drop policy if exists setara_read_checkpoint on public.trail_checkpoint;
create policy setara_read_checkpoint on public.trail_checkpoint for select to anon, authenticated using (true);
drop policy if exists setara_read_badge on public.badge;
create policy setara_read_badge on public.badge for select to anon, authenticated using (true);
drop policy if exists setara_read_park on public.park_info;
create policy setara_read_park on public.park_info for select to anon, authenticated using (true);

grant select on public.poi_event, public.wellness_trail, public.trail_checkpoint, public.badge, public.park_info to anon, authenticated;

-- 8) Bucket publik untuk foto & narasi survei tim.
--    Unggah berkas sesuai file_path di tabel photo/audio (mis. foto/p01_1.jpg, audio/p01.mp3);
--    aplikasi otomatis memakainya, dan memakai ilustrasi/TTS selama berkas belum ada.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('poi-media', 'poi-media', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav'])
on conflict (id) do nothing;

-- 9) Satu RPC untuk seluruh konten aplikasi (dibaca sekali lalu disimpan offline di ponsel)
create or replace function public.get_app_content()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'version', (select pi.version from public.park_info pi where pi.id = 'kiara-artha'),
    'park', (select pi.data from public.park_info pi where pi.id = 'kiara-artha'),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'label', c.name, 'description', c.description,
        'color', c.color, 'icon', c.icon, 'sort_order', c.sort_order) order by c.sort_order, c.id)
      from public.category c), '[]'::jsonb),
    'pois', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'short_name', coalesce(p.short_name, p.name),
        'category_id', p.category_id,
        'secondary_category_id', (select pc.category_id from public.poi_category pc
                                  where pc.poi_id = p.id and pc.category_id <> p.category_id
                                  order by pc.category_id limit 1),
        'location_label', p.zone,
        'source', p.source_place,
        'data_source', p.data_source,
        'lat', extensions.st_y(p.location::extensions.geometry),
        'lng', extensions.st_x(p.location::extensions.geometry),
        'radius_m', p.radius_m,
        'art', p.art,
        'summary', p.summary,
        'description', p.description,
        'trigger_response', p.trigger_response,
        'narration', p.narration,
        'activities', p.activities,
        'tips', p.tips,
        'best_times', p.best_times,
        'keywords', p.keywords,
        'status_note', p.status_note,
        'sort_order', p.sort_order,
        'qr_code', p.qr_code,
        'trivia', coalesce((select jsonb_agg(t.content order by t.id) from public.trivia t where t.poi_id = p.id), '[]'::jsonb),
        'photos', coalesce((select jsonb_agg(jsonb_build_object('src', f.file_path, 'caption', f.caption)
                             order by f.display_order, f.id) from public.photo f where f.poi_id = p.id), '[]'::jsonb),
        'audio', (select jsonb_build_object('src', a.file_path, 'duration_s', a.duration_seconds, 'language', a.language_code)
                  from public.audio a where a.poi_id = p.id),
        'hours', coalesce((select jsonb_agg(jsonb_build_object('days', jsonb_build_array(s.day_of_week),
                             'open', to_char(s.open_time, 'HH24:MI'), 'close', to_char(s.close_time, 'HH24:MI'))
                             order by s.day_of_week)
                           from public.schedule s where s.poi_id = p.id and not coalesce(s.is_closed, false)), '[]'::jsonb),
        'schedules', coalesce((select jsonb_agg(jsonb_build_object('title', e.title, 'days', jsonb_build_array(e.day_of_week),
                                 'start', to_char(e.start_time, 'HH24:MI'), 'end', to_char(e.end_time, 'HH24:MI'))
                                 order by e.day_of_week, e.start_time)
                               from public.poi_event e where e.poi_id = p.id), '[]'::jsonb)
      ) order by p.sort_order, p.id)
      from public.poi p where p.is_published = true), '[]'::jsonb),
    'trails', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', w.id, 'name', w.name, 'subtitle', w.subtitle, 'description', w.description, 'level', w.level,
        'distance_m', w.distance_m, 'est_minutes', w.est_minutes, 'best_times', w.best_times, 'color', w.color, 'path', w.path,
        'checkpoints', coalesce((select jsonb_agg(jsonb_build_object(
            'seq', k.seq, 'name', k.name, 'poi_id', k.poi_id, 'radius_m', k.radius_m, 'exercise', k.exercise, 'coaching', k.coaching,
            'coords', jsonb_build_array(extensions.st_y(k.location::extensions.geometry), extensions.st_x(k.location::extensions.geometry)))
            order by k.seq) from public.trail_checkpoint k where k.trail_id = w.id), '[]'::jsonb)
      ) order by w.sort_order)
      from public.wellness_trail w), '[]'::jsonb),
    'badges', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'description', b.description, 'poi_ids', b.poi_ids,
        'min_count', b.min_count, 'requires_trail', b.requires_trail, 'sort_order', b.sort_order) order by b.sort_order)
      from public.badge b), '[]'::jsonb)
  );
$$;

grant execute on function public.get_app_content() to anon, authenticated;

-- 10) Validasi spasial untuk tim (bukan dipanggil aplikasi): POI dalam radius dari sebuah titik
create or replace function public.pois_within(p_lat double precision, p_lng double precision, p_meters double precision default 50)
returns table (id varchar, name varchar, radius_m int, distance_m double precision)
language sql
stable
set search_path = ''
as $$
  select p.id, p.name, p.radius_m,
         extensions.st_distance(p.location, extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography)
  from public.poi p
  where extensions.st_dwithin(p.location, extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography, p_meters)
  order by 4;
$$;
revoke execute on function public.pois_within(double precision, double precision, double precision) from public, anon;
grant execute on function public.pois_within(double precision, double precision, double precision) to authenticated;
