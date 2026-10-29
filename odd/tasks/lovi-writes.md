# Lovi writes — the four remaining local-only features

## Objective

Stop simulating writes: following, albums, vaccines and appointments must reach Postgres.

## Problem

Four handlers in `App.tsx` only mutated React state, and two modals faked things the schema
cannot store. A reload lost everything: who you follow, your albums, the sanitary record and the
agenda.

## Decisions

- **Follows are idempotent.** `pet_follows` has a composite PK `(follower_id, pet_id)`, so a
  double tap must not fail. Follow is an `upsert` with `ignoreDuplicates`, unfollow is a `delete`
  on both columns.
- **Album covers cannot be picked any more.** `albums.cover_memory_id` is a foreign key to
  `memories`; the bundled preset photos the modal offered were not row references at all. The
  modal now creates an album with only title and description, and the read path takes the cover
  from the first memory in the album — a real link, not a decorative asset.
- **Vaccine status is derived, never stored.** `vaccineStatus()` recomputes it from `next_due_at`,
  so the picked status only decides *which date column* is written: `Al día` → `applied_at`,
  `Próxima dosis` / `Para repetir` → `next_due_at`. A caption in the modal says the badge is
  recalculated.
- **Appointment date + time are combined into `starts_at`** in the device's local timezone, then
  sent as an ISO timestamp. The read path splits it back.
- The picked option is never persisted as a label: `APPOINTMENT_TYPE_DB` in `labels.ts` is the
  only translation point, mirroring `SPECIES_DB`.

## Tasks

| ID | Task | Route | Status |
| --- | --- | --- | --- |
| W1 | `setPetFollowing()` + async `handleFollowToggle` | inline | done |
| W2 | `createAlbum()` / `setMemoryAlbum()` + drop fake covers | inline | done |
| W3 | `createVaccine()` / `createAppointment()` + async modals | inline | done |
| W4 | Verify the four write paths against the live project | inline | done |

## Files

- `src/lib/repositories/follows.ts`, `albums.ts`, `care.ts`
- `src/lib/labels.ts` — `APPOINTMENT_TYPE_DB`
- `App.tsx` — handlers write and `refetch()`
- `src/components/CreateAlbumModal.tsx`, `AddVaccineModal.tsx`, `ScheduleAppointmentModal.tsx`

## Verification

`npx tsc --noEmit` clean, `npx expo lint` 0 errors (14 pre-existing `alt` warnings).

Against the live project with a throwaway authenticated user:

| Write | Result |
| --- | --- |
| Follow a pet you do not own | **201** |
| Unfollow | **204** |
| Album on your own pet | **201** |
| Album on another owner's pet | **403** |
| Move a memory into an album | **204**, `album_id` set, `updated_at` refreshed |
| Move a memory of another owner | **204** — matches 0 rows, stored value unchanged |
| Vaccine `Al día` (`applied_at`) | **201** |
| Vaccine `Próxima dosis` (`next_due_at`) | **201** |
| Vaccine on another owner's pet | **403** |
| Appointment 16:00 local → `19:00Z` | **201**, read back as `+00:00` |
| Appointment with the Spanish label as `type` | **400** — the enum only accepts `vet` |

### Schema bug found by this verification

`memories_set_updated_at` was attached to `public.memories` in the initial schema, but the table
never got the column that trigger writes to. Every UPDATE failed with
`record "new" has no field "updated_at"` (SQLSTATE 42703) — moving a memory into an album was
impossible. Fixed by `supabase/migrations/20261029142000_memories_updated_at.sql` and
`src/lib/db/types.ts` was regenerated from the live database.
