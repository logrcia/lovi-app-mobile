# Lovi editorial redesign — React Native port

## Objective

Replace the single-file mobile prototype with the editorial design language and screen
architecture delivered as an interactive web reference, implemented natively in React Native
(Expo SDK 57 / RN 0.86).

## Problem

`App.tsx` held ~1.5k lines of inline mock UI with a different visual language (black borders,
flat cards, three-tab bar). The new design defines a warm editorial system, a floating dock with a
central create action, and screen-level features that did not exist (album viewer, separated
appointments/vaccines modals, calendar color semantics).

## Scope

In:

- Design tokens (warm palette, serif/sans pairing, soft shadows, no black borders).
- Screens: Home, Explore, Pet Profile (4 tabs), Calendar, User Profile, Create Memory.
- Components: Sticker, LoviCard, BottomTabBar, AppModal shell, 5 form modals.
- App shell: state ownership plus in-app navigation between dock tabs and pushed screens.

Out (explicitly not ported, prototype-only affordances):

- The web "director toolbar" (screen switcher, 390/768 viewport toggle, state selector, spec drawer).
- `AlbumsScreen` and `AddCareEventModal` (unused by the reference app; the care-event modal mixes
  appointments and vaccines, which the brief forbids).
- Loading/error demo states driven by the toolbar's state selector.

## Constraints

- Palette only from tokens: cream `#F9F2E4`, parchment `#FFFBF0`, ink `#282B0A`, fucsia `#D51993`,
  orange `#F39D23`, butter `#F5D244`, navy `#294EA7`, dock `#1A1C08`.
- Zero black borders: hairlines at `alpha(ink, 0.08)` or softer, hierarchy via warm surfaces and shadows.
- Appointments and vaccines stay strictly separate: separate tabs, separate modals, no shared fields.
- Calendar semantics: fucsia cell for a turno, orange for a vacuna, diagonal split when both, butter
  dot under the number whenever a recuerdo exists.

## Tasks

| ID | Task | Route | Status |
| --- | --- | --- | --- |
| T1 | Design tokens + shared types with RN image sources | inline | done |
| T2 | Mock data ported to bundled/remote image sources | inline | done |
| T3 | Primitives: Sticker, AppModal, LoviCard, BottomTabBar | inline | done |
| T4 | Home + Explore screens | delegated | done |
| T5 | Pet Profile screen (recuerdos, álbumes + viewer, vacunas, turnos) | delegated | done |
| T6 | Calendar + User Profile screens | delegated | done |
| T7 | Create Memory screen | delegated | done |
| T8 | Pet/album modals (AddPet, CreateAlbum, AddVaccine) | delegated | done |
| T9 | Care modals (ScheduleAppointment, ManageAlbumMemories) | delegated | done |
| T10 | App shell: data ownership, navigation, dock wiring | inline | done |

## Verification

- `npx tsc --noEmit` — clean.
- `npx expo export --platform ios` — bundles (633 modules), all 4 bundled photos and the Ionicons font resolve.
- `npx expo lint` — 0 errors; 19 warnings, all `jsx-a11y/alt-text` (web-only rule, RN uses `accessibilityLabel`).
- All 42 referenced Ionicons glyph names validated against the bundled glyphmap.
- No raw hex colors outside `src/theme.ts`; no `className`, DOM or lucide-react leftovers.

Not verified: on-device rendering (no simulator or Expo Go session available in this environment).

## Decisions

- `expo-linear-gradient` for the calendar diagonal split: `locations={[0, 0.5, 0.5, 1]}` gives the
  hard-stop diagonal the reference gets from a CSS `linear-gradient(135deg, ... 50%, ... 50%)`.
- The reference's web prototype lives in `design-reference/` (git-ignored) and is excluded from
  `tsconfig.json`, so the app builds from `src/` only.
- Calendar month navigation is real (Monday-first offset, correct days-in-month, local YYYY-MM-DD
  keys) instead of the reference's hardcoded October grid.
- "Today" is anchored to 2026-10-22, matching the designed agenda mock.
