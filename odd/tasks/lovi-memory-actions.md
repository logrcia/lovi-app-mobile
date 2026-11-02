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
