-- Lovi — stage 1 schema.
--
-- Visibility model: every memory is public by default. SELECT is open to anon and
-- authenticated; writes belong to the pet owner, resolved through public.is_pet_owner().
--
-- Derived, never stored: followers_count, memories_count, is_upcoming, vaccine status,
-- pet age, and any human-readable date. Those are computed in queries or in the client.
--
-- Media bytes never enter the database. memories.media_path is an object path inside the
-- pet-media bucket, shaped {pet_id}/{filename}, so storage policies can authorize per pet.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.pet_species as enum ('dog', 'cat', 'rabbit', 'bird', 'other');

create type public.media_type as enum ('image', 'video', 'audio', 'text');

create type public.appointment_type as enum ('vet', 'grooming', 'vaccination');

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — 1:1 with auth.users
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,30}$'),
  name text not null check (length(trim(name)) > 0),
  bio text not null default '',
  avatar_path text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.handle is
  'Stored without the leading @. The @ is presentation only.';

comment on column public.profiles.avatar_path is
  'Object path inside the pet-media bucket, not a URL.';

-- ---------------------------------------------------------------------------
-- pets
-- ---------------------------------------------------------------------------

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  species public.pet_species not null,
  birthday date,
  bio text not null default '',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.pets.birthday is
  'Age is derived from this column. Never store "3 años" as text.';

-- ---------------------------------------------------------------------------
-- pet_follows — you follow pets, not people
-- ---------------------------------------------------------------------------

create table public.pet_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, pet_id)
);

-- ---------------------------------------------------------------------------
-- albums
-- ---------------------------------------------------------------------------

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  -- Foreign key added after memories exists.
  cover_memory_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- memories — the core object
-- ---------------------------------------------------------------------------

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  album_id uuid references public.albums (id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  description text,
  media_type public.media_type not null,
  media_path text,
  media_duration_seconds integer check (media_duration_seconds is null or media_duration_seconds >= 0),
  happened_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint memories_media_presence check (
    (media_type = 'text' and media_path is null)
    or (media_type <> 'text' and media_path is not null)
  )
);

alter table public.albums
  add constraint albums_cover_memory_id_fkey
  foreign key (cover_memory_id) references public.memories (id) on delete set null;

-- ---------------------------------------------------------------------------
-- vaccines
-- ---------------------------------------------------------------------------

create table public.vaccines (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  applied_at date,
  next_due_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.vaccines is
  'Status ("Al día" / "Próxima dosis" / "Para repetir") is derived from next_due_at and never stored.';

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  type public.appointment_type not null,
  starts_at timestamptz not null,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.appointments is
  'There is no calendar_events table. The calendar is a view over vaccines, appointments, birthdays and memories.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- (follower_id, pet_id) is already covered by the primary key prefix.
create index pet_follows_pet_id_idx on public.pet_follows (pet_id);

create index pets_owner_id_idx on public.pets (owner_id);

create index albums_pet_id_idx on public.albums (pet_id);

create index memories_pet_id_happened_at_idx
  on public.memories (pet_id, happened_at desc);

create index memories_happened_at_idx
  on public.memories (happened_at desc);

create index memories_album_id_idx on public.memories (album_id);

-- Deleting a memory sets albums.cover_memory_id to null, which scans albums without this.
create index albums_cover_memory_id_idx on public.albums (cover_memory_id);

create index vaccines_pet_id_next_due_at_idx
  on public.vaccines (pet_id, next_due_at);

create index appointments_pet_id_starts_at_idx
  on public.appointments (pet_id, starts_at);

-- ---------------------------------------------------------------------------
-- Ownership helpers
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so the policy can read public.pets without recursing into pets' own RLS.
-- (select auth.uid()) keeps the call to a single initplan instead of one per row.
create or replace function public.is_pet_owner(target_pet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pets p
    where p.id = target_pet_id
      and p.owner_id = (select auth.uid())
  );
$$;

grant execute on function public.is_pet_owner(uuid) to anon, authenticated;

-- Extracts the {pet_id} folder from a storage object path, returning null instead of
-- raising when the path does not start with a uuid.
create or replace function public.path_pet_id(object_name text)
returns uuid
language plpgsql
immutable
as $$
begin
  return ((storage.foldername(object_name))[1])::uuid;
exception
  when others then
    return null;
end;
$$;

grant execute on function public.path_pet_id(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Signup trigger — every auth user gets a profile
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_handle text;
  candidate text;
  attempt integer := 0;
begin
  base_handle := lower(
    regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-z0-9_]', '', 'g')
  );

  if length(base_handle) < 3 then
    base_handle := 'lovi_' || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;

  -- Leave room for the numeric suffix so the 30-char handle check can never fail here.
  base_handle := left(base_handle, 24);

  candidate := base_handle;
  while exists (select 1 from public.profiles p where p.handle = candidate) loop
    attempt := attempt + 1;
    candidate := base_handle || attempt::text;
  end loop;

  insert into public.profiles (id, handle, name)
  values (
    new.id,
    candidate,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), initcap(base_handle))
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger pets_set_updated_at
  before update on public.pets
  for each row execute function public.set_updated_at();

