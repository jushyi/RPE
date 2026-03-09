---
phase: 02-exercise-library
verified: 2026-03-09T00:00:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
human_verification:
  - test: "Exercise library tab visible in bottom tab bar with Exercises title"
    expected: "Two-tab bottom bar shows Home and Exercises with Ionicons icons, dark background, accent tint"
    why_human: "Tab bar rendering and icon display cannot be verified programmatically"
  - test: "Search bar narrows results in real-time as user types"
    expected: "Typing 'bench' shows only bench-related exercises with no visible lag"
    why_human: "Real-time filtering feel requires live interaction"
  - test: "Muscle group chip activates visually with correct color, deactivates on re-tap"
    expected: "Tapping 'Chest' chip turns it red (#ef4444), tapping again returns it to surfaceElevated grey"
    why_human: "Color and toggle behavior require visual inspection"
  - test: "FAB opens bottom sheet, form validates, exercise saves and appears immediately"
    expected: "Tap '+' FAB, sheet slides up to 70%, fill name/muscle groups/equipment, tap 'Add Exercise', exercise appears in list with 'Custom' badge"
    why_human: "Gesture-based sheet and form submission flow require live device/simulator"
  - test: "Long-press custom exercise shows Edit/Delete; long-press seed exercise shows info only"
    expected: "Alert with Edit+Delete for custom; alert with 'This is a built-in exercise' for seed"
    why_human: "Long-press gestures and Alert dialogs require live interaction"
  - test: "Custom exercises persist across app restart"
    expected: "After creating a custom exercise and restarting the app, it still appears in the list"
    why_human: "Persistence across restart requires live device test"
---

# Phase 02: Exercise Library Verification Report

**Phase Goal:** Users can browse and search a pre-loaded exercise database and add custom exercises — the foundational data that all plans and workout sessions reference.
**Verified:** 2026-03-09
**Status:** PASSED (with human verification items)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths — Plan 01 (EXER-01)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | App launches with ~35 pre-populated exercises visible in the library tab | VERIFIED | Migration seeds 37 exercises across 12 muscle groups (Chest 5, Lats 5, Delts 5, Biceps 4, Triceps 4, Quads 4, Hamstrings 2, Glutes 2, Calves 1, Core 3, Traps 2). useExercises.fetchExercises() called in useEffect on screen mount. |
| 2 | User can search exercises by name and results narrow in real-time | VERIFIED | exercises.tsx:35-38: useMemo applies `name.toLowerCase().includes(q)` filter; onSearchChange updates searchQuery state triggering re-render. |
| 3 | User can filter by muscle group via horizontal scrollable chips | VERIFIED | ExerciseFilterBar renders MUSCLE_GROUPS (12) in horizontal ScrollView with toggle Pressable chips. exercises.tsx:30 filters by `muscle_groups.includes(selectedMuscleGroup)`. |
| 4 | User can filter by equipment type via second row of horizontal scrollable chips | VERIFIED | ExerciseFilterBar renders EQUIPMENT_TYPES (8) in second horizontal ScrollView. exercises.tsx:33 filters by `equipment === selectedEquipment`. |
| 5 | Filters and search are combinable | VERIFIED | exercises.tsx:26-41: useMemo applies all three filters sequentially — muscle group first, then equipment, then search. All three are independent state vars that combine. |
| 6 | Exercise list items show name, color-coded muscle group badge, and equipment chip | VERIFIED | ExerciseListItem renders: name (textPrimary), MuscleGroupBadge for each group in muscle_groups array (color from MUSCLE_GROUP_COLORS), EquipmentBadge (neutral surfaceElevated). |

