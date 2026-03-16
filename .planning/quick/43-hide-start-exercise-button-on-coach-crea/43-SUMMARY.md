---
phase: quick-43
plan: 1
subsystem: plans
tags: [coach, trainee, visibility, button-hiding]
dependency_graph:
  requires: [useAuthStore, PlanDaySection]
  provides: [conditional-start-workout-visibility]
  affects: [plan-detail-screen]
tech_stack:
  patterns: [conditional-prop-passing, userId-comparison]
key_files:
  modified:
    - app/(app)/plans/[id].tsx
decisions:
  - "Used plan.coach_id === userId comparison to determine coach ownership"
  - "Passed undefined to onStartWorkout prop to leverage existing PlanDaySection hide logic"
metrics:
  duration: 1min
  completed: "2026-03-16T13:40:00Z"
---

# Quick Task 43: Hide Start Workout Button on Coach-Created Trainee Plans

Conditional hiding of Start Workout and Set as Active Plan buttons when a coach views a plan they created for a trainee, using userId comparison against plan.coach_id.

## Changes Made

### Task 1: Conditionally hide Start Workout for coach-owned plans

**Commit:** 46f5db7

In `app/(app)/plans/[id].tsx`:
- Added `useAuthStore` import and `userId` selector at component top
- Changed `onStartWorkout` prop: passes `undefined` when `plan.coach_id === userId` (coach viewing their own trainee plan), otherwise passes `startFromPlan` as before
- Changed `ListFooterComponent`: added `plan.coach_id !== userId` condition so the "Set as Active Plan" button is hidden for the coach

**Logic:**
- `plan.coach_id === null` (self-created plan): both buttons visible (null !== userId)
- `plan.coach_id !== userId` (trainee viewing coach plan): both buttons visible
- `plan.coach_id === userId` (coach viewing their trainee plan): both buttons hidden

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compilation passes with no new errors (pre-existing errors in unrelated files)
- No errors in the modified file `[id].tsx`
