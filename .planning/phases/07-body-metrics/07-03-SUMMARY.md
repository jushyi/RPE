---
phase: 07-body-metrics
plan: 03
subsystem: body-metrics
tags: [react-native, supabase, migration, body-measurements, biceps, quad]

requires:
  - phase: 07-body-metrics
    provides: "Body measurements data layer and detail screen (plans 01-02)"
provides:
  - "CircumferenceMetric includes biceps and quad (no hips)"
  - "DB migration dropping hips columns, adding biceps/quad columns"
  - "Form, history, dashboard, charts all use biceps/quad"
affects: [body-metrics, settings-export]

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - supabase/migrations/20260315000002_replace_hips_with_biceps_quad.sql
  modified:
    - src/features/body-metrics/types.ts
    - src/features/body-metrics/utils/validation.ts
    - src/features/body-metrics/hooks/useBodyMetricsChartData.ts
    - src/features/body-metrics/hooks/useBodyMeasurements.ts
    - src/stores/bodyMeasurementStore.ts
    - src/features/settings/utils/csvExport.ts
    - src/features/body-metrics/components/MeasurementForm.tsx
    - src/features/body-metrics/components/MeasurementHistoryItem.tsx
    - src/features/body-metrics/components/BodyCard.tsx
    - app/(app)/body-metrics.tsx
    - tests/body-metrics/form-validation.test.ts
    - tests/body-metrics/chart-data.test.ts
    - tests/body-metrics/measurement-store.test.ts

key-decisions:
  - "Hips data dropped in migration (acceptable per user decision)"
  - "Store persist version bumped to 2 for new BodyMeasurement shape"

patterns-established: []

requirements-completed: [HIST-04]

duration: 6min
completed: 2026-03-12
---

# Phase 07 Plan 03: Replace Hips with Biceps/Quad Summary

**Replaced hips measurement field with biceps and quad across entire body metrics vertical slice (DB migration, types, validation, hooks, store, CSV export, form, history, charts, dashboard)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-12T15:15:38Z
- **Completed:** 2026-03-12T15:21:55Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Created DB migration dropping hips columns and adding biceps/quad with unit constraints
- Updated all data layer files (types, validation, hooks, store, CSV export) to use biceps/quad
- Updated all UI components (form, history item, BodyCard, body-metrics screen) to display biceps/quad
- All 38 body-metrics tests pass with zero "hips" references remaining in feature code

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace hips with biceps/quad in data layer** - `6a9cbd8` (feat)
2. **Task 2: Replace hips with biceps/quad in UI layer** - `f98d041` (feat)
3. **Fix: Re-apply changes reverted by linter** - `0e520e3` (fix)

## Files Created/Modified
- `supabase/migrations/20260315000002_replace_hips_with_biceps_quad.sql` - Drop hips, add biceps/quad columns with constraints
- `src/features/body-metrics/types.ts` - BodyMeasurement interface and CircumferenceMetric union type
- `src/features/body-metrics/utils/validation.ts` - Validation for biceps/quad requiring units
- `src/features/body-metrics/hooks/useBodyMetricsChartData.ts` - CIRCUMFERENCE_METRICS array
- `src/features/body-metrics/hooks/useBodyMeasurements.ts` - Fetch mapper and insert payload
- `src/stores/bodyMeasurementStore.ts` - Persist version bump to 2
- `src/features/settings/utils/csvExport.ts` - CSV headers and row mapping
- `src/features/body-metrics/components/MeasurementForm.tsx` - Biceps/Quad field rows
- `src/features/body-metrics/components/MeasurementHistoryItem.tsx` - Biceps/Quad value chips
- `src/features/body-metrics/components/BodyCard.tsx` - Biceps/Quad dashboard rows
- `app/(app)/body-metrics.tsx` - Biceps/Quad chart data hooks and chart components
- `tests/body-metrics/form-validation.test.ts` - Biceps/quad validation test cases
- `tests/body-metrics/chart-data.test.ts` - Updated mock data fixtures
- `tests/body-metrics/measurement-store.test.ts` - Updated mock data fixtures

## Decisions Made
- Hips data dropped in migration (acceptable per user request: "we don't need hips")
- Store persist version bumped to 2 since BodyMeasurement shape changed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test mock data referencing removed hips fields**
- **Found during:** Task 2 (UI layer)
- **Issue:** chart-data.test.ts and measurement-store.test.ts mock objects still had hips/hips_unit fields, causing TS errors
- **Fix:** Updated all mock BodyMeasurement objects to use biceps/quad fields
- **Files modified:** tests/body-metrics/chart-data.test.ts, tests/body-metrics/measurement-store.test.ts
- **Verification:** npx tsc --noEmit shows no new type errors in body-metrics tests
- **Committed in:** 0e520e3

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix was necessary for type correctness after interface change. No scope creep.

## Issues Encountered
- Linter reverted changes in MeasurementForm.tsx, BodyCard.tsx, and test files between staging and commit. Re-applied all changes and committed as separate fix commit.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Body metrics feature now uses correct field set (bodyweight, chest, waist, biceps, quad, body fat)
- Migration must be run on Supabase to update schema before using new fields

---
*Phase: 07-body-metrics*
*Completed: 2026-03-12*