### Observable Truths — Plan 02 (EXER-02)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 7 | User can tap Add Exercise button to open a bottom sheet form | VERIFIED | exercises.tsx:45-48: handleAddExercise calls `bottomSheetRef.current?.present()`. FAB Pressable at line 130-135 calls handleAddExercise. |
| 8 | User can fill in name, muscle group, equipment type, and optional notes | VERIFIED | ExerciseBottomSheet: BottomSheetTextInput for name (line 139), multi-select chip ScrollView for muscle_groups (line 165-204), single-select chip ScrollView for equipment (line 214-246), BottomSheetTextInput for notes (line 257-269). react-hook-form + zod validation. |
| 9 | Submitting the form creates a custom exercise that appears immediately in the library | VERIFIED | ExerciseBottomSheet.onSubmit (line 92-117): calls createExercise → useExercises.createExercise → Supabase insert → addToStore optimistically. Store update triggers re-render of FlatList. |
| 10 | Custom exercises persist across app restarts and sync to Supabase | VERIFIED | exerciseStore uses MMKV persistence (`exercise-storage` named instance). createExercise inserts to Supabase with user_id. Store migrate v0→v1 handles schema evolution. |
| 11 | User can edit a custom exercise (bottom sheet opens pre-filled) | VERIFIED | exercises.tsx:56-60: handleLongPress sets exerciseToEdit state and presents sheet. ExerciseBottomSheet useEffect (line 74-90) calls reset() with exercise data when exerciseToEdit changes. |
| 12 | User can delete a custom exercise | VERIFIED | exercises.tsx:62-76: Delete option in Alert calls deleteExercise(exercise.id) → Supabase delete → removeFromStore. |
| 13 | Duplicate name shows a non-blocking warning but allows saving | VERIFIED | ExerciseBottomSheet (line 59-71): useEffect watches nameValue, checks exercises for case-insensitive match, sets duplicateWarning. Line 153-157 renders warning text. onSubmit is not blocked — zod schema has no uniqueness check. |

**Score:** 13/13 truths verified

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260310000000_create_exercises.sql` | exercises table with RLS and ~35 seed rows | VERIFIED | Table created, 5 RLS policies, 37 seed rows. Contains: CREATE TABLE public.exercises, ENABLE ROW LEVEL SECURITY |
| `supabase/migrations/20260310000001_exercises_multi_muscle_group.sql` | Schema migration muscle_group→muscle_groups (extra, not in plan) | VERIFIED (bonus) | Converts TEXT to TEXT[], updates seed data with compound muscle groups, adds GIN index |
| `src/stores/exerciseStore.ts` | Zustand store with MMKV persistence, exports useExerciseStore | VERIFIED | createMMKV({ id: 'exercise-storage' }) named instance, persist middleware, setExercises/addExercise/updateExercise/removeExercise/setLoading actions, schema migration v0→v1 |
| `src/features/exercises/types.ts` | MuscleGroup, Equipment, Exercise type definitions; exports isCustomExercise | VERIFIED | All types exported. Note: Exercise uses muscle_groups: MuscleGroup[] (array, updated from plan's singular muscle_group) |
| `app/(app)/(tabs)/exercises.tsx` | Exercise library screen with search and filter, min 50 lines | VERIFIED | 194 lines. SafeAreaView, fetchExercises on mount, useMemo filtering, ExerciseFilterBar, FlatList, EmptyState, FAB, ExerciseBottomSheet |
| `app/(app)/(tabs)/_layout.tsx` | Tabs navigator with Dashboard and Exercises tabs | VERIFIED | Uses Tabs from expo-router with two Tabs.Screen entries (dashboard, exercises) |

### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/features/exercises/components/ExerciseBottomSheet.tsx` | Bottom sheet form for create/edit exercise, min 80 lines | VERIFIED | 373 lines. forwardRef BottomSheetModal, react-hook-form + zod, BottomSheetTextInput, chip pickers, duplicate warning, create/edit mode |
| `app/_layout.tsx` | Root layout with GestureHandlerRootView and BottomSheetModalProvider | VERIFIED | Contains: GestureHandlerRootView (outermost wrapper including loading state), BottomSheetModalProvider wrapping Slot |

### Supporting Artifacts (all exist and substantive)

