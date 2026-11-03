# Family calendar and an explicit birthday

## Objective

The calendar belongs to the owner, not to one pet: with two pets it must show every pet's
appointments, vaccines, memories and birthdays in the same month, and each row must say which
pet it belongs to. Creating a pet must ask for its birthday instead of guessing it.

## Problem

Two defects, both confirmed against the live database:

1. `App.tsx` passes `events={calendarEvents.filter((event) => event.petId === currentPet?.id)}`
   and `CalendarScreen` renders `Calendario de {pet.name}`. The screen is effectively a per-pet
   view, so a second pet's agenda is invisible unless you navigate to that pet first.

2. `parseAgeToBirthday("14 años")` subtracts years from *today*, so the result always carries
   today's day and month. Live rows prove it: `rayo` (created 2026-11-03) has
   `birthday = 2012-11-02`, and `vitto` has `2014-11-02`. Every pet's birthday lands on the day
   the form was filled in, which is exactly what the calendar then renders.

## Scope

In:

- `src/screens/CalendarScreen.tsx` — takes the owner's pets and all of their events; each event
  row names its pet.
- `App.tsx` — passes the owner's pets and a filtered event list.
- `src/components/AddPetModal.tsx` — a birth-date field replaces the free-text age.
- `src/lib/pets/age.ts` — `parseBirthday` replaces `parseAgeToBirthday`; `formatAge` moves here
  from `loviData`.
- `src/lib/repositories/loviData.ts` — imports `formatAge`.

Out:

- Editing a pet's birthday after creation (the add sheet only creates).
- A native date picker; the app already uses a plain `YYYY-MM-DD` text field for appointments.
- Showing other owners' events in the calendar.

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| T1 | `age.ts`: `parseBirthday` (strict, real, not future) + `formatAge`, drop `parseAgeToBirthday` | Done |
| T2 | `loviData` imports `formatAge` instead of owning it | Done |
| T3 | `AddPetModal` asks for the birth date; empty is allowed and stored as `null` | Done |
| T4 | `CalendarScreen` is owner-scoped and each event row names its pet | Done |
| T5 | `App.tsx` feeds the calendar every event owned by the signed-in user | Done |
| T6 | Route guard follows the new scope: the calendar needs any owned pet, the composer opens on one | Done |

## Progress

`npx tsc --noEmit` exit 0. `npx expo lint` 0 errors / 14 pre-existing warnings.
`npx expo export -p web` exit 0. `grep -rn "parseAgeToBirthday"` prints nothing.

The route guard used to test `currentPet?.isMine`, which conflated "the selected pet" with "a pet
you own". With a family calendar that is wrong twice: the calendar disappeared while a foreign pet
was selected, and the composer could open on a pet you cannot write to. It now gates on
`myPets.length === 0`, and the composer receives an owned pet even when Explore left another
owner's pet selected.

The event meta line renders the pet name whenever it is known, independent of `event.time`, which
is optional in the type — otherwise a future time-less event would lose its attribution.

Existing rows are still wrong: `rayo` holds `2012-11-02` and `vitto` `2014-11-02`. There is no
edit-pet flow, so correcting them needs SQL.


## Notes

The birthday stays optional on purpose: an owner who does not know it should be able to leave it
empty and get no birthday entry, rather than have the app invent a date. What must never happen
again is silently writing today's day and month.
