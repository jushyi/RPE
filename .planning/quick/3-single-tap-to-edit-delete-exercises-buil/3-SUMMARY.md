---
phase: quick
plan: 3
subsystem: exercises
tags: [ux, bottom-sheet, exercises]
dependency_graph:
  requires: []
  provides: [single-tap-exercise-interaction, read-only-detail-view, inline-delete]
  affects: [exercises-screen, exercise-bottom-sheet, exercise-list-item]
tech_stack:
  added: []
  patterns: [read-only-mode-prop, inline-delete-with-confirmation]
key_files:
  created: []
  modified:
    - app/(app)/(tabs)/exercises.tsx
    - src/features/exercises/components/ExerciseListItem.tsx
    - src/features/exercises/components/ExerciseBottomSheet.tsx
decisions:
  - Read-only mode uses plain Text components instead of disabled form inputs for cleaner UX
  - Delete button placed below Save Changes in edit mode for clear visual hierarchy
metrics:
  duration: 2min
  completed: "2026-03-09"
---

# Quick Task 3: Single-Tap to Edit/Delete Exercises Summary

**One-liner:** Replaced long-press Alert menu with single-tap bottom sheet -- custom exercises open editable form with delete button, built-in exercises show read-only detail view.

## What Was Done

### Task 1: Wire single-tap and add read-only mode to bottom sheet (271c224)

**ExerciseListItem.tsx:**
- Changed `onLongPress` prop to `onPress` in interface and Pressable usage
- Kept pressed opacity style for tap feedback

**exercises.tsx:**
- Removed `handleLongPress` callback and its Alert.alert flow entirely
- Created `handlePress` callback that sets exerciseToEdit and readOnly state, then presents bottom sheet
- Added `readOnly` state, set based on `isCustomExercise()` check
- `handleAddExercise` now explicitly sets `readOnly(false)`
- Passed `readOnly` and `onDelete={deleteExercise}` to ExerciseBottomSheet

**ExerciseBottomSheet.tsx:**
- Added `readOnly?: boolean` and `onDelete?: (id: string) => void` to props
- Read-only mode: shows "Built-in exercise" label, exercise name as title, muscle groups as colored chips, equipment and notes as plain text, no form inputs or submit button
- Edit mode: shows form as before plus a Delete Exercise button below Save Changes
- Delete button: transparent background, red border/text, triggers confirmation Alert before calling onDelete
- On delete confirm: calls onDelete and dismisses the bottom sheet

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles without errors (`npx tsc --noEmit` passed)
- No emojis in any UI text (uses plain text labels only)

## Self-Check: PASSED
