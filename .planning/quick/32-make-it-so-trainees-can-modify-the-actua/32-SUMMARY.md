---
phase: quick-32
plan: 01
subsystem: plans
tags: [coach-plans, weekday-picker, trainee-scheduling]
dependency_graph:
  requires: [plans-crud, coaching-system]
  provides: [trainee-weekday-modification]
  affects: [plan-detail-screen, plan-day-section]
tech_stack:
  added: []
  patterns: [optimistic-update, fire-and-forget-db, modal-picker]
key_files:
  created: []
  modified:
    - src/features/plans/hooks/usePlanDetail.ts
    - src/features/plans/components/PlanDaySection.tsx
    - app/(app)/plans/[id].tsx
decisions:
  - "Optimistic local update with fire-and-forget DB sync for weekday changes"
  - "WeekdayPickerModal inline in PlanDaySection file (small, single-use component)"
  - "Chip only shown when isCoachPlan && onWeekdayChange are both provided"
metrics:
  duration: 3min
  completed: "2026-03-12T22:28:00Z"
---

# Quick Task 32: Trainee Weekday Modification on Coach Plans Summary

Allow trainees to change weekday assignments on coach-created plans via tappable chip and modal picker, without entering full edit mode.

## Completed Tasks

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Add updateDayWeekday to usePlanDetail and wire into plan detail screen | 609b32b | Optimistic weekday update with MMKV sync; isCoachPlan/onWeekdayChange props passed to PlanDaySection |
| 2 | Add tappable weekday chip and picker modal to PlanDaySection | 1688396 | WeekdayPickerModal with 7-day selection; accent-bordered chip replaces plain text on coach plans |

## Implementation Details

**usePlanDetail.ts:** Added `updateDayWeekday(dayId, weekday)` function that performs optimistic local state update, syncs to MMKV store via `updateInStore`, and fires a background Supabase update to `plan_days` table. Errors are logged with console.warn (non-blocking).

**PlanDaySection.tsx:** Added `WeekdayPickerModal` component with transparent overlay and centered card showing full weekday names (Sunday-Saturday). Currently selected day highlighted in accent color with checkmark icon. Added `weekdayChip` style -- small rounded pressable with accent border showing abbreviated weekday or "Set Day" placeholder. Chip only rendered when `isCoachPlan && onWeekdayChange` are both provided; personal plans retain existing plain text display.

**[id].tsx:** Destructures `updateDayWeekday` from `usePlanDetail`. Determines `isCoachPlan` from `!!plan.coach_id`. Passes props to `PlanDaySection` in read-only FlatList only (not in edit mode).

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- [x] src/features/plans/hooks/usePlanDetail.ts -- modified, exports updateDayWeekday
- [x] src/features/plans/components/PlanDaySection.tsx -- modified, contains WeekdayPickerModal
- [x] app/(app)/plans/[id].tsx -- modified, passes isCoachPlan and onWeekdayChange
- [x] Commit 609b32b exists
- [x] Commit 1688396 exists
- [x] TypeScript compiles (no new errors)
