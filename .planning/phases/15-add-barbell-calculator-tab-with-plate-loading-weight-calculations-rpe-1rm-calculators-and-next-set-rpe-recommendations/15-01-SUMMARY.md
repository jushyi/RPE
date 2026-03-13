---
phase: 15-add-barbell-calculator-tab-with-plate-loading-weight-calculations-rpe-1rm-calculators-and-next-set-rpe-recommendations
plan: 01
subsystem: calculator
tags: [plate-calculator, rpe, 1rm, pure-functions, tdd]

requires:
  - phase: 15-00
    provides: test stubs and directory scaffold for calculator feature
provides:
  - PlateBreakdown, BarPreset, NextSetInput, NextSetResult TypeScript types
  - LB_PLATES, KG_PLATES, BAR_PRESETS, PLATE_COLORS_LB, PLATE_COLORS_KG, PLATE_HEIGHTS constants
  - calculatePlates greedy plate breakdown algorithm
  - RPE_TABLE Tuchscherer percentage lookup (RPE 6-10 x 1-12 reps)
  - getWeightForRpeAndReps RPE-based weight lookup
  - calculateNextSet next-set weight recommendation with rounding
  - roundToLoadable weight rounding utility (5 lb / 2.5 kg)
affects: [15-02, 15-03]

tech-stack:
  added: []
  patterns: [greedy-plate-algorithm, rpe-percentage-table-lookup, loadable-weight-rounding]

key-files:
  created:
    - src/features/calculator/types.ts
    - src/features/calculator/constants/plates.ts
    - src/features/calculator/utils/plateCalculator.ts
    - src/features/calculator/utils/rpeTable.ts
    - src/features/calculator/utils/nextSetCalc.ts
  modified:
    - tests/calculator/rpeTable.test.ts
    - tests/calculator/nextSetCalc.test.ts

key-decisions:
  - "Used epsilon tolerance (0.001) in plate greedy algorithm to avoid floating point near-miss"
  - "RPE table uses standard Tuchscherer values from RESEARCH.md"
  - "roundToLoadable is separate export for reuse in UI components"

patterns-established:
  - "Greedy plate algorithm: iterate descending plates, Math.round after each subtraction"
  - "RPE table: Record<number, number[]> with reps-1 index for O(1) lookup"

requirements-completed: [CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07]

duration: 3min
completed: 2026-03-13
---

# Phase 15 Plan 01: Calculator Domain Logic Summary

**Pure calculator utilities with greedy plate algorithm, Tuchscherer RPE table, and next-set weight recommendation -- 28 tests passing**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-13T16:13:07Z
- **Completed:** 2026-03-13T16:16:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Types, plate constants (lb/kg), bar presets, plate colors/heights all exported
- calculatePlates handles normal weights, edge cases (below bar, exact bar), floating point, and kg plates
- RPE_TABLE covers RPE 6-10 in 0.5 increments for 1-12 reps with standard Tuchscherer values
- Next-set calculator derives e1RM from last set, recommends rounded target weight with explanation
- All 28 unit tests passing across 3 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Types, constants, plate calculator** - `c7a5b1e` (feat)
2. **Task 2: RPE table, next-set calculator** - `270ba23` (feat)

TDD RED commits:
- `85f4d4a` - test: failing tests for RPE table and next-set calculator

## Files Created/Modified
- `src/features/calculator/types.ts` - PlateBreakdown, BarPreset, NextSetInput, NextSetResult interfaces
- `src/features/calculator/constants/plates.ts` - LB_PLATES, KG_PLATES, BAR_PRESETS, PLATE_COLORS, PLATE_HEIGHTS
- `src/features/calculator/utils/plateCalculator.ts` - Greedy plate breakdown algorithm
- `src/features/calculator/utils/rpeTable.ts` - RPE_TABLE and getWeightForRpeAndReps lookup
- `src/features/calculator/utils/nextSetCalc.ts` - calculateNextSet and roundToLoadable
- `tests/calculator/rpeTable.test.ts` - 11 tests for RPE table lookup and validation
- `tests/calculator/nextSetCalc.test.ts` - 9 tests for next-set calculator and rounding

## Decisions Made
- Used epsilon tolerance (0.001) in plate greedy algorithm to handle floating point near-misses
- RPE table uses standard Tuchscherer values as documented in RESEARCH.md
- Exported roundToLoadable as separate function for reuse in UI components

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All pure calculation logic ready for UI consumption in Plan 15-02
- Types and constants exported for component import
- No blockers for next plan

---
*Phase: 15-add-barbell-calculator-tab-with-plate-loading-weight-calculations-rpe-1rm-calculators-and-next-set-rpe-recommendations*
*Completed: 2026-03-13*
