# Lovi auth — email and password

## Objective

Replace the hardcoded `DEMO_PROFILE_ID` with a real Supabase session, so the app knows who
"me" is and RLS can authorize writes with `auth.uid()`.

## Problem

Every `isMine` / "mis mascotas" / "siguiendo" decision reads a constant pointing at the seeded
Abril profile. Without a session the app can only read: `is_pet_owner()` always returns false,
so nothing can be created, edited or deleted.

## Decisions

- Email + password. Works in Expo Go, no native config, no developer account.
- Email confirmation is already disabled on the project: `POST /auth/v1/signup` returns a session
  immediately (verified).
- `handle_new_user()` already creates the profile row on signup, so no client-side profile insert.

## Authorized scope

In:

- `src/lib/auth/useSession.ts` — session state over `onAuthStateChange`.
- `src/lib/auth/actions.ts` — sign in / sign up / sign out wrappers with readable errors.
- `src/screens/AuthScreen.tsx` — editorial login + signup screen.
- App gate: loading → signed out → app shell.
- `fetchLoviData(profileId)` and `useLoviData(profileId)`: identity comes from the session.
- Empty-state guards so a brand-new account with zero pets cannot crash Calendar / PetProfile.
- Sign out affordance.

Out (next change):

- Persisting a new pet (needs age → birthday parsing and uploading the preset avatar).
- Persisting a memory (needs the storage upload path).
- Follow/unfollow writes.
- Password reset, Apple/Google providers.

## Tasks

| ID | Task | Route | Status |
| --- | --- | --- | --- |
| A1 | Session hook + auth actions | inline | done |
| A2 | AuthScreen (login + signup) | inline | done |
| A3 | App gate + identity from session | inline | done |
| A4 | Empty-state guards for accounts without pets | inline | done |
| A5 | Persist pet creation with a device photo | inline | done |

## A5 — saving a pet (done)

New files:

- `src/lib/pets/age.ts` — `parseAgeToBirthday('3 años') → '2023-10-28'`. The database stores a
  date; the sheet collects free text. Returns `null` for anything it does not understand.
- `src/lib/repositories/pets.ts` — `createPet()`. Inserts the row, then uploads
  `pet-media/{pet_id}/avatar.{ext}` and updates `avatar_path`. If the upload fails the row is
  deleted again, so retrying from the sheet cannot create duplicates.
- `src/components/AddPetModal.tsx` — device photo (gallery or camera via `expo-image-picker`),
  replacing the bundled preset gallery. Async submit with spinner and inline errors.
- `src/lib/labels.ts` — `SPECIES_DB`, the inverse of `SPECIES_LABEL`.
- `app.json` — `expo-image-picker` plugin with Spanish permission strings (for dev builds).

Upload details:

- **Expo SDK 58 replaced the global `fetch`.** Its `convertFormData` throws
  `Unsupported FormDataPart implementation` for parts shaped `{ uri, name, type }` — the classic
  React Native upload pattern no longer works. The body is now real bytes:
  `new File(uri).arrayBuffer()` from `expo-file-system`, uploaded as an `ArrayBuffer`.
  storage-js sets `content-type` from `fileOptions.contentType` for every non-Blob/non-FormData
  body, so the bucket's `allowed_mime_types` still matches.
- `allowsEditing: true` crops to 1:1 and re-encodes HEIC to JPEG on iOS, which keeps the
  bucket's `allowed_mime_types` happy.

Verified against the live project with a throwaway authenticated user:

| Step | Result |
| --- | --- |
| Upload to own pet folder | **200** |
| Upload into another profile's pet folder | **400** (blocked) |
| `PATCH pets.avatar_path` | **204** |
| Public read of the uploaded file | **200**, 758 KB |
| Delete pet + storage object | **204 / 200** |

## Verification

- `npx tsc --noEmit` clean; `npx expo lint` 0 errors (15 pre-existing a11y warnings).
- Email confirmation is already disabled on the project: signup returns a session immediately.
- Authenticated matrix against the live project, with a throwaway user:
  - own pet INSERT → 201
  - pet with `owner_id` of another profile → 403
  - memory on Abril's seeded pet → 403
  - memory on the caller's own pet → 201
  - DELETE of another profile's pet → 200 with `[]` (zero rows affected)
- Throwaway users deleted afterwards; the seed cast is back to 4 users / 4 profiles.

## Post-login fixes (reported by the user)

Three separate bugs, all caused by leftover mock wiring:

1. `currentPet` fell back to `pets[0]`. `pets` holds every public pet, so the fallback was
   alphabetically "Bimba" — someone else's dog. Calendar rendered her diary for an account with
   zero pets. Fixed: fallback is now the first pet the profile owns, and the selected-pet effect
   never defaults to a foreign pet.
2. `openOwnProfile()` and `handleNavigate('userProfile')` did `setViewedUser(CURRENT_USER)`, the
   mock Abril object. That overwrote the real account the load effect had just set. Fixed: both
   use the derived `currentUser`.
3. `openOwnerProfile()` compared `owner.id === CURRENT_USER.id`, an id that no longer exists in
   the database, so viewing your own pet's owner was treated as a stranger. Fixed: compares
   against `currentUser.id`.

Also added: `NoPetsScreen` for Pet Profile / Calendar / composer when there is no owned pet
(Calendar and the composer additionally require `isMine`), and an empty state in "Mis mascotas".
