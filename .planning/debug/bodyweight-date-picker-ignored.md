---
status: diagnosed
trigger: "Date picker sets the date for bodyweight entries - doesnt work for bodyweight, always logs as current date"
created: 2026-03-12T00:00:00Z
updated: 2026-03-12T00:00:00Z
---

## Current Focus

hypothesis: logWeight/addEntry ignores the user-selected date and hardcodes today's date
test: trace data flow from MeasurementForm -> handleSave -> logWeight -> addEntry
expecting: date is lost somewhere in the chain
next_action: DIAGNOSED - return root cause

## Symptoms

expected: Selecting a past date in the date picker should log bodyweight for that date
actual: Bodyweight always logs as current date regardless of date picker selection
errors: none (silent bug - wrong date used)
reproduction: Open body-metrics, select a past date, enter bodyweight, save. Check bodyweight_logs - logged_at is today.
started: Since Phase 07 implementation

## Eliminated

(none needed - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-03-12
  checked: MeasurementForm.tsx handleSave (line 118-130)
  found: Form correctly passes `measured_at: toISODate(date)` in the data object to onSave callback
  implication: Form side is correct - date picker value IS included in the save payload

- timestamp: 2026-03-12
  checked: body-metrics.tsx handleSave (lines 100-148)
  found: |
    Line 116: `await logWeight(data.bodyweight, data.bodyweight_unit)` - only passes weight and unit.
    `data.measured_at` is available but NOT passed to logWeight.
    Compare with measurements (line 135): `measured_at: data.measured_at` IS passed to addMeasurement.
  implication: The date is dropped at the call site - body-metrics.tsx handleSave does not forward the date to logWeight

- timestamp: 2026-03-12
  checked: useBodyweightData.ts addEntry function (lines 40-82)
  found: |
    Function signature: `async (weight: number, unit: 'kg' | 'lbs')` - no date parameter at all.
    Line 46: `const today = new Date().toISOString().split('T')[0]` - hardcodes today's date.
    Line 59: upsert uses `logged_at: today` - always inserts with current date.
  implication: Even if a date were passed from the call site, addEntry doesn't accept it. TWO fixes needed.

## Resolution

root_cause: |
  Two-layer bug: the selected date is never passed to the bodyweight logging function.

  1. CALLER BUG (body-metrics.tsx line 116): `logWeight(data.bodyweight, data.bodyweight_unit)` does not pass `data.measured_at` as a third argument.
  2. CALLEE BUG (useBodyweightData.ts line 41): `addEntry(weight, unit)` function signature has no date parameter; it hardcodes `const today = new Date().toISOString().split('T')[0]` on line 46 and uses that for both the optimistic entry and the Supabase upsert.

  Compare with body_measurements which correctly passes `measured_at: data.measured_at` (body-metrics.tsx line 135).

fix: (not applied - diagnosis only)
verification: (not applied - diagnosis only)
files_changed: []
