---
phase: quick-42
plan: 01
subsystem: exercises
tags: [exercise-creation, inline-form, admin-global, supabase-trigger]
dependency_graph:
  requires: [useExercises, ExerciseBottomSheet, ExerciseFilterBar]
  provides: [inline-exercise-creation, admin-global-exercises]
  affects: [ExercisePicker, FreestyleExercisePicker, exercises-table]
tech_stack:
  patterns: [stacked-bottom-sheet, inline-form, supabase-trigger, rls-policy]
key_files:
  created:
    - supabase/migrations/20260316000001_admin_exercises_global.sql
  modified:
    - src/features/plans/components/ExercisePicker.tsx
    - src/features/workout/components/FreestyleExercisePicker.tsx
decisions:
  - ExercisePicker uses stacked BottomSheetModal for exercise creation (standard gorhom stacking)
  - FreestyleExercisePicker uses inline quick-create form (cannot nest BottomSheetModal in plain Modal)
  - BEFORE INSERT trigger with SECURITY DEFINER for admin email check against auth.users
metrics:
  duration: 4min
  completed: "2026-03-16T13:19:00Z"
---

# Quick Task 42: Add Exercises from Any Sheet View and Make Admin Exercises Global

Create new exercises directly from plan builder and freestyle workout pickers; admin-created exercises automatically become global.

## One-liner

Inline exercise creation in both exercise pickers plus Supabase trigger making admin exercises global for all users.

## What Was Done

### Task 1: Add "Create New Exercise" to ExercisePicker and FreestyleExercisePicker
- **Commit:** e3566d8
- **ExercisePicker.tsx:** Added "Create New Exercise" Pressable with Ionicons add-circle-outline icon. Opens a stacked ExerciseBottomSheet (BottomSheetModal) for full exercise creation form. On save, force-refreshes exercise list.
- **FreestyleExercisePicker.tsx:** Added toggle-able inline quick-create form with name TextInput, horizontal muscle group chips (with domain colors), horizontal equipment chips, Save/Cancel buttons. Validates name, muscle groups, and equipment before calling createExercise. Resets form and refreshes list on success.

### Task 2: Supabase Migration for Admin Global Exercises
- **Commit:** 2538ff7
- Created `make_admin_exercises_global()` trigger function (SECURITY DEFINER) that checks if inserting user is maserinj@gmail.com and sets user_id to NULL (making exercise global).
- Created BEFORE INSERT trigger `trg_admin_exercises_global` on exercises table.
- Added RLS policy "Admin can insert global exercises" to allow the admin user to insert with user_id=NULL (since trigger changes it before RLS check).
- Retroactively updated existing admin exercises to global.
- Migration applied successfully to remote Supabase.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compilation passes (no new errors introduced; pre-existing errors in unrelated files)
- Migration file contains trigger function, trigger, admin insert policy, and retroactive update
- Both pickers have "Create New Exercise" UI with proper accent styling

## Self-Check: PASSED
