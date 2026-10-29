-- The initial schema attached `memories_set_updated_at` to `public.memories` but never created
-- the column that trigger writes to. Every UPDATE on a memory (for example moving it into an
-- album) failed with:
--
--   record "new" has no field "updated_at"  (SQLSTATE 42703)
--
-- Memories are editable, so the column belongs there like on every other mutable table.
alter table public.memories
  add column updated_at timestamptz not null default now();
