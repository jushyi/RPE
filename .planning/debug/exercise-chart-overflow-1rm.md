---
status: diagnosed
trigger: "Exercise chart lines go off the screen. Also Est. 1RM doesn't have the right weight values."
created: 2026-03-12T00:00:00Z
updated: 2026-03-12T00:00:00Z
---

## Current Focus

hypothesis: Two root causes identified - see Resolution
test: Code review complete
expecting: N/A
next_action: Return diagnosis

## Symptoms

expected: Exercise chart lines render within chart bounds and Est. 1RM shows correct weight values.
actual: Chart lines go off screen; Est. 1RM shows wrong weight values.
errors: None (visual bugs)
reproduction: Open exercise chart, observe line overflow and incorrect 1RM values
started: Phase 06 implementation

## Eliminated

(none - root causes found on first pass)

## Evidence

- timestamp: 2026-03-12T00:00:01Z
  checked: ExerciseChart.tsx padding config
  found: padding is { left: 10, right: 10, bottom: 5, top: 10 } - extremely small values that don't leave room for axis labels
  implication: Y-axis labels (e.g. "225", "1.2k") need ~40-50px, X-axis labels need ~20-25px. With only 10px left padding, axis labels overlap chart area, and the chart's drawable area is miscalculated causing lines to extend beyond visible bounds.

- timestamp: 2026-03-12T00:00:02Z
  checked: victory-native CartesianChart behavior with padding
  found: In victory-native v41+, the `padding` prop defines the space between the chart container edge and the drawable chart area. Axis labels are rendered WITHIN this padding space. If padding is too small, labels either get clipped or the chart's coordinate system doesn't properly account for label space, causing the line to render outside the intended chart frame.
  implication: The padding values are the direct cause of lines going off-screen.

- timestamp: 2026-03-12T00:00:03Z
  checked: set_logs INSERT path in useSyncQueue.ts (lines 114-132)
  found: The insert data object contains { id, session_exercise_id, set_number, weight, reps, unit, is_pr, logged_at } - NO estimated_1rm field
  implication: New set_logs rows will have estimated_1rm = NULL

- timestamp: 2026-03-12T00:00:04Z
  checked: Database triggers on set_logs table
  found: No trigger exists to auto-compute estimated_1rm on INSERT
  implication: Only the one-time backfill migration (20260313) ever populated estimated_1rm. All new rows inserted after that migration have NULL.

- timestamp: 2026-03-12T00:00:05Z
  checked: RPC function get_exercise_chart_data
  found: Uses MAX(sl.estimated_1rm) which ignores NULLs. If ALL sets in a session have NULL estimated_1rm, the result is NULL.
  implication: The hook maps NULL to 0 via `Number(r.estimated_1rm) || 0`, so new sessions show Est. 1RM = 0, which is wrong.

- timestamp: 2026-03-12T00:00:06Z
  checked: Epley formula in backfill migration
  found: Formula is `weight * (1 + reps / 30)` which is correct Epley. But this only runs once as a migration backfill, not on ongoing inserts.
  implication: The formula itself is correct; the problem is it's never applied to new data.

## Resolution

root_cause: |
  TWO DISTINCT ROOT CAUSES:

  1. CHART LINES OVERFLOW: The CartesianChart `padding` prop in ExerciseChart.tsx uses
     extremely small values { left: 10, right: 10, bottom: 5, top: 10 }. These values
     don't provide enough space for the Y-axis labels (which can be "225", "1.2k" etc.)
     or X-axis date labels ("3/12"). Victory-native uses this padding to define the
     drawable area offset from the container edges. With insufficient padding, the
     coordinate mapping places polyline points outside the visible chart frame.

  2. EST. 1RM WRONG VALUES: The `estimated_1rm` column on `set_logs` is never populated
     for new inserts. The column was added in migration 20260313 with a one-time backfill
     UPDATE, but:
     - useSyncQueue.ts line 120-129 does NOT include `estimated_1rm` in the insert payload
     - No database trigger exists to auto-compute it on INSERT
     - Result: all new set_logs have estimated_1rm = NULL
     - The RPC MAX(sl.estimated_1rm) returns NULL for sessions with only new data
     - The hook converts NULL -> 0 via `Number(r.estimated_1rm) || 0`
     - Chart shows 0 or stale backfilled values instead of correct 1RM estimates

fix: (not applied - diagnosis only)
verification: (not applied - diagnosis only)
files_changed: []
