-- Likes on a memory — public to read, written as yourself.
--
-- There is no likes_count column on memories: the count would be derived from this table
-- when the feed is read, so it can never drift from the rows it is counting.
--
-- A like is immutable. It exists or it does not, and the only operations are insert and
-- delete. That is why there is no updated_at column, no set_updated_at trigger, and no
-- update policy below.
--
-- Reads are open to anon and authenticated, like the rest of the public surface. Writes
-- belong to the person liking: user_id defaults to auth.uid() so a client insert can omit
-- it, while the insert policy still checks the value, so nobody likes as someone else.

-- ---------------------------------------------------------------------------
-- memory_likes
-- ---------------------------------------------------------------------------

create table public.memory_likes (
  memory_id uuid not null references public.memories (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- One like per person per memory, enforced by the database. Tapping twice is the same
  -- state written twice, never a second row.
  primary key (memory_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- The primary key already covers memory_id, because it is its leading column. The read we
-- actually run is "which memories did this person like", which filters user_id alone and is
-- not covered by that prefix — so this is the index the primary key does not provide.
create index memory_likes_user_id_idx on public.memory_likes (user_id);

-- ---------------------------------------------------------------------------
-- Row level security
--
-- Read: public. Write: the person liking.
-- ---------------------------------------------------------------------------

alter table public.memory_likes enable row level security;

create policy "likes are publicly readable"
  on public.memory_likes for select
  to anon, authenticated
  using (true);

create policy "users insert their own likes"
  on public.memory_likes for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- No update policy on purpose: there is nothing to update on a like.
create policy "users delete their own likes"
  on public.memory_likes for delete
  to authenticated
  using (user_id = (select auth.uid()));
