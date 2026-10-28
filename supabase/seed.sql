-- Lovi demo seed.
--
-- Run with: supabase db query --linked --file supabase/seed.sql
-- Idempotent: every statement is ON CONFLICT DO NOTHING / DO UPDATE, so it can be re-run.
--
-- The cast mirrors src/data/mockData.ts on purpose, so the editorial layout keeps working.
-- One extra memory (#9) does not exist in the mocks: if you see it in the app, you are
-- reading Postgres, not fixtures.

-- ---------------------------------------------------------------------------
-- Demo users. profiles.id references auth.users, so the accounts must exist first.
-- handle_new_user() creates the profile row on insert; the upsert below fixes the
-- handle and the presentation fields.
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'abril@lovi.app',  now(), '{"provider":"email","providers":["email"]}', '{"name":"Abril Morales"}',  now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'sofia@lovi.app',  now(), '{"provider":"email","providers":["email"]}', '{"name":"Sofía Valenzuela"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'mateo@lovi.app',  now(), '{"provider":"email","providers":["email"]}', '{"name":"Mateo Rossi"}',     now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'lucas@lovi.app',  now(), '{"provider":"email","providers":["email"]}', '{"name":"Lucas Benítez"}',   now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into public.profiles (id, handle, name, bio, avatar_path, location)
values
  ('11111111-1111-4111-8111-111111111111', 'abril_m', 'Abril Morales',
   'Arquitecta de día, archivista devota de Milo y Bimba de noche. Guardando cada siesta, salto y rayito de sol.',
   'a0000000-0000-4000-8000-000000000001/avatar.jpg', 'Buenos Aires'),
  ('22222222-2222-4222-8222-222222222222', 'sofi_v', 'Sofía Valenzuela',
   'Cuidando y documentando los momentos de sus mascotas en Lovi.',
   null, 'Buenos Aires'),
  ('33333333-3333-4333-8333-333333333333', 'mateo_r', 'Mateo Rossi',
   'Cuidando y documentando los momentos de sus mascotas en Lovi.',
   null, 'Buenos Aires'),
  ('44444444-4444-4444-8444-444444444444', 'lucas_b', 'Lucas Benítez',
   'Cuidando y documentando los momentos de sus mascotas en Lovi.',
   null, 'Buenos Aires')
on conflict (id) do update
  set handle = excluded.handle,
      name = excluded.name,
      bio = excluded.bio,
      avatar_path = coalesce(excluded.avatar_path, public.profiles.avatar_path),
      location = excluded.location;

-- ---------------------------------------------------------------------------
-- Pets
-- ---------------------------------------------------------------------------

insert into public.pets (id, owner_id, name, species, birthday, bio, avatar_path)
values
  ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Milo', 'dog', '2023-10-18',
   'Coleccionista de ramas caídas, experto en siestas al sol de las 11 y guardián devoto del sillón grande.',
   'a0000000-0000-4000-8000-000000000001/avatar.jpg'),
  ('a0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Bimba', 'cat', '2025-10-22',
   'Cazadora de reflejos dorados y reina indiscutida del alféizar de la cocina. Maúlla en tono de pregunta.',
   'a0000000-0000-4000-8000-000000000002/avatar.jpg'),
  ('a0000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'Luna', 'cat', '2024-10-10',
   'Dormilona profesional en mantas de lino. Aparece únicamente cuando escucha la lata de atún.',
   'a0000000-0000-4000-8000-000000000003/avatar.jpg'),
  ('a0000000-0000-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333', 'Coco', 'dog', '2025-10-05',
   'Un torbellino con patas cortas. Ama el viento en la cara y saltar montañitas de hojas secas.',
   'a0000000-0000-4000-8000-000000000004/avatar.jpg'),
  ('a0000000-0000-4000-8000-000000000005', '44444444-4444-4444-8444-444444444444', 'Oliver', 'cat', '2022-10-01',
   'Filósofo de ventana. Observa gorriones con ojos serios desde la biblioteca de roble.',
   'a0000000-0000-4000-8000-000000000005/avatar.jpg')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Follows (Abril sigue a Luna; Milo tiene tres seguidores)
-- ---------------------------------------------------------------------------

insert into public.pet_follows (follower_id, pet_id)
values
  ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000003'),
  ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000005'),
  ('22222222-2222-4222-8222-222222222222', 'a0000000-0000-4000-8000-000000000001'),
  ('33333333-3333-4333-8333-333333333333', 'a0000000-0000-4000-8000-000000000001'),
  ('44444444-4444-4444-8444-444444444444', 'a0000000-0000-4000-8000-000000000001')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Albums
--
-- albums.cover_memory_id points at memories, and memories.album_id points back at albums.
-- The only order that works: albums first with no cover, memories with their album,
-- then the covers. See the UPDATE block after the memories insert.
-- ---------------------------------------------------------------------------

insert into public.albums (id, pet_id, title, description, cover_memory_id)
values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Siestas y solcitos',
   'Una oda a cada rayito de sol sobre el parquet de roble y las siestas eternas de las 11.', null),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Aventuras en el parque',
   'Ramas gigantes, trotes sobre hojas crujientes de otoño y saludos con otros amigos caninos.', null),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'Cazadora de reflejos',
   'Apariciones tras la cortina de lino, siestas en el alféizar y cacería de motas de polvo iluminadas.', null),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Primeros pasos y travesuras',
   'Cuando las patitas le quedaban gigantes y masticaba las pantuflas de lana en invierno.', null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Memories (the feed)
