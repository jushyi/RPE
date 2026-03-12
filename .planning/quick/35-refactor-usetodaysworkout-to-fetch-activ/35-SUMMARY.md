---
phase: quick-35
plan: 01
subsystem: dashboard
tags: [refactor, supabase, stale-data, auth]
dependency_graph:
  requires: [supabase, authStore]
  provides: [direct-supabase-fetch-for-todays-workout]
  affects: [TodaysWorkoutCard, useTodaysWorkout, planStore, useAuth]
tech_stack:
  patterns: [supabase-direct-query-by-userId, cleanup-on-unmount]
key_files:
  created: []
  modified:
    - src/features/dashboard/hooks/useTodaysWorkout.ts
    - src/features/dashboard/components/TodaysWorkoutCard.tsx
    - src/stores/planStore.ts
    - src/features/auth/hooks/useAuth.ts
decisions:
  - "Direct Supabase query keyed by userId replaces MMKV cache read for TodaysWorkoutCard"
  - "clearPlans workaround from quick-34 fully reverted since root cause is now fixed"
metrics:
  duration: 2min
  completed: "2026-03-12T22:55:00Z"
---

# Quick Task 35: Refactor useTodaysWorkout to Fetch Active Plan from Supabase

Direct Supabase query for active plan keyed by userId, replacing MMKV cache read to fix stale data on account switch.

## What Was Done

### Task 1: Rewrite useTodaysWorkout to fetch active plan from Supabase
**Commit:** 2eb01dd

- Replaced `usePlanStore` MMKV cache read with direct Supabase query using `userId` from `authStore`
- Hook now returns `{ workout, activePlan }` so TodaysWorkoutCard gets full plan_day data for startFromPlan
- Added `useEffect` with `userId` dependency that auto-refetches when account switches
- Implemented cleanup pattern (`let cancelled = false`) to prevent state updates after unmount
- Normalized plan_days and plan_day_exercises by sort_order (same as fetchPlans pattern)
- Updated TodaysWorkoutCard to destructure new hook return value and removed `usePlanStore` import

### Task 2: Revert quick-34 clearPlans workaround
**Commit:** 0925632

- Removed `clearPlans` action from `PlanActions` interface and implementation in planStore
- Removed `usePlanStore` import from useAuth entirely
- Removed `clearPlans()` calls from both `signOut` callback and `onAuthStateChange` else branch
- Safe because useTodaysWorkout now re-fetches from Supabase when userId changes

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compilation passes (no new errors)
- `clearPlans` has zero references remaining in src/

## Self-Check: PASSED

All files exist, both commits verified.
