---
phase: quick-9
plan: 1
subsystem: workout
tags: [bugfix, data-integrity, workout-logging]
dependency_graph:
  requires: []
  provides: [session-exercise-id-matching]
  affects: [workout-store, exercise-page, workout-session-hook]
tech_stack:
  added: []
  patterns: [session-unique-id-matching]
key_files:
  created: []
  modified:
    - src/stores/workoutStore.ts
    - src/features/workout/components/ExercisePage.tsx
    - src/features/workout/hooks/useWorkoutSession.ts
    - tests/workout/set-logging.test.ts
    - tests/workout/workout-store.test.ts
    - tests/workout/workout-session-hook.test.ts
decisions:
  - logSet and removeExercise match by session exercise `id` (unique per session) not `exercise_id` (shared catalog id)
metrics:
  duration: 3min
  completed: "2026-03-10"
  tasks_completed: 2
  tasks_total: 2
---

# Quick Task 9: Fix Workout Log Data Not Saving Properly

logSet and removeExercise now match by session exercise unique `id` instead of shared catalog `exercise_id`, preventing sets from being logged to the wrong exercise when duplicates exist in a plan day.

## What Was Done

### Task 1: Fix store matching and add regression test (TDD)

**RED:** Updated all existing test calls from `logSet('ex-1', ...)` to `logSet('se-1', ...)` to match by session exercise id. Added two new regression tests: one proving duplicate `exercise_id` exercises log to the correct one, and one proving `removeExercise` removes only the targeted session exercise.

**GREEN:** Changed `logSet` findIndex from `e.exercise_id === exerciseId` to `e.id === exerciseId`. Changed `removeExercise` filter from `e.exercise_id !== exerciseId` to `e.id !== exerciseId`.

**Commits:**
- `d3d2b24` - test(quick-9): add failing tests for session exercise id matching
- `afb9e09` - feat(quick-9): fix logSet and removeExercise to match by session exercise id

### Task 2: Update all callers to pass session exercise id

- `ExercisePage.tsx`: Changed `onLogSet(exercise.exercise_id, ...)` to `onLogSet(exercise.id, ...)`. Passed `handleLog` directly to SetCard instead of wrapping in inline arrow function.
- `useWorkoutSession.ts`: Changed `logSetAction(currentExercise.exercise_id, setLog)` to `logSetAction(currentExercise.id, setLog)`.
- `workout-session-hook.test.ts`: Updated all `logSet('ex-1', ...)` calls to `logSet('se-1', ...)` (auto-fix, Rule 3 - blocking test failures from store change).

**Commit:** `abeadbc` - fix(quick-9): update all callers to pass session exercise id to logSet

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated workout-session-hook.test.ts logSet calls**
- **Found during:** Task 2 verification
- **Issue:** `workout-session-hook.test.ts` also called `logSet('ex-1', ...)` which failed after store change
- **Fix:** Updated all occurrences to `logSet('se-1', ...)` matching the session exercise id
- **Files modified:** tests/workout/workout-session-hook.test.ts
- **Commit:** abeadbc

## Verification

- All 42 workout tests pass
- TypeScript compiles cleanly (only pre-existing unrelated error in dashboard.tsx)