create trigger albums_set_updated_at
  before update on public.albums
  for each row execute function public.set_updated_at();

create trigger memories_set_updated_at
  before update on public.memories
  for each row execute function public.set_updated_at();

create trigger vaccines_set_updated_at
  before update on public.vaccines
  for each row execute function public.set_updated_at();

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
--
-- Read: public. Write: the pet owner (or the profile owner for profiles).
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.pet_follows enable row level security;
alter table public.albums enable row level security;
alter table public.memories enable row level security;
alter table public.vaccines enable row level security;
alter table public.appointments enable row level security;

-- profiles
create policy "profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "users insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- pets
create policy "pets are publicly readable"
  on public.pets for select
  to anon, authenticated
  using (true);

create policy "owners insert their pets"
  on public.pets for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "owners update their pets"
  on public.pets for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "owners delete their pets"
  on public.pets for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- pet_follows
create policy "follows are publicly readable"
  on public.pet_follows for select
  to anon, authenticated
  using (true);

create policy "users create their own follows"
  on public.pet_follows for insert
  to authenticated
  with check (follower_id = (select auth.uid()));

create policy "users delete their own follows"
  on public.pet_follows for delete
  to authenticated
  using (follower_id = (select auth.uid()));

-- albums, memories, vaccines, appointments: write authority comes from the parent pet.
create policy "albums are publicly readable"
  on public.albums for select
  to anon, authenticated
  using (true);

create policy "pet owners insert albums"
  on public.albums for insert
  to authenticated
  with check (public.is_pet_owner(pet_id));

create policy "pet owners update albums"
  on public.albums for update
  to authenticated
  using (public.is_pet_owner(pet_id))
  with check (public.is_pet_owner(pet_id));

create policy "pet owners delete albums"
  on public.albums for delete
  to authenticated
  using (public.is_pet_owner(pet_id));

create policy "memories are publicly readable"
  on public.memories for select
  to anon, authenticated
  using (true);

create policy "pet owners insert memories"
  on public.memories for insert
  to authenticated
  with check (public.is_pet_owner(pet_id));

create policy "pet owners update memories"
  on public.memories for update
  to authenticated
  using (public.is_pet_owner(pet_id))
  with check (public.is_pet_owner(pet_id));

create policy "pet owners delete memories"
  on public.memories for delete
  to authenticated
  using (public.is_pet_owner(pet_id));

create policy "vaccines are publicly readable"
  on public.vaccines for select
  to anon, authenticated
  using (true);

create policy "pet owners insert vaccines"
  on public.vaccines for insert
  to authenticated
  with check (public.is_pet_owner(pet_id));

create policy "pet owners update vaccines"
  on public.vaccines for update
  to authenticated
  using (public.is_pet_owner(pet_id))
  with check (public.is_pet_owner(pet_id));

create policy "pet owners delete vaccines"
  on public.vaccines for delete
  to authenticated
  using (public.is_pet_owner(pet_id));

create policy "appointments are publicly readable"
  on public.appointments for select
  to anon, authenticated
  using (true);

create policy "pet owners insert appointments"
  on public.appointments for insert
  to authenticated
  with check (public.is_pet_owner(pet_id));

create policy "pet owners update appointments"
  on public.appointments for update
  to authenticated
  using (public.is_pet_owner(pet_id))
  with check (public.is_pet_owner(pet_id));

create policy "pet owners delete appointments"
  on public.appointments for delete
  to authenticated
  using (public.is_pet_owner(pet_id));

-- ---------------------------------------------------------------------------
-- Storage — pet-media bucket, one folder per pet
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-media',
  'pet-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/x-m4a'
  ]
)
on conflict (id) do nothing;

create policy "pet media is publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'pet-media');

create policy "owners upload pet media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'pet-media'
    and public.is_pet_owner(public.path_pet_id(name))
  );

create policy "owners update pet media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'pet-media'
    and public.is_pet_owner(public.path_pet_id(name))
  )
  with check (
    bucket_id = 'pet-media'
    and public.is_pet_owner(public.path_pet_id(name))
  );

create policy "owners delete pet media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'pet-media'
    and public.is_pet_owner(public.path_pet_id(name))
  );
