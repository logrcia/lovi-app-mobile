# Lovi profile polish — following list, tab highlight, back arrow

## Objective

Three corrections on the profile surfaces: a real "seguidos" block in **Mi perfil**, a bottom
dock that highlights where you actually came from, and a way back from a pet profile.

## Problem

1. **The dock lies.** `BottomTabBar.isActive()` contains
   `tab === 'userProfile' && currentScreen === 'petProfile'`, so opening any pet paints
   **Mi Perfil** yellow even though Mi Perfil is only the logged-in user's own page.
2. **No way back.** `PetProfileScreen` has no back affordance; the only exits are the dock tabs,
   which loses the origin.
3. **Nothing about who you follow.** The user profile lists your pets but not the accounts you
   follow, and the count is not exposed anywhere.

## Decisions

- **The dock highlights the origin, not the screen.** `App` owns `petProfileReturn: MainTab`
  (set in `openPetProfile` when leaving a tab) and passes `activeTab` to the dock. A pet profile
  opened from Home keeps Home yellow; opened from Explorar keeps Explorar; opened from Mi Perfil
  keeps Mi Perfil.
- `activeTab` is `MainTab | null`. The composer is reachable from the FAB on any tab and belongs
  to none, so it keeps **no** highlight — the previous behaviour, made explicit instead of
  accidental.
- **Back is the same origin.** `onBack` sends the user to `petProfileReturn`, so the arrow and the
  dock can never disagree.
- **Following is derived, never stored.** The list is `pets.filter(pet => pet.isFollowing)`;
  `isFollowing` already comes from `pet_follows` in `loviData`. No new query, no counter column.
- **The block is own-profile only.** `loviData` computes `isFollowing` for the current user, so
  another owner's list cannot be rendered without inventing data. Better absent than false.

## Tasks

| ID | Task | Route | Status |
| --- | --- | --- | --- |
| P1 | `petProfileReturn` + `activeTab` in `App`, dock reads the origin | inline | done |
| P2 | Back arrow in `PetProfileScreen` | inline | done |
| P3 | "Seguís a N cuentas" card + `FollowingModal` | inline | done |

## Files

- `App.tsx` — `petProfileReturn`, `activeTab`, `followingPets`
- `src/components/BottomTabBar.tsx` — `activeTab` prop, remove the petProfile→userProfile alias
- `src/components/FollowingModal.tsx` — new list of followed pets
- `src/screens/PetProfileScreen.tsx` — `onBack`
- `src/screens/UserProfileScreen.tsx` — following card + modal

## Verification

`npx tsc --noEmit` clean, `npx expo lint` 0 errors (the same 14 pre-existing `alt` warnings).

There is no UI test runner in this project, so the dock/back behaviour was verified by reading
every entry point against the state machine rather than by tapping it:

| Flow | Dock | Back |
| --- | --- | --- |
| Home → pet | Home | Home |
| Explorar → pet | Explorar | Explorar |
| Mi perfil → pet | Mi perfil | Mi perfil |
| Pet A → pet B (in-profile list) | unchanged | unchanged origin |
| Pet (from Home) → owner profile | Home | Pet |
| Mi perfil → «Nueva mascota» → pet | Mi perfil | Mi perfil |
| FAB → composer | none (as before) | — |

The following list is `pets.filter(pet => pet.isFollowing)`, i.e. real `pet_follows` rows, so a
brand-new account correctly shows zero and the empty state.

## Notes

- A second instance of the same lie was fixed unrequested: **another owner's profile** also lit
  "Mi Perfil". It now resolves through the chain to the tab the pet profile came from.

## Removed: the prototype owner/visitor toggle

The "Modo: Dueño / Visitante" bar at the top of a pet profile was prototype scaffolding — it
existed to preview the visitor view of your own pet. Ownership is real data now, so the switch
had nothing left to decide. `isActualOwner` is simply `pet.isMine`: your pets open as owner,
everyone else's as guest. `isOwnerView` / `onToggleOwnerView` are gone from `App` and the screen,
along with the six styles that only that bar used, and no copy references "Visitante" any more.
