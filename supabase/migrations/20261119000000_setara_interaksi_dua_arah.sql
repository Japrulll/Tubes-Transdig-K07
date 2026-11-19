-- SETARA — interaksi dua arah: kuis, misi, Tanya Kia, Tantangan Hari Ini,
-- serta tabel umpan balik ANONIM (hanya-tulis) untuk tim.
-- Bersifat ADITIF terhadap 20261116000000_setara_lengkapi_skema.sql.
-- Lokasi pengguna, foto misi, dan progres (bintang/XP) tetap hanya di ponsel.

-- 1) Konten interaksi (publik, hanya-baca) ----------------------------------

-- Kuis: 2 soal per spot + 2 soal per Wellness Trail
create table if not exists public.quiz_question (
  id bigint generated always as identity primary key,
  poi_id varchar references public.poi(id) on delete cascade,
  trail_id text references public.wellness_trail(id) on delete cascade,
  seq smallint not null,
  question text not null,
  options text[] not null,
  answer_index smallint not null,
  explanation text,
  constraint quiz_question_owner_check check ((poi_id is null) <> (trail_id is null)),
  constraint quiz_question_answer_check check (answer_index >= 0 and answer_index < coalesce(array_length(options, 1), 0))
);
create unique index if not exists quiz_question_poi_seq_idx on public.quiz_question (poi_id, seq) where poi_id is not null;
create unique index if not exists quiz_question_trail_seq_idx on public.quiz_question (trail_id, seq) where trail_id is not null;

-- Misi: 1 per spot (confirm = tombol "Sudah!", photo = foto disimpan di ponsel, timer = aktivitas berpemandu)
create table if not exists public.mission (
  poi_id varchar primary key references public.poi(id) on delete cascade,
  type text not null check (type in ('confirm', 'photo', 'timer')),
  title text not null,
  prompt text not null,
  done_label text,
  seconds int check (seconds is null or seconds between 10 and 600),
  cues jsonb not null default '[]' -- [{ at: detik, text }]
);

-- Tanya Kia: jawaban statis berbasis kata kunci (jawaban dinamis dihitung di aplikasi)
create table if not exists public.kia_faq (
  id text primary key,
  patterns text[] not null,
  answer text not null,
  poi_id varchar references public.poi(id) on delete set null,
  sort_order int not null default 0
);

-- Tantangan Hari Ini (bergilir per hari)
create table if not exists public.daily_challenge (
  id text primary key,
  title text not null,
  description text not null,
  goal_type text not null check (goal_type in ('listen', 'quiz', 'mission', 'photo', 'spot', 'trail', 'ask')),
  goal_count int not null default 1 check (goal_count > 0),
  before_time time,
  xp int not null default 25,
  sort_order int not null default 0
);

-- Jenis badge: stempel (lama) atau dari bintang/kebiasaan
alter table public.badge add column if not exists kind text not null default 'stamp';
alter table public.badge drop constraint if exists badge_kind_check;
alter table public.badge add constraint badge_kind_check check (kind in ('stamp', 'quiz', 'mission', 'photo', 'streak'));

alter table public.quiz_question enable row level security;
alter table public.mission enable row level security;
alter table public.kia_faq enable row level security;
alter table public.daily_challenge enable row level security;

drop policy if exists setara_read_quiz on public.quiz_question;
create policy setara_read_quiz on public.quiz_question for select to anon, authenticated using (true);
drop policy if exists setara_read_mission on public.mission;
create policy setara_read_mission on public.mission for select to anon, authenticated using (true);
drop policy if exists setara_read_faq on public.kia_faq;
create policy setara_read_faq on public.kia_faq for select to anon, authenticated using (true);
drop policy if exists setara_read_daily on public.daily_challenge;
create policy setara_read_daily on public.daily_challenge for select to anon, authenticated using (true);
grant select on public.quiz_question, public.mission, public.kia_faq, public.daily_challenge to anon, authenticated;

-- 2) Umpan balik anonim (HANYA-TULIS) ----------------------------------------
-- Tidak ada akun, tidak ada ID perangkat, tidak ada lokasi. Aplikasi hanya bisa INSERT;
-- tidak ada kebijakan SELECT untuk anon, jadi data hanya terbaca oleh tim lewat dashboard.

