-- Cadangan isi database SETARA SEBELUM pembaruan konten 16 Nov 2026.
-- Semua baris saat itu masih data simulasi (koordinat grid -6.91/107.65, trivia "Informasi simulasi…").
-- Jalankan skrip ini hanya bila ingin mengembalikan data simulasi tersebut.
begin;

update public.poi p set
  name = v.name, category_id = v.cat, zone = null, radius_m = v.r,
  location = extensions.st_setsrid(extensions.st_makepoint(v.lng, v.lat), 4326)::extensions.geography,
  description = null, trigger_response = null, qr_code = 'SETARA:POI:' || v.id, data_source = 'simulation', is_published = true
from (values
  ('P01','Pintu Utama','akses',-6.91,107.65,25),
  ('P02','Gerbang Area Parkir','akses',-6.91,107.65027,25),
  ('P03','Danau & Air Mancur Menari','atraksi',-6.91,107.6509,30),
  ('P04','Area Tematik Asia','atraksi',-6.91,107.65135,25),
  ('P05','Spot Foto Ikonik','atraksi',-6.91045,107.65,25),
  ('P06','Titik Start Jogging Track','wellness',-6.91045,107.65045,30),
  ('P07','Selter Sepeda BOSEH','wellness',-6.91045,107.6509,25),
  ('P08','Area Kuliner/Food Court','kuliner',-6.91045,107.65135,30),
  ('P09','Area Kafe & Lapangan Padel','kuliner',-6.9109,107.65,30),
  ('P10','Area Bermain Anak','keluarga',-6.9109,107.65045,30),
  ('P11','Zona Relaksasi/Spot Teduh','wellness',-6.9109,107.6509,25),
  ('P12','Musala & Toilet','fasilitas',-6.9109,107.65135,25)
) as v(id, name, cat, lat, lng, r)
where p.id = v.id;

delete from public.trivia;
insert into public.trivia (id, poi_id, content, source_reference, is_verified) overriding system value values
  (1,'P01','Contoh informasi menarik mengenai pintu utama.','Catatan observasi',false),
  (2,'P05','Informasi simulasi mengenai Spot Foto Ikonik.','SIMULASI',false),
  (3,'P10','Informasi simulasi mengenai Area Bermain Anak.','SIMULASI',false),
  (4,'P04','Informasi simulasi mengenai Area Tematik Asia.','SIMULASI',false),
  (5,'P12','Informasi simulasi mengenai Musala & Toilet.','SIMULASI',false),
  (6,'P11','Informasi simulasi mengenai Zona Relaksasi/Spot Teduh.','SIMULASI',false),
  (7,'P07','Informasi simulasi mengenai Selter Sepeda BOSEH.','SIMULASI',false),
  (8,'P03','Informasi simulasi mengenai Danau & Air Mancur Menari.','SIMULASI',false),
  (9,'P08','Informasi simulasi mengenai Area Kuliner/Food Court.','SIMULASI',false),
  (10,'P09','Informasi simulasi mengenai Area Kafe & Lapangan Padel.','SIMULASI',false),
  (11,'P02','Informasi simulasi mengenai Gerbang Area Parkir.','SIMULASI',false),
  (12,'P06','Informasi simulasi mengenai Titik Start Jogging Track.','SIMULASI',false);

-- photo: file_path images/pXX_N.jpg; P01 punya caption khusus, lainnya "Foto simulasi N untuk <nama>"
update public.photo f set
  file_path = 'images/' || lower(f.poi_id) || '_' || f.display_order || '.jpg',
  caption = case
    when f.poi_id = 'P01' and f.display_order = 1 then 'Tampak depan pintu utama'
    when f.poi_id = 'P01' and f.display_order = 2 then 'Area sekitar pintu utama'
    else 'Foto simulasi ' || f.display_order || ' untuk ' || p.name end
from public.poi p where p.id = f.poi_id;

update public.audio set file_path = 'audio/' || lower(poi_id) || '.mp3', duration_seconds = 45, language_code = 'id';

update public.schedule set open_time = '06:00', close_time = '22:00', is_closed = false,
  notes = case when id = 1 then null else 'Jadwal simulasi' end;

commit;
