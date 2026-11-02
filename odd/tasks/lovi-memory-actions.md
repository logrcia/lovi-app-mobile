# Lovi memory actions — delete own memory, like only, comments

## Objective

Give each memory card the actions a social feed needs: delete (only for the signed-in
user's own memories, behind a confirmation), a single like action with no share, and a
working comments feature backed by Supabase.

## Problem

`LoviCard` renders two actions today. Like is local component state (`useState`), so it
resets on every remount and is not persisted. Share is a dead button: it has no `onPress`
at all and no feature behind it. There is no delete path and no comments path. The schema
has no `comments` (or `likes`) table, and `memories.ts` exposes no delete function.

## Why

The feed is the product. An action row with a button that does nothing, a like that
disappears, and no way to remove your own content is not a feed, it is a mockup. This
change makes the memory card honest: every visible action does something real.

## Decisions

- **Delete is owner-only.** Enforced twice: the button is rendered only when the memory
  belongs to the signed-in user, and the existing RLS delete policy on `memories`
  (`is_pet_owner(pet_id)`) remains the authority. The UI gate is affordance, not security.
- **Confirmation is a modal, not `Alert`.** `Alert` is unreliable on react-native-web and
  this app ships a web build. The confirmation reuses `AppModal`, which already renders
  inline on web instead of through a portal.
- **Share is removed entirely.** The button has no handler, so there is no behavior to
  retire. Only the `shareButton` style becomes dead and must be deleted with it.
- **Comments live in their own table**, mirroring the existing RLS patterns: public read,
  authenticated insert as yourself.
- **Comments load lazily** when the sheet opens. The feed must not depend on a table that
  may not be deployed yet, and the card list is a non-virtualized `ScrollView`.
- **Like persistence is out of scope.** Keep the existing visual-only toggle. Persisting it
  needs a `memory_likes` table and a repository; flagged to the user, not silently built.

## Scope

In:

- `supabase/migrations/20261102180000_memory_comments.sql` — table, index, trigger, RLS.
- `src/lib/db/types.ts`, `src/lib/db/session.ts` — table types and row alias.
- `src/lib/repositories/comments.ts` — list and create.
- `src/lib/repositories/memories.ts` — `deleteMemory`.
- `src/types.ts`, `src/lib/repositories/loviData.ts`, `src/data/mockData.ts` — `isOwn`
  and `commentsCount` on `LoviMemory`.
- `src/components/LoviCard.tsx` — remove share, add owner-only delete, add comment action.
- `src/components/ConfirmModal.tsx` — destructive confirmation sheet.
- `src/components/MemoryCommentsModal.tsx` — comment list and composer.
- `App.tsx`, `src/screens/HomeScreen.tsx`, `src/screens/PetProfileScreen.tsx` — wiring.

Out:

- Persisting likes.
- Editing or deleting comments.
- Comment pagination, reactions, or notifications.
- Push notifications.

## Constraints

- Expo SDK 58 / RN 0.88 / TypeScript strict. Do not trust remembered Expo APIs.
- `Alert` must not be used for confirmation: the web build needs a real component.
- Deleting a memory must not orphan its `pet-media` object. Delete the row first, then
  remove the storage object best-effort, mirroring the create rollback in `memories.ts`.
- `albums.cover_memory_id` is `on delete set null`, so album covers recover on read.
- All user-facing copy is Spanish, matching the existing app. Code and comments in English.

## Tasks

| ID | Task | Unit |
| --- | --- | --- |
| T1 | Migration: `memory_comments` table, index, `set_updated_at` trigger, RLS (public select, authenticated insert as self) | A |
| T2 | Add the table to `Database` types and export a `DbMemoryComment` alias | A |
| T3 | `src/lib/repositories/comments.ts`: `listComments(memoryId)`, `createComment(memoryId, body)` | A |
| T4 | `deleteMemory(id)` in `memories.ts`: read `media_path`, delete row, best-effort storage remove | A |
| T5 | `LoviMemory` gains `isOwn` and `commentsCount`; populate in `loviData.ts`; update `mockData.ts` fixtures | A |
| T6 | `LoviCard`: delete share button and its style; add owner-only delete action; add comment action with count | B |
| T7 | `ConfirmModal` on top of `AppModal`: title, description, cancel, destructive confirm, pending state | B |
| T8 | `MemoryCommentsModal`: lazy-loaded list, empty state, composer with pending and error handling | B |
| T9 | Wire delete and comments through `App.tsx`, `HomeScreen`, `PetProfileScreen`, including refetch | B |

## Authorized scope

Only the files listed under Scope/In. No dependency additions, no navigation restructuring,
no changes to auth, and no edits to the `memories` RLS policies.

## Acceptance criteria

- A memory owned by the signed-in user shows a delete action; a memory owned by someone
  else does not.
- Delete asks for confirmation, then removes the row, clears the card from the feed, and
  leaves no storage object behind.
- Cannoning out of the confirmation leaves the memory intact.
- No share action exists anywhere on the card.
- The like action still toggles and still renders its current label.
- A comment action opens a sheet listing that memory's comments, newest readable, and
  posting a comment appends it and persists it across reload.
- The card shows the comment count once comments exist.

## Checks

- `npx tsc --noEmit`
- `npx expo lint`
- `npx expo export -p web` (proves the deploy build still compiles)
- Headless Chrome screenshots of the feed at 1400x900 to confirm the phone frame is intact

## Delivery

Single work unit on `feat/lovi-editorial-redesign`, merged to `main` after verification.
Forecast: roughly 450-550 authored changed lines across the migration, five new modules,
three edited components, and three wiring sites. Above the ~400-line advisory heuristic,
kept as one unit because the backend half and the UI half are not independently shippable:
the card cannot show a count the data layer does not provide, and the data layer has no
consumer without the card.

Migration application is a manual step: the Supabase CLI is installed but unauthenticated,
so the SQL has to be applied through the dashboard SQL editor or after `supabase login`.

## Progress

| ID | Status | Evidence |
| --- | --- | --- |
| T1 | Done (file only) | `supabase/migrations/20261102180000_memory_comments.sql`, commit `4e8bd4e` |
| T2 | Done | `Database` types + `DbMemoryComment`, commit `4e8bd4e` |
| T3 | Done | `src/lib/repositories/comments.ts`, commit `4e8bd4e` |
| T4 | Done | `deleteMemory` in `memories.ts`, commit `4e8bd4e` |
| T5 | Done | `isOwn` + `commentsCount` in `types.ts`, `loviData.ts`, `mockData.ts`, commit `4e8bd4e` |
| T6 | Done | `LoviCard`: share removed, comments added, owner-only delete, commit `e530a89` |
| T7 | Done | `src/components/ConfirmModal.tsx`, commit `e530a89` |
| T8 | Done | `src/components/MemoryCommentsModal.tsx`, commit `e530a89` |
| T9 | Done | `App.tsx`, `HomeScreen.tsx`, `PetProfileScreen.tsx`, commit `e530a89` |
| T10 | Partial | `tsc` exit 0; `expo lint` 0 errors / 14 pre-existing warnings; `expo export -p web` exit 0. Card visuals not verified: the feed needs an authenticated session. |

### Open items

- **Migration not applied to the remote database.** Verified `GET /rest/v1/memory_comments`
  returns `404 PGRST205` ("Could not find the table"). The feed still loads because the
  count query is failure-tolerant, but listing and posting comments will fail until the
  migration runs. Apply `supabase/migrations/20261102180000_memory_comments.sql` through the
  Supabase SQL editor, or `supabase login` followed by `npx supabase db push`.
- **Likes are still not persisted.** Deliberately out of scope; `LoviCard` keeps its local
  `useState` toggle, so a like resets on remount and is not shared between screens.
- **Card visuals unverified.** Delete affordance, comment count, and both modals need a
  logged-in pass in the deployed app.

## Scope addition — persisted likes (authorized after first delivery)

The user confirmed likes must survive reloads. This replaces the local `useState` toggle with
a real per-user record, and makes the same memory agree between Home and the pet profile.

In:

- `supabase/migrations/20261102190000_memory_likes.sql` — join table, index, RLS.
- `src/lib/db/types.ts`, `src/lib/db/session.ts` — table types and row alias.
- `src/lib/repositories/likes.ts` — read the signed-in user's liked memory ids, set a like.
- `src/types.ts` — `LoviMemory.isLiked`.
- `src/lib/repositories/loviData.ts` — hydrate `isLiked` for the current profile.
- `src/data/mockData.ts` — fixture field.
- `src/components/LoviCard.tsx` — derive from `memory.isLiked`, emit `onLikeToggle`.
- `App.tsx`, `src/screens/HomeScreen.tsx`, `src/screens/PetProfileScreen.tsx` — optimistic
  toggle with rollback on failure.

Out: like counts on the card (the button stays a boolean label), likes on comments, and any
notification work.

| ID | Task | Status |
| --- | --- | --- |
| T11 | `memory_likes` migration: composite PK `(memory_id, user_id)`, cascade FKs, `user_id` index, RLS select/insert/delete | Done — `supabase/migrations/20261102190000_memory_likes.sql` |
| T12 | `memory_likes` types and `DbMemoryLike` alias | Done |
| T13 | `src/lib/repositories/likes.ts`: `listLikedMemoryIds`, `setMemoryLiked` | Done |
| T14 | `LoviMemory.isLiked`, hydrated in `loviData.ts`, fixtures updated | Done |
| T15 | `LoviCard` uses `memory.isLiked`; `App.tsx` optimistic toggle with rollback | Done |

### Progress — persisted likes

`npx tsc --noEmit` exit 0. `npx expo lint` 0 errors / 14 pre-existing warnings.
`npx expo export -p web` exit 0.

Deviation from the spec, corrected: the requested index on `memory_id` was redundant with the
composite primary key's leading column, while the only query we run filters `user_id`. The
index is now `memory_likes_user_id_idx on (user_id)`.

`memory_likes` is **not applied to the remote database yet**, same as `memory_comments`.

