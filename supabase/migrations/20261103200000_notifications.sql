-- Notifications — "someone followed your pet, liked or commented on your memory".
--
-- The app never writes this table. Rows are created by triggers on pet_follows, memory_likes
-- and memory_comments, so a notification exists exactly when the thing it announces exists:
--
--   * Unfollowing or unliking deletes the matching notification, so a follow/unfollow loop
--     cannot spam the owner and the list never announces something that was undone.
--   * Deleting a comment, memory, pet or profile cascades through the foreign keys.
--   * Acting on your own pet or memory notifies nobody.
--
-- Recipients read their own rows and may only change read_at (mark as read). There is no
-- insert policy: the trigger functions are security definer and are the only writers.

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

create type public.notification_type as enum ('follow', 'like', 'comment');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  pet_id uuid not null references public.pets (id) on delete cascade,
  memory_id uuid references public.memories (id) on delete cascade,
  comment_id uuid references public.memory_comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notifications_not_self check (recipient_id <> actor_id),
  -- Each type carries exactly the references it points at.
  constraint notifications_shape check (
    (type = 'follow' and memory_id is null and comment_id is null)
    or (type = 'like' and memory_id is not null and comment_id is null)
    or (type = 'comment' and memory_id is not null and comment_id is not null)
  )
);

comment on table public.notifications is
  'Written only by triggers on pet_follows, memory_likes and memory_comments.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- The list is always "my notifications, newest first".
create index notifications_recipient_created_at_idx
  on public.notifications (recipient_id, created_at desc);

-- The badge counts unread rows only.
create index notifications_recipient_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

-- One follow / one like notification per actor and target, mirroring the primary keys of
-- pet_follows and memory_likes. The delete triggers look rows up through these.
create unique index notifications_follow_unique
  on public.notifications (pet_id, actor_id)
  where type = 'follow';

create unique index notifications_like_unique
  on public.notifications (memory_id, actor_id)
  where type = 'like';

-- Foreign keys that cascade need an index on the referencing side.
create index notifications_actor_id_idx on public.notifications (actor_id);
create index notifications_memory_id_idx on public.notifications (memory_id);
create index notifications_comment_id_idx on public.notifications (comment_id);

-- ---------------------------------------------------------------------------
-- Trigger functions
-- ---------------------------------------------------------------------------

create or replace function public.notify_pet_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  select p.owner_id into owner from public.pets p where p.id = new.pet_id;

  if owner is not null and owner <> new.follower_id then
    insert into public.notifications (recipient_id, actor_id, type, pet_id)
    values (owner, new.follower_id, 'follow', new.pet_id)
    on conflict (pet_id, actor_id) where type = 'follow' do nothing;
  end if;

  return null;
end;
$$;

create or replace function public.forget_pet_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications n
  where n.type = 'follow'
    and n.pet_id = old.pet_id
    and n.actor_id = old.follower_id;

  return null;
end;
$$;

create or replace function public.notify_memory_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
  target_pet uuid;
begin
  select p.owner_id, p.id into owner, target_pet
  from public.memories m
  join public.pets p on p.id = m.pet_id
  where m.id = new.memory_id;

  if owner is not null and owner <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, pet_id, memory_id)
    values (owner, new.user_id, 'like', target_pet, new.memory_id)
    on conflict (memory_id, actor_id) where type = 'like' do nothing;
  end if;

  return null;
end;
$$;

create or replace function public.forget_memory_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications n
  where n.type = 'like'
    and n.memory_id = old.memory_id
    and n.actor_id = old.user_id;

  return null;
end;
$$;

create or replace function public.notify_memory_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
  target_pet uuid;
begin
  select p.owner_id, p.id into owner, target_pet
  from public.memories m
  join public.pets p on p.id = m.pet_id
  where m.id = new.memory_id;

  if owner is not null and owner <> new.author_id then
    insert into public.notifications (recipient_id, actor_id, type, pet_id, memory_id, comment_id)
    values (owner, new.author_id, 'comment', target_pet, new.memory_id, new.id);
  end if;

  return null;
end;
$$;

-- Trigger functions are not meant to be called directly.
revoke execute on function public.notify_pet_follow() from public, anon, authenticated;
revoke execute on function public.forget_pet_follow() from public, anon, authenticated;
revoke execute on function public.notify_memory_like() from public, anon, authenticated;
revoke execute on function public.forget_memory_like() from public, anon, authenticated;
revoke execute on function public.notify_memory_comment() from public, anon, authenticated;

create trigger pet_follows_notify
  after insert on public.pet_follows
  for each row execute function public.notify_pet_follow();

create trigger pet_follows_forget
  after delete on public.pet_follows
  for each row execute function public.forget_pet_follow();

create trigger memory_likes_notify
  after insert on public.memory_likes
  for each row execute function public.notify_memory_like();

create trigger memory_likes_forget
  after delete on public.memory_likes
  for each row execute function public.forget_memory_like();

create trigger memory_comments_notify
  after insert on public.memory_comments
  for each row execute function public.notify_memory_comment();

-- ---------------------------------------------------------------------------
-- Row level security
--
-- Read: the recipient. Write: only read_at, only by the recipient.
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;

create policy "recipients read their notifications"
  on public.notifications for select
  to authenticated
  using (recipient_id = (select auth.uid()));

create policy "recipients mark their notifications as read"
  on public.notifications for update
  to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

-- Policies decide which rows; grants decide which columns. Marking as read is the only change
-- a client can make, so the update grant is narrowed to read_at.
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