| Artifact | Status | Details |
|----------|--------|---------|
| `src/features/exercises/hooks/useExercises.ts` | VERIFIED | fetchExercises, createExercise, updateExercise, deleteExercise all implemented with Supabase calls and store updates |
| `src/features/exercises/components/ExerciseListItem.tsx` | VERIFIED | Renders name, MuscleGroupBadge per group, EquipmentBadge, Custom badge for user_id !== null |
| `src/features/exercises/components/ExerciseFilterBar.tsx` | VERIFIED | Search TextInput + Ionicons search icon, two horizontal ScrollView chip rows |
| `src/features/exercises/components/MuscleGroupBadge.tsx` | VERIFIED | Color-coded badge using MUSCLE_GROUP_COLORS, background at 20% opacity (#33 hex suffix), text at full color |
| `src/features/exercises/components/EquipmentBadge.tsx` | VERIFIED | Neutral surfaceElevated badge |
| `src/features/exercises/components/EmptyState.tsx` | VERIFIED | Context-aware message (filters vs no exercises), Add Exercise button |
| `src/features/exercises/constants/muscleGroups.ts` | VERIFIED | MUSCLE_GROUP_COLORS record (12 entries), MUSCLE_GROUPS array derived from keys |
| `src/features/exercises/constants/equipmentTypes.ts` | VERIFIED | EQUIPMENT_TYPES array |
| `src/lib/supabase/types/database.ts` | VERIFIED | ExerciseRow interface and exercises table (Row/Insert/Update) added to Database.public.Tables |
| `tests/exercises/exercise-store.test.ts` | VERIFIED | 97 lines, store operation tests |
| `tests/exercises/exercise-library.test.ts` | VERIFIED | 131 lines, filter logic and isCustomExercise tests |
| `tests/exercises/exercise-crud.test.ts` | VERIFIED | 165 lines, CRUD and duplicate name detection tests |

---

## Key Link Verification

### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/(app)/(tabs)/exercises.tsx` | `src/features/exercises/hooks/useExercises.ts` | useExercises hook call | VERIFIED | Line 6: import useExercises; Line 15: `const { exercises, isLoading, fetchExercises, deleteExercise } = useExercises()` |
| `src/features/exercises/hooks/useExercises.ts` | supabase | `supabase.from('exercises').select` | VERIFIED | Line 28-30: `(supabase.from('exercises') as any).select('*').order('name')` |
| `src/stores/exerciseStore.ts` | react-native-mmkv | persist middleware with named MMKV instance | VERIFIED | Line 7: `createMMKV({ id: 'exercise-storage' })`, line 56: `createJSONStorage(() => mmkvStorage)` |

### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/features/exercises/components/ExerciseBottomSheet.tsx` | `src/features/exercises/hooks/useExercises.ts` | createExercise / updateExercise calls | VERIFIED | Line 12: import useExercises; Line 33: `const { exercises, createExercise, updateExercise } = useExercises()`; onSubmit calls both |
| `app/(app)/(tabs)/exercises.tsx` | `src/features/exercises/components/ExerciseBottomSheet.tsx` | ref-based present/dismiss | VERIFIED | Line 10: import ExerciseBottomSheet; Line 20: `useRef<BottomSheetModal>`; Line 47: `bottomSheetRef.current?.present()`; Line 137-141: `<ExerciseBottomSheet ref={bottomSheetRef} ...>` |
| `app/_layout.tsx` | @gorhom/bottom-sheet | BottomSheetModalProvider wrapping app | VERIFIED | Line 7: `import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'`; Lines 46-52: GestureHandlerRootView > BottomSheetModalProvider > children |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| EXER-01 | 02-01-PLAN.md | App ships with pre-loaded library of common exercises (searchable by muscle group) | SATISFIED | 37 seed exercises in migration, searchable by name and filterable by muscle group in exercises.tsx |
| EXER-02 | 02-02-PLAN.md | User can create custom exercises with name, muscle group, and equipment type | SATISFIED | ExerciseBottomSheet with zod-validated form, createExercise → Supabase insert, appears immediately in list |

No orphaned requirements — both IDs claimed in plans match requirements assigned to Phase 2.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/(app)/(tabs)/_layout.tsx` | 2, 24, 33 | Uses `@expo/vector-icons` (Ionicons) — plan said unicode-only | Info | Plan deviation. Library IS installed (transitive expo dep). CLAUDE.md says "use icon components" which Ionicons satisfies. No functional issue. |
| `src/features/exercises/components/ExerciseFilterBar.tsx` | 2, 29 | Uses Ionicons for search icon | Info | Same as above — consistent with tab layout and CLAUDE.md guidelines. |
| `src/features/exercises/components/EmptyState.tsx` | 2, 14 | Uses Ionicons for barbell icon | Info | Same as above. |

No blocker or warning anti-patterns found. The Ionicons usage is a plan-level deviation that is actually consistent with CLAUDE.md project conventions.

---

## Notable Implementation Detail

The Exercise type was upgraded from `muscle_group: MuscleGroup` (singular) to `muscle_groups: MuscleGroup[]` (array) during execution, with a corresponding second migration (`20260310000001_exercises_multi_muscle_group.sql`) to convert the database column. The store includes a v0→v1 migration for MMKV-persisted data. All downstream code (ExerciseListItem, ExerciseBottomSheet, useExercises, exercises.tsx) correctly uses `muscle_groups` (plural array). This is a bonus capability beyond what EXER-01/02 require.

---

## Human Verification Required

### 1. Tab bar visual rendering

**Test:** Launch the app and tap the Exercises tab in the bottom bar.
**Expected:** Bottom tab bar with "Home" tab (home-outline Ionicons icon) and "Exercises" tab (barbell-outline icon). Active tab accent blue, inactive textMuted. Dark surface background.
**Why human:** Tab bar styling and icon rendering require live device/simulator.

### 2. Search real-time filtering

**Test:** Open the Exercises tab. Type "bench" in the search bar.
**Expected:** List narrows to bench-related exercises (Bench Press, Incline Bench Press, Decline Bench Press, Close-Grip Bench Press). Filtering happens as each character is typed.
**Why human:** Real-time responsiveness requires live interaction.

### 3. Muscle group filter chips toggle behavior

**Test:** Tap the "Chest" chip in the first filter row.
**Expected:** Chip turns red (#ef4444 at 80% opacity CC suffix), only chest exercises remain in list. Tap Chest again — chip returns to grey, full list shows.
**Why human:** Color rendering and toggle behavior require visual confirmation.

### 4. Add exercise via bottom sheet

**Test:** Tap the blue circular "+" FAB button at bottom-right.
**Expected:** Bottom sheet slides up to 70% of screen. Form shows: name text input, muscle group chips (scrollable row), equipment chips (scrollable row), notes input, "Add Exercise" button. Fill in "Landmine Press", select "Delts", select "Barbell", tap Add Exercise.
**Expected result:** Sheet dismisses, new exercise appears in list with "Custom" badge.
**Why human:** Bottom sheet gestures, form interaction, and list update require live device.

### 5. Edit and delete custom exercises via long-press

**Test:** Long-press the "Landmine Press" exercise (or any custom exercise).
**Expected:** Alert dialog with exercise name as title, three buttons: "Edit", "Delete" (destructive), "Cancel". Tapping Edit opens bottom sheet with fields pre-filled. Tapping Delete shows a confirmation alert; confirming removes the exercise.
**Test 2:** Long-press a built-in exercise (e.g., "Bench Press").
**Expected:** Alert says "This is a built-in exercise and cannot be edited or deleted." No Edit/Delete options.
**Why human:** Alert dialogs and gesture detection require live device.

### 6. Persistence across app restart

**Test:** Create a custom exercise, note its name. Close and reopen the app (not hot-reload — full restart). Navigate to Exercises tab.
**Expected:** Custom exercise appears in the list (from MMKV persistence). After connectivity is established, it should also be present in Supabase.
**Why human:** App restart and persistence verification require live device interaction.

---

## Gaps Summary

No gaps found. All 13 observable truths are verified, all artifacts exist and are substantive and wired, both requirement IDs (EXER-01, EXER-02) are satisfied, all key links are confirmed. The three commits (a9ccf8b, 4b0fdb0, e626a74) exist in git history.

The implementation went beyond the plan in one way: multi-muscle-group support (`muscle_groups: MuscleGroup[]` instead of `muscle_group: MuscleGroup`), which is a superset of the requirement and does not break any must-have.

The plan-level deviation of using Ionicons instead of unicode characters for tab and search icons is a quality improvement consistent with CLAUDE.md guidelines.

---

_Verified: 2026-03-09_
_Verifier: Claude (gsd-verifier)_
