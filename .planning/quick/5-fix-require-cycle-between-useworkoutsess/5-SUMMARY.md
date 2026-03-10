---
phase: quick-5
plan: 5
subsystem: workout
tags: [bugfix, require-cycle, module-structure]
dependency_graph:
  requires: []
  provides: [workout-session-bridge]
  affects: [useWorkoutSession, workout-summary, workout-index]
tech_stack:
  added: []
  patterns: [bridge-module-pattern]
key_files:
  created:
    - src/features/workout/workoutSessionBridge.ts
  modified:
    - src/features/workout/hooks/useWorkoutSession.ts
    - app/(app)/workout/summary.tsx
    - app/(app)/workout/index.tsx
decisions:
  - Bridge module pattern to break circular dependency between hook and screen
metrics:
  duration: 1min
  completed: "2026-03-10T14:17:18Z"
---

# Quick Task 5: Fix Require Cycle Between useWorkoutSession and Summary

Bridge module extracts shared module-level state (completedSession + isFinishing flags) to break circular dependency between useWorkoutSession.ts and summary.tsx.

## What Was Done

### Task 1: Create workoutSessionBridge.ts and update all callers
**Commit:** c567863

Created `src/features/workout/workoutSessionBridge.ts` with 6 exported functions:
- `setCompletedSession` / `getCompletedSession` / `clearCompletedSession` -- session handoff
- `isWorkoutFinishing` / `setIsFinishing` / `resetFinishingFlag` -- finishing flag

Updated three callers:
- **useWorkoutSession.ts**: Removed import from `app/(app)/workout/summary`, removed local `_isFinishing` variable and its exported functions, imports from bridge instead
- **summary.tsx**: Removed import from `useWorkoutSession`, removed local `_completedSession` variable and its exported functions, imports from bridge instead
- **workout/index.tsx**: Split combined import into two -- `useWorkoutSession` from hook, `isWorkoutFinishing` from bridge

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. `grep -rn "from.*workout/summary" src/features/workout/hooks/` -- no results (cycle broken)
2. `grep -rn "from.*useWorkoutSession" app/(app)/workout/summary.tsx` -- no results (cycle broken)
3. `grep -n "workoutSessionBridge" app/(app)/workout/index.tsx` -- shows bridge import
4. workoutSessionBridge.ts exists at expected path
5. TypeScript compilation passes (only pre-existing test fixture errors unrelated to changes)

## Commits

| Task | Commit  | Description                                      |
|------|---------|--------------------------------------------------|
| 1    | c567863 | Break require cycle with bridge module pattern   |
