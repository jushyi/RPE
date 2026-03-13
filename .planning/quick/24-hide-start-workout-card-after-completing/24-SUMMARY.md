---
phase: quick-24
plan: 01
subsystem: dashboard
tags: [ui, dashboard, workout-completion]
dependency_graph:
  requires: [useCompletedToday, TodaysWorkoutCard]
  provides: [conditional-card-hiding]
  affects: [dashboard]
tech_stack:
  patterns: [conditional-render-via-prop, plan-day-id-matching]
key_files:
  modified:
    - src/features/dashboard/components/TodaysWorkoutCard.tsx
    - app/(app)/(tabs)/dashboard.tsx
decisions:
  - "Hide only for exact plan_day_id match (freestyle workouts don't hide the card)"
metrics:
  duration: 2min
  completed: "2026-03-12T14:15:00Z"
  tasks_completed: 1
  tasks_total: 1
---

# Quick Task 24: Hide Start Workout Card After Completing Summary

Added completedSessions prop to TodaysWorkoutCard that hides the planned workout card when a completed session matches the plan day ID.

## What Was Done

### Task 1: Hide TodaysWorkoutCard when planned workout is completed
**Commit:** 84f9665

- Added `completedSessions` optional prop (typed as `WorkoutSession[]`) to `TodaysWorkoutCard`
- In the `planned` state branch, added early return `null` when any completed session's `plan_day_id` matches `workout.todayDay.id`
- Passed `completedToday` from dashboard to the component as `completedSessions` prop
- Rest-day and no-plan states remain unaffected (they still show their respective cards)

**Logic handles edge cases correctly:**
- Multiple workouts in a day: only hides if the specific plan day was completed
- Freestyle workouts: `plan_day_id` is null, won't match any planned day
- No completed workouts: empty array, card shows normally

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles without new errors (pre-existing errors in unrelated files unchanged)
- Conditional hiding logic is correct: `completedSessions.some(s => s.plan_day_id === workout.todayDay!.id)`

## Self-Check: PASSED
