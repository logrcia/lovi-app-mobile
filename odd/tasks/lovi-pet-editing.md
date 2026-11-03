# Edit a pet, and require the birthday

## Objective

The owner must be able to edit a pet after creating it — starting with the birthday, which is
wrong on two existing rows and currently has no way to be corrected — and the birth date must be
mandatory when a pet is created.

## Problem

`AddPetModal` only creates. `src/lib/repositories/pets.ts` exports `createPet` and a private
`attachPetAvatar`, with no update path, and `PetProfileScreen` has no edit affordance even for
pets you own. So a wrong birthday is permanent inside the app.

Separately, the birth date was made optional in the previous change. It should be required: a pet
without one disappears from the calendar silently.

Live check: all 8 rows in `pets` already carry a birthday, so requiring it in the form creates no
conflict with existing data. The column stays nullable — the constraint is a product rule, not a
schema one, and old rows must stay readable.

## Scope

In:

- `src/types.ts` — `Pet` gains `birthday: string | null`; `age` stays a display string.
- `src/data/mockData.ts` — fixtures carry a birthday consistent with their age label.
- `src/lib/repositories/loviData.ts` — maps `pet.birthday`.
- `src/lib/repositories/pets.ts` — `updatePet`, and `CreatePetInput.birthday` becomes `string`.
- `src/components/AddPetModal.tsx` — one sheet, two modes: create and edit.
- `src/screens/PetProfileScreen.tsx` — an edit action for your own pets.
- `App.tsx` — edit state, optimistic update, wiring.

Out:

- Deleting a pet.
- Removing an existing avatar (only replacing it).
- A database `not null` constraint on `pets.birthday`.
- Editing another owner's pet (the button is owner-only and RLS is the real gate).

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| T1 | `Pet.birthday` in the type, the fixtures and `toPet` | Done |
| T2 | `updatePet` repository with Spanish error mapping | Done |
| T3 | `AddPetModal` edit mode, prefilled; birthday required and validated | Done |
| T4 | Edit action on the pet profile, owner only | Done |
| T5 | `App.tsx` edit state, optimistic row, refetch | Done |

## Progress

`npx tsc --noEmit` exit 0. `npx expo lint` 0 errors / 14 pre-existing warnings.
`npx expo export -p web` exit 0.

One sheet serves both modes: `pet` present means edit, `null` means create. The reset effect is
keyed on `[isOpen, pet]`, so opening the sheet on a different pet without unmounting still
prefills correctly.

`NewPetDraft.avatar` became optional because the two modes differ: creating always picks a file,
editing only replaces one. `App.tsx` therefore falls back to the signed-in avatar when creating and
keeps the existing one when editing, so an unchanged photo is never overwritten with a local uri.

`attachPetAvatar` now takes the write action so the permission failure reads "editar" instead of
"crear". Storage uploads run before the row update: a failed upload leaves `avatar_path` pointing at
the old object, so the pet keeps its previous photo.

Leftover: replacing a PNG with a JPEG (or vice versa) leaves the old `avatar.*` object orphaned in
`pet-media`. Not cleaned up; the app only produces jpg, png and webp.

## Notes

The sheet must not lose the branch that already works: creating a pet still requires a photo,
while editing only replaces one when a new file is picked. Stale `onSavePet` closures are the
usual failure here — the create and edit handlers are different functions passed to the same prop.
