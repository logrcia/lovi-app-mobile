-- Comments on a memory — public to read, written as yourself.
--
-- There is no comments_count column on memories: the count is derived from this table when
-- the feed is read, so it can never drift from the rows it is counting.
--
-- Reads are open to anon and authenticated, like the rest of the public surface. Writes
-- belong to the comment author: author_id defaults to auth.uid() so a client insert can omit
-- it, while the insert policy still checks the value, so nobody comments as someone else.

-- ---------------------------------------------------------------------------
-- memory_comments
-- ---------------------------------------------------------------------------

create table public.memory_comments (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Comments are only ever read for one memory, newest first.
create index memory_comments_memory_id_created_at_idx
  on public.memory_comments (memory_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create trigger memory_comments_set_updated_at
  before update on public.memory_comments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
--
-- Read: public. Write: the comment author.
-- ---------------------------------------------------------------------------

alter table public.memory_comments enable row level security;

create policy "comments are publicly readable"
  on public.memory_comments for select
  to anon, authenticated
  using (true);

create policy "users insert their own comments"
  on public.memory_comments for insert
  to authenticated
  with check (author_id = (select auth.uid()));

create policy "users update their own comments"
  on public.memory_comments for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "users delete their own comments"
  on public.memory_comments for delete
  to authenticated
  using (author_id = (select auth.uid()));
