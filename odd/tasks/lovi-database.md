# Lovi database — stage 1 schema

## Objective

Give Lovi real persistence on Supabase (Postgres 17, project `lovi-database`,
ref `npbqjmykssqdbmbsgoes`), replacing `src/data/mockData.ts` as the source of truth with a
versioned schema, row-level security, and media storage.

## Problem

The app ships the entire domain as in-memory fixtures. There is no identity, no persistence, no
media, and three overlapping structures describe the same calendar reality (`vaccines`,
`appointments`, `calendar_events`). `createdAt` is a display string (`"Hoy · 11:42"`) and
`memoriesCount` / `followersCount` are stored numbers, so nothing can ever be recomputed.

## Decisions (taken with the user)

- Delivery: cloud Supabase from day one (the app is a social feed, not a personal journal).
- Visibility: every memory is public by default. `SELECT` is open, writes belong to the pet owner.
- No local stack: Docker is not installed, so `supabase start` is out of reach for now.
- The calendar is a **view** over vaccines + appointments + birthdays + memories. It is not a table.
- Counts and states (`followersCount`, `memoriesCount`, `isUpcoming`, vaccine `status`, age) are
  derived, never stored.

## Authorized scope

In:

- `supabase/migrations/*_lovi_initial_schema.sql`: enums, 7 tables, FKs, constraints,
  `updated_at` trigger, signup trigger, `is_pet_owner()` helper, RLS policies, indexes,
  `pet-media` storage bucket and its policies.

Out (explicitly not in this change):

- `supabase link` / `db push` (needs the database password; separate authorized step).
- Generated TypeScript types (`supabase gen types`).
- Supabase client, repository layer, auth screens.
- Any edit under `src/`. Screens keep running on `mockData.ts`.
- Calendar / vaccine-status views, feed query.

## Constraints

- Technical identifiers in English (`species`, `media_type`, `appointment_type`). The UI keeps its
  Spanish labels via a presentation map; `src/types.ts` stays untouched for now.
- Media bytes never enter the database. `memories.media_path` is an object path inside the
  `pet-media` bucket; public URLs are built client-side.
- Object paths follow `{pet_id}/{filename}` — the storage policy parses the folder to authorize.
- Every new table has RLS enabled at creation, never afterwards.

## Tasks

| ID | Task | Route | Status |
| --- | --- | --- | --- |
| T1 | Write initial schema migration with RLS, indexes, storage bucket | inline | done |
| T2 | Link project + `db push` | inline | done |
| T3 | `supabase gen types` into `src/lib/db/types.ts` | inline | done |
| T4 | Supabase client + repository layer over the existing screens | inline | done |
| T5 | Calendar/feed views replacing `INITIAL_CALENDAR_EVENTS` | inline | done |
| T6 | Real authentication; remove `DEMO_PROFILE_ID` | — | next |

## Seed

`supabase/seed.sql` (run with `supabase db query --linked --file supabase/seed.sql`) inserts the
demo cast from `mockData.ts` plus memory #9, which does **not** exist in the fixtures. If that memory
shows up in the feed, the app is reading Postgres.

Media lives in the `pet-media` bucket under `{pet_id}/avatar.jpg`, uploaded once with the service
role key. The bucket is public, so the anon client renders those paths without a signed URL.

## Temporary identity

`src/lib/db/session.ts` exports `DEMO_PROFILE_ID` (the seeded Abril profile). It is the single
hardcoded identity: every `isMine` / "my pets" / "following" decision reads it. T6 replaces it with
`supabase.auth.getUser()`.

## Verification

Executed against `lovi-database` on 2026-10-27:

- `supabase link --project-ref npbqjmykssqdbmbsgoes`: linked, no database password required.
- `supabase db push --linked`: applied `20261027195617_lovi_initial_schema.sql`, no errors.
- `supabase migration list --linked`: local `20261027195617` matches remote `20261027195617`.
- `supabase db lint --linked --level warning`: no schema errors in `public` or `extensions`.
- REST probe with the anon key:
  - `GET /rest/v1/memories` → 200 `[]` (public read works, cache headers present).
  - `GET /rest/v1/profiles` → 200 `[]`.
  - `POST /rest/v1/memories` → 401 `42501 new row violates row-level security policy`.
  - `POST /rest/v1/pets` → 401 `42501 new row violates row-level security policy`.

RLS is proven: anonymous read is allowed, anonymous write is rejected by policy, not by HTTP auth.
Not yet verified: owner writes (needs a real signed-up user), storage policies (needs an upload),
and the signup trigger (needs a signup).
