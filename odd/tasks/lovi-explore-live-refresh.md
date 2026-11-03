# Explore refreshes as other owners create pets

## Objective

The Explore screen lists every pet that is not mine, but it only reads Postgres once per mount
and after a write. A pet created by another account stays invisible until the page is reloaded,
so following someone new requires a manual refresh.

## Problem

`useLoviData` exposes `refetch`, and `AppShell` already calls it after every successful write.
Nothing calls it on a timer or when Explore becomes the active tab, so the discovery surface is
a snapshot of whenever the app happened to load.

There is a second hazard hiding behind that: `fetchLoviData` rejects with a single error chain,
and the hook's `catch` replaces the whole dataset with `data: null`. That is tolerable when the
only fetch is the initial one — today a failure means "show fixtures". It stops being tolerable
once a background refresh runs every few seconds, because one transient network blip would blank
the feed that was already on screen.

## Scope

In:

- `src/lib/hooks/useLoviData.ts` — a failed refresh keeps the last good dataset.
- `App.tsx` — refetch when Explore becomes the active tab, then keep refreshing while it stays
  active.

Out:

- Supabase Realtime. It needs `alter publication supabase_realtime add table public.pets`, which
  is a manual migration, and a socket lifecycle. Polling needs neither and is enough at this size.
- Recency ordering of the discovery list (it stays alphabetical), user-level follows (Lovi
  follows pets, never people), and any "new" badge.

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| T1 | `useLoviData` keeps the previous dataset when a background refresh fails | Done |
| T2 | `AppShell` refetches on entering Explore and every 30s while it is active | Done |

## Progress

Verified live against the database with the anon key: `pets` holds 7 rows across 6 owners, so the
list has real multi-owner content to show once the refresh runs.

`npx tsc --noEmit` exit 0. `npx expo lint` 0 errors / 14 pre-existing warnings.
`npx expo export -p web` exit 0.

Polling re-reads the full dataset (9 queries), which is acceptable at this size. If the feed grows,
the upgrade is a `pets`-only query plus Realtime on insert, not a shorter interval.
