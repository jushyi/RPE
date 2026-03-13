---
status: diagnosed
phase: 07-body-metrics
source: [07-01-SUMMARY.md, 07-02-SUMMARY.md]
started: 2026-03-12T12:00:00Z
updated: 2026-03-12T12:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Dashboard Body Card
expected: The dashboard shows a unified "Body" card (replacing the old standalone BodyweightCard). Tapping the card navigates to the body-metrics detail screen.
result: pass

### 2. Log a New Measurement
expected: On the body-metrics screen Charts tab, fill in fields (bodyweight, chest, waist, hips, body fat). Submit the form. Data saves successfully and appears in the history.
result: issue
reported: "we don't need hips just waist, replace with biceps. add quad as well"
severity: major

### 3. Unit Toggles on Form
expected: Each circumference field (chest, waist, hips) has a unit toggle (in/cm). Tapping the toggle switches the unit. Bodyweight has its own unit toggle (lb/kg).
result: pass

### 4. Date Picker
expected: The measurement form includes a date picker. Selecting a past date associates the measurement with that date instead of today.
result: issue
reported: "doesnt work for bodyweight, always logs as current date. everything else works with the date picker"
severity: major

### 5. Charts Display
expected: Charts tab shows trend charts for each metric. With 2+ data points: a line chart. With 1 data point: a single value display. With 0 data points: an empty state message.
result: pass

### 6. Shared Circumference Unit Toggle on Charts
expected: Toggling the unit on one circumference chart (e.g., chest) also switches the unit for all other circumference charts (waist, hips) for consistent comparison.
result: skipped
reason: Blocked by date picker issue - couldn't generate multi-point chart data

### 7. History Tab with Pull-to-Refresh
expected: Swiping to the History tab shows a list of past measurement entries. Pulling down triggers a refresh of the list.
result: issue
reported: "history doesn't show the weight input"
severity: major

### 8. Tap-to-Expand History Item
expected: Tapping a history item expands it to reveal Edit and Delete action buttons.
result: pass

### 9. Edit a Measurement
expected: Tapping Edit on an expanded history item navigates to the Charts tab with the form pre-filled with that entry's values. Submitting updates the record.
result: pass

### 10. Delete a Measurement
expected: Tapping Delete on an expanded history item shows a confirmation dialog. Confirming removes the entry from the list.
result: pass

## Summary

total: 10
passed: 6
issues: 3
pending: 0
skipped: 1

## Gaps

- truth: "Form should have bodyweight, chest, waist, biceps, quad, body fat fields (not hips)"
  status: failed
  reason: "User reported: we don't need hips just waist, replace with biceps. add quad as well"
  severity: major
  test: 2
  root_cause: "Field set wrong across entire vertical slice: DB schema, types, form, charts, history, dashboard card, validation, CSV export. hips exists everywhere, biceps/quad exist nowhere. CircumferenceMetric union is 'chest'|'waist'|'hips' but should be 'chest'|'waist'|'biceps'|'quad'."
  artifacts:
    - path: "supabase/migrations/20260315000000_create_body_measurements.sql"
      issue: "Has hips/hips_unit columns, missing biceps/quad columns"
    - path: "src/features/body-metrics/types.ts"
      issue: "BodyMeasurement has hips/hips_unit, CircumferenceMetric includes hips"
    - path: "src/features/body-metrics/components/MeasurementForm.tsx"
      issue: "Has hips field row, missing biceps/quad"
    - path: "src/features/body-metrics/components/MeasurementHistoryItem.tsx"
      issue: "Displays hips chip, missing biceps/quad"
    - path: "src/features/body-metrics/components/BodyCard.tsx"
      issue: "Shows hips row, missing biceps/quad"
    - path: "src/features/body-metrics/hooks/useBodyMetricsChartData.ts"
      issue: "CIRCUMFERENCE_METRICS includes hips, missing biceps/quad"
    - path: "src/features/body-metrics/hooks/useBodyMeasurements.ts"
      issue: "Maps hips/hips_unit fields, missing biceps/quad"
    - path: "src/features/body-metrics/utils/validation.ts"
      issue: "Validates hips/hips_unit, missing biceps/quad"
    - path: "src/features/settings/utils/csvExport.ts"
      issue: "Exports Hips headers, missing Biceps/Quad"
    - path: "app/(app)/body-metrics.tsx"
      issue: "Has hipsData chart, missing biceps/quad charts"
  missing:
    - "New migration: drop hips/hips_unit, add biceps/biceps_unit/quad/quad_unit columns + constraints"
    - "Update CircumferenceMetric to 'chest'|'waist'|'biceps'|'quad'"
    - "Add biceps + quad field rows to form, remove hips"
    - "Propagate field changes through all 10 files"
  debug_session: ""

- truth: "Date picker sets the date for bodyweight entries"
  status: failed
  reason: "User reported: doesnt work for bodyweight, always logs as current date. everything else works with the date picker"
  severity: major
  test: 4
  root_cause: "Two-layer bug: (1) body-metrics.tsx line 116 calls logWeight(data.bodyweight, data.bodyweight_unit) without passing data.measured_at. (2) useBodyweightData.ts addEntry signature is (weight, unit) with no date param — hardcodes new Date() on line 46."
  artifacts:
    - path: "app/(app)/body-metrics.tsx"
      issue: "Line 116 does not forward data.measured_at to logWeight"
    - path: "src/features/progress/hooks/useBodyweightData.ts"
      issue: "addEntry lacks date parameter, hardcodes today's date on line 46"
  missing:
    - "Add optional loggedAt?: string param to addEntry (default to today)"
    - "Pass data.measured_at as third arg in body-metrics.tsx line 116"
  debug_session: ".planning/debug/bodyweight-date-picker-ignored.md"

- truth: "History list shows bodyweight value alongside measurement data"
  status: failed
  reason: "User reported: history doesn't show the weight input"
  severity: major
  test: 7
  root_cause: "Bodyweight is in separate bodyweight_logs table, not in body_measurements. Form saves them independently with no shared key. History list only queries body_measurements — never fetches or correlates bodyweight data. MeasurementHistoryItem only renders chest/waist/hips/body_fat chips."
  artifacts:
    - path: "src/features/body-metrics/types.ts"
      issue: "BodyMeasurement type has no bodyweight field"
    - path: "src/features/body-metrics/hooks/useBodyMeasurements.ts"
      issue: "Fetches only body_measurements, no join to bodyweight_logs"
    - path: "src/features/body-metrics/components/MeasurementHistoryItem.tsx"
      issue: "No bodyweight chip in render"
    - path: "src/features/body-metrics/components/MeasurementHistoryList.tsx"
      issue: "Props only accept BodyMeasurement[], no bodyweight data"
    - path: "app/(app)/body-metrics.tsx"
      issue: "bodyweightEntries available in scope but not passed to History"
  missing:
    - "Client-side date correlation: pass bodyweightEntries to MeasurementHistoryList"
    - "Match bodyweight entry to measurement by date (measured_at vs logged_at)"
    - "Add bodyweight chip to MeasurementHistoryItem"
  debug_session: ".planning/debug/history-missing-bodyweight.md"