-- ---------------------------------------------------------------------------

insert into public.memories (id, pet_id, album_id, title, description, media_type, media_path, media_duration_seconds, happened_at)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'La siesta dorada sobre el parquet de roble',
   'Encontró el único parche de sol que entra a las once y apoyó el hocico como si el mundo fuera un lugar perfecto.',
   'image', 'a0000000-0000-4000-8000-000000000001/avatar.jpg', null, '2026-10-27 11:42:00-03'),

  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', null,
   'Tres horas buscando el rayito de sol perfecto',
   'Giró sobre la manta tres veces, suspiró hondo y se quedó ovillada como un pan recién horneado.',
   'image', 'a0000000-0000-4000-8000-000000000003/avatar.jpg', null, '2026-10-26 16:15:00-03'),

  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004', null,
   'Primer trote entre las hojas secas de otoño',
   'Llegamos a la plaza y no paró de correr persiguiendo hojas doradas hasta quedar exhausto con la lengua afuera.',
   'image', 'a0000000-0000-4000-8000-000000000004/avatar.jpg', null, '2026-10-18 17:30:00-03'),

  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'Pensamientos de un perro que vio pasar una mariposa amarilla',
   'Se quedó quince minutos inmóvil mirando hacia el rosal con una oreja arriba y la otra abajo, debatiendo si era amiga o comida.',
   'text', null, null, '2026-10-15 09:20:00-03'),

  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003',
   'El coro secreto de los ronroneos de domingo',
   'Grabamos 40 segundos de su motorcito en marcha mientras le rascaban la coronilla en el sillón.',
   'audio', 'a0000000-0000-4000-8000-000000000002/avatar.jpg', 42, '2026-10-12 14:05:00-03'),

  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', null,
   'Meditación profunda mirando las copas de los fresnos',
   'No parpadeó ni una sola vez en dos minutos. Un verdadero monje zen felino.',
   'video', 'a0000000-0000-4000-8000-000000000005/avatar.jpg', 75, '2026-10-10 18:00:00-03'),

  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002',
   'Conquistador de la rama más pesada de la plaza',
   'Nadie creía que la iba a poder levantar, pero caminó con la cabeza en alto los 300 metros hasta casa.',
   'image', 'a0000000-0000-4000-8000-000000000004/avatar.jpg', null, '2026-10-08 16:20:00-03'),

  ('b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003',
   'Descubrimiento del reflejo del reloj en el techo',
   'Tres saltos acrobáticos perfectos tratando de atrapar una luz que no se puede morder.',
   'image', 'a0000000-0000-4000-8000-000000000003/avatar.jpg', null, '2026-10-05 10:15:00-03'),

  -- This row does not exist in src/data/mockData.ts. Seeing it proves the feed is live.
  ('b0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000001', null,
   'El día que Lovi aprendió a recordar de verdad',
   'Primer recuerdo leído desde Postgres: esta fila no está en mockData, salió de la base.',
   'image', 'a0000000-0000-4000-8000-000000000001/avatar.jpg', null, '2026-10-27 19:00:00-03')
on conflict (id) do nothing;

-- Covers, now that the memories exist.
update public.albums set cover_memory_id = 'b0000000-0000-4000-8000-000000000001' where id = 'c0000000-0000-4000-8000-000000000001';
update public.albums set cover_memory_id = 'b0000000-0000-4000-8000-000000000007' where id = 'c0000000-0000-4000-8000-000000000002';
update public.albums set cover_memory_id = 'b0000000-0000-4000-8000-000000000005' where id = 'c0000000-0000-4000-8000-000000000003';

-- ---------------------------------------------------------------------------
-- Vaccines
-- ---------------------------------------------------------------------------

insert into public.vaccines (id, pet_id, name, applied_at, next_due_at, notes)
values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Antirrábica anual', '2025-11-14', '2026-11-14', 'Clínica Veterinaria San Roque'),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Séxtuple canina (refuerzo)', '2026-06-04', '2027-06-04', 'Lote #88492 — Dr. Aranda'),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Tos de las perreras', '2026-01-15', '2026-09-15', 'Recomendada antes de temporada de frío'),
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'Triple felina (refuerzo)', '2026-05-20', '2026-11-20', 'Vet Palermo')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Appointments
-- ---------------------------------------------------------------------------

insert into public.appointments (id, pet_id, title, type, starts_at, location, notes)
values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Control clínico anual y desparasitación', 'vet',         '2026-10-28 16:30:00-03', 'Vet Palermo (Dr. Aranda)', null),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Peluquería higiénica y baño terapéutico', 'grooming',    '2026-11-05 11:00:00-03', 'Patitas Spa', null),
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Vacunación antirrábica', 'vaccination',            '2026-11-14 10:00:00-03', 'Vet Palermo', null),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'Control de peso y uñas', 'vet',                       '2026-11-02 09:30:00-03', 'Vet Palermo', null)
on conflict (id) do nothing;
