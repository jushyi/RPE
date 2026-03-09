---
phase: 02-exercise-library
plan: 01
subsystem: database, ui
tags: [supabase, zustand, mmkv, react-native, flatlist, exercise-library, rls]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase client, auth store, MMKV persistence pattern, UI components (Card, Button, Input), theme constants
provides:
  - exercises table with RLS policies and ~37 seed exercises
  - Exercise/MuscleGroup/Equipment type definitions
  - Zustand exercise store with named MMKV persistence
  - useExercises hook for CRUD operations
  - Exercise library screen with search and combinable filter chips
  - Tab navigator with Home and Exercises tabs
  - Color-coded MuscleGroupBadge and neutral EquipmentBadge components
affects: [03-plan-builder, 04-workout-session, 05-history]

# Tech tracking
tech-stack:
  added: []
  patterns: [named MMKV instance for multi-store isolation, as-any Supabase client calls, combinable filter chips with toggle behavior]

key-files:
  created:
    - supabase/migrations/20260310000000_create_exercises.sql
    - src/features/exercises/types.ts
    - src/features/exercises/constants/muscleGroups.ts
    - src/features/exercises/constants/equipmentTypes.ts
    - src/stores/exerciseStore.ts
    - src/features/exercises/hooks/useExercises.ts
    - src/features/exercises/components/MuscleGroupBadge.tsx
    - src/features/exercises/components/EquipmentBadge.tsx
    - src/features/exercises/components/ExerciseListItem.tsx
    - src/features/exercises/components/ExerciseFilterBar.tsx
    - src/features/exercises/components/EmptyState.tsx
    - app/(app)/(tabs)/exercises.tsx
    - tests/exercises/exercise-store.test.ts
    - tests/exercises/exercise-library.test.ts
  modified:
    - src/lib/supabase/types/database.ts
    - app/(app)/(tabs)/_layout.tsx

key-decisions:
  - "Used as-any pattern for Supabase .from() calls matching existing codebase convention (pr_baselines hook)"
  - "Used unicode characters for tab bar icons (house and lightning bolt) per Phase 1 no-vector-icons decision"

patterns-established:
  - "Named MMKV instance pattern: createMMKV({ id: 'exercise-storage' }) for multi-store isolation"
  - "Exercise filter bar with combinable horizontal ScrollView chip rows for muscle group and equipment"
  - "Color-coded badge component pattern: background at 20% opacity, text at full opacity"

requirements-completed: [EXER-01]

# Metrics
duration: 5min
completed: 2026-03-09
---

# Phase 2 Plan 1: Exercise Library Summary

**Supabase exercises table with ~37 seed exercises, Zustand store with named MMKV persistence, and browsable library screen with combinable search + muscle group + equipment filter chips**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-09T18:26:48Z
- **Completed:** 2026-03-09T18:31:51Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Created exercises table migration with RLS policies supporting global seed + user-owned custom exercises, seeded with 37 exercises across 12 muscle groups
- Built Zustand exercise store with named MMKV persistence instance and useExercises hook for full CRUD
- Converted tab navigator from Stack to Tabs with Home and Exercises tabs
- Implemented exercise library screen with search bar, color-coded muscle group filter chips, equipment filter chips, and combinable filtering via useMemo
- All 41 tests passing (19 new exercise tests + 22 existing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Exercise data layer -- migration, types, store, and database types** - `a9ccf8b` (feat)
2. **Task 2: Exercise library screen with tab navigation, search, and filter UI** - `4b0fdb0` (feat)

## Files Created/Modified
- `supabase/migrations/20260310000000_create_exercises.sql` - Exercises table with RLS and 37 seed exercises
- `src/features/exercises/types.ts` - MuscleGroup, Equipment, Exercise type definitions
- `src/features/exercises/constants/muscleGroups.ts` - Muscle group color map (12 distinct colors)
- `src/features/exercises/constants/equipmentTypes.ts` - Equipment type array
- `src/stores/exerciseStore.ts` - Zustand store with named MMKV persistence
- `src/features/exercises/hooks/useExercises.ts` - Fetch/create/update/delete hook
- `src/lib/supabase/types/database.ts` - Extended with ExerciseRow and exercises table types
- `app/(app)/(tabs)/_layout.tsx` - Converted from Stack to Tabs navigator
- `app/(app)/(tabs)/exercises.tsx` - Exercise library screen with search and filter
- `src/features/exercises/components/MuscleGroupBadge.tsx` - Color-coded muscle group chip
- `src/features/exercises/components/EquipmentBadge.tsx` - Neutral equipment chip
- `src/features/exercises/components/ExerciseListItem.tsx` - Exercise row with badges
- `src/features/exercises/components/ExerciseFilterBar.tsx` - Search + filter chips UI
- `src/features/exercises/components/EmptyState.tsx` - Empty/no-results state
- `tests/exercises/exercise-store.test.ts` - 7 store operation tests
- `tests/exercises/exercise-library.test.ts` - 12 filter logic and isCustomExercise tests

## Decisions Made
- Used `as any` pattern for Supabase `.from('exercises')` calls, matching existing codebase convention from usePRBaselines.ts (newer Supabase client types resolve to `never` without Relationships field in Database type)
- Used unicode characters for tab bar icons per Phase 1 decision to avoid @expo/vector-icons
- Used house symbol and lightning bolt for Home and Exercises tab icons respectively

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Supabase client type mismatch for exercises table**
- **Found during:** Task 2 (TypeScript verification)
- **Issue:** Supabase client `.insert()` and `.update()` resolved to `never` type for exercises table due to missing Relationships field in Database type interface
- **Fix:** Applied `as any` cast on `.from('exercises')` calls, matching established codebase pattern from usePRBaselines.ts
- **Files modified:** src/features/exercises/hooks/useExercises.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 4b0fdb0 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for TypeScript compilation. Matches existing codebase convention.

## Issues Encountered
- Web export verification (`npx expo export --platform web`) failed because react-native-web is not installed. Used `npx tsc --noEmit` as alternative compilation check, which passed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Exercise data layer complete, ready for Phase 2 Plan 2 (custom exercise CRUD via bottom sheet)
- Exercise library screen ready for reuse as exercise picker in Phase 3 plan builder
- Tab navigation established, ready for additional tabs in future phases

## Self-Check: PASSED

- All 14 created files verified present on disk
- Commit a9ccf8b (Task 1) verified in git log
- Commit 4b0fdb0 (Task 2) verified in git log
- All 41 tests passing
- TypeScript compilation clean (zero errors)

---
*Phase: 02-exercise-library*
*Completed: 2026-03-09*
