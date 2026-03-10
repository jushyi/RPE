---
phase: quick-14
plan: 01
subsystem: workout-session
tags: [bugfix, workout, resume, ui-state]
dependency_graph:
  requires: []
  provides: [resumed-workout-displays-logged-values]
  affects: [SetCard, ExercisePage]
tech_stack:
  patterns: [useState-lazy-initializer, prop-driven-state-init]
key_files:
  modified:
    - src/features/workout/components/SetCard.tsx
    - src/features/workout/components/ExercisePage.tsx
decisions:
  - "Prefer loggedSet over targetSet in state initialization (loggedSet is truth for resumed sessions)"
  - "Keep isLogged prop for backward compatibility but derive from loggedSet presence"
metrics:
  duration: 1min
  completed: "2026-03-10"
---

# Quick Task 14: Fix Resumed Session Not Showing Previous Values

SetCard now initializes weight/reps/RPE from loggedSet data when resuming a workout, instead of only from targetSet.

## What Changed

### SetCard.tsx
- Added optional `loggedSet?: SetLog` prop to `SetCardProps` interface
- Changed `useState` initializers to use lazy initializer functions that prefer `loggedSet` values over `targetSet` values
- `hasLogged` ref now also initializes from `loggedSet` presence (`!!loggedSet`)

### ExercisePage.tsx
- Changed `isAlreadyLogged` boolean lookup (`.some()`) to `loggedSet` object lookup (`.find()`) for the matching logged set
- Passes the actual `loggedSet` object to each `SetCard` component
- Derives `isLogged` boolean from `!!loggedSet` for efficiency

## Root Cause

When resuming a workout, the MMKV-persisted store correctly retained `logged_sets` data. However, `SetCard` only initialized its `weight`, `reps`, and `rpe` state from `targetSet` (the plan target). The `isLogged` boolean was correctly passed (showing the "Logged" badge), but the input fields displayed empty or target values instead of the actual logged data.

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 94b2980 | fix(quick-14): display previously logged values when resuming workout |
| cleanup | e13c99f | chore(quick-14): remove unused imports added by linter |

## Self-Check: PASSED

- [x] SetCard.tsx exists and contains loggedSet prop
- [x] ExercisePage.tsx exists and passes loggedSet to SetCard
- [x] Commit 94b2980 exists (main fix)
- [x] Commit e13c99f exists (linter cleanup)