create table if not exists public.visitor_rating (
  id bigint generated always as identity primary key,
  poi_id varchar not null references public.poi(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  useful boolean,
  created_at timestamptz not null default now()
);

create table if not exists public.content_report (
  id bigint generated always as identity primary key,
  poi_id varchar references public.poi(id) on delete cascade,
  message text not null check (char_length(message) between 3 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_result (
  id bigint generated always as identity primary key,
  poi_id varchar references public.poi(id) on delete cascade,
  trail_id text references public.wellness_trail(id) on delete cascade,
  question_seq smallint not null check (question_seq between 1 and 10),
  correct_first_try boolean not null,
  attempts smallint not null check (attempts between 1 and 10),
  created_at timestamptz not null default now()
);

create table if not exists public.kia_question_log (
  id bigint generated always as identity primary key,
  question text not null check (char_length(question) between 2 and 200),
  created_at timestamptz not null default now()
);

alter table public.visitor_rating enable row level security;
alter table public.content_report enable row level security;
alter table public.quiz_result enable row level security;
alter table public.kia_question_log enable row level security;

drop policy if exists setara_insert_rating on public.visitor_rating;
create policy setara_insert_rating on public.visitor_rating for insert to anon, authenticated with check (true);
drop policy if exists setara_insert_report on public.content_report;
create policy setara_insert_report on public.content_report for insert to anon, authenticated with check (true);
drop policy if exists setara_insert_quiz_result on public.quiz_result;
create policy setara_insert_quiz_result on public.quiz_result for insert to anon, authenticated with check (true);
drop policy if exists setara_insert_kia_log on public.kia_question_log;
create policy setara_insert_kia_log on public.kia_question_log for insert to anon, authenticated with check (true);

revoke all on public.visitor_rating, public.content_report, public.quiz_result, public.kia_question_log from anon, authenticated;
grant insert on public.visitor_rating, public.content_report, public.quiz_result, public.kia_question_log to anon, authenticated;

-- Ringkasan untuk laporan tim (dibaca dari dashboard / service role, bukan oleh aplikasi)
create or replace view public.feedback_summary with (security_invoker = true) as
select p.id as poi_id, p.name,
       (select round(avg(r.rating)::numeric, 2) from public.visitor_rating r where r.poi_id = p.id) as avg_rating,
       (select count(*) from public.visitor_rating r where r.poi_id = p.id) as ratings,
       (select count(*) from public.visitor_rating r where r.poi_id = p.id and r.useful) as useful_votes,
       (select count(*) from public.content_report c where c.poi_id = p.id) as reports,
       (select round(100.0 * avg(case when q.correct_first_try then 1 else 0 end), 1) from public.quiz_result q where q.poi_id = p.id) as quiz_first_try_pct
from public.poi p
order by p.sort_order;
revoke all on public.feedback_summary from anon, authenticated;

-- 3) RPC konten aplikasi: tambahkan kuis, misi, Tanya Kia, tantangan, jenis badge ----
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
                               from public.poi_event e where e.poi_id = p.id), '[]'::jsonb),
        'quiz', coalesce((select jsonb_agg(jsonb_build_object('q', qq.question, 'options', qq.options,
                            'answer', qq.answer_index, 'explain', qq.explanation) order by qq.seq)
                          from public.quiz_question qq where qq.poi_id = p.id), '[]'::jsonb),
        'mission', (select jsonb_strip_nulls(jsonb_build_object('type', m.type, 'title', m.title, 'prompt', m.prompt,
                      'done_label', m.done_label, 'seconds', m.seconds, 'cues', m.cues))
                    from public.mission m where m.poi_id = p.id)
      ) order by p.sort_order, p.id)
      from public.poi p where p.is_published = true), '[]'::jsonb),
    'trails', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', w.id, 'name', w.name, 'subtitle', w.subtitle, 'description', w.description, 'level', w.level,
        'distance_m', w.distance_m, 'est_minutes', w.est_minutes, 'best_times', w.best_times, 'color', w.color, 'path', w.path,
        'checkpoints', coalesce((select jsonb_agg(jsonb_build_object(
            'seq', k.seq, 'name', k.name, 'poi_id', k.poi_id, 'radius_m', k.radius_m, 'exercise', k.exercise, 'coaching', k.coaching,
            'coords', jsonb_build_array(extensions.st_y(k.location::extensions.geometry), extensions.st_x(k.location::extensions.geometry)))
            order by k.seq) from public.trail_checkpoint k where k.trail_id = w.id), '[]'::jsonb),
        'quiz', coalesce((select jsonb_agg(jsonb_build_object('q', qq.question, 'options', qq.options,
                            'answer', qq.answer_index, 'explain', qq.explanation) order by qq.seq)
                          from public.quiz_question qq where qq.trail_id = w.id), '[]'::jsonb)
      ) order by w.sort_order)
      from public.wellness_trail w), '[]'::jsonb),
    'badges', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'description', b.description, 'poi_ids', b.poi_ids,
        'min_count', b.min_count, 'requires_trail', b.requires_trail, 'kind', b.kind, 'sort_order', b.sort_order) order by b.sort_order)
      from public.badge b), '[]'::jsonb),
    'faq', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'patterns', f.patterns, 'answer', f.answer, 'poi_id', f.poi_id) order by f.sort_order)
      from public.kia_faq f), '[]'::jsonb),
    'daily_challenges', coalesce((
      select jsonb_agg(jsonb_build_object('id', d.id, 'title', d.title, 'description', d.description, 'goal_type', d.goal_type,
        'goal_count', d.goal_count, 'before', to_char(d.before_time, 'HH24:MI'), 'xp', d.xp) order by d.sort_order)
      from public.daily_challenge d), '[]'::jsonb)
  );
$$;

grant execute on function public.get_app_content() to anon, authenticated;
