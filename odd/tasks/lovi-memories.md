# Lovi memories — saving a real memory

## Objective

Make the composer write to Postgres: a memory with an uploaded photo, or a text-only memory.

## Problem

`handleSaveMemory` in `App.tsx` only mutated React state. The composer also faked its media:
the "preview" was the pet's avatar, and video/audio durations were hardcoded strings. Reloading
the app lost every memory.

## Decisions

- **Upload before insert.** `memories.media_path` is `NOT NULL` for any non-text memory
  (`memories_media_presence`), and the storage policy only requires the object to sit inside a
  pet you own (`is_pet_owner(path_pet_id(name))`) — it does not need the memory to exist. So the
  file goes first to `{pet_id}/memories/{timestamp}-{rand}.{ext}`, then the row is inserted with
  that path. If the insert fails the object is removed, so retries leave no orphans.
- **Video and audio are disabled in the UI**, not faked. They need real capture (recording +
  duration), which is a separate change. The chips render at 35% opacity and saving is impossible
  for them.
- **A photo memory requires a photo.** Otherwise the constraint rejects it anyway; the composer
  asks for one before submitting.
- Media bytes go through `expo-file-system`'s `File.arrayBuffer()` — the same reason as pet
  avatars: Expo SDK 58's fetch rejects `{ uri }` FormData parts.

## Tasks

| ID | Task | Route | Status |
| --- | --- | --- | --- |
| M1 | `createMemory()` repository (upload + insert + rollback) | inline | done |
| M2 | Composer: real photo picker, disabled video/audio, async save | inline | done |
| M3 | `App.handleSaveMemory` writes and refetches | inline | done |

## Files

- `src/lib/repositories/memories.ts` — `createMemory()`, `NewMemoryDraft`.
- `src/screens/CreateMemoryScreen.tsx` — picker, saving state, `Alert` errors.
- `App.tsx` — `handleSaveMemory` is async and calls `remote.refetch()`.

## Verification

`npx tsc --noEmit` clean, `npx expo lint` 0 errors.

Against the live project with a throwaway authenticated user:

| Step | Result |
| --- | --- |
| Upload to `{pet_id}/memories/…` | **200** |
| Insert memory with `media_path` | **201** |
| Insert text-only memory | **201** |
| Insert image memory without `media_path` | **400** (constraint) |
| Insert memory on another profile's pet | **403** |
| Public read of the memory photo | **200**, 910 KB |

## Next

- Follow / unfollow persistence.
- Albums and care entries (vaccines, appointments) — still local-only.
- Video and audio memories (recording + duration).
