---
phase: quick-34
plan: 01
subsystem: auth/plans
tags: [bugfix, stale-data, sign-out, plan-store]
dependency_graph:
  requires: []
  provides: [plan-store-clear-on-signout]
  affects: [dashboard, todays-workout-card]
tech_stack:
  added: []
  patterns: [getState-for-cross-store-actions]
key_files:
  created: []
  modified:
    - src/stores/planStore.ts
    - src/features/auth/hooks/useAuth.ts
decisions:
  - Used usePlanStore.getState().clearPlans() to avoid subscribing useAuth hook to planStore changes
metrics:
  duration: 1min
  completed: "2026-03-12T22:41:00Z"
---

# Quick Task 34: Fix TodaysWorkoutCard Showing Stale Workout Data

Clear plan store MMKV cache on sign-out so account switching shows correct workout data instead of previous user's plans.

## What Was Done

### Task 1: Add clearPlans action to planStore and call it on sign-out

- Added `clearPlans` action to `PlanActions` interface and store implementation in `planStore.ts`
- `clearPlans` resets `plans` to `[]`, `lastFetched` to `null`, and `isLoading` to `false`
- Resetting `lastFetched` ensures the cache guard in `fetchPlans` won't skip re-fetching for the new user
- Added `usePlanStore.getState().clearPlans()` call in `useAuth.ts` signOut callback before `clearAuth()`
- Added same call in `onAuthStateChange` null-session branch for edge cases (token expiry, server-side revocation)

**Commit:** 718c566

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- Existing plan store tests pass (8/8)
- clearPlans resets plans array and lastFetched, ensuring fetchPlans will re-fetch on next mount

## Self-Check: PASSED
