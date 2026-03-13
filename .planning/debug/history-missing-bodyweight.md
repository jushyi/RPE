---
status: diagnosed
trigger: "History list shows bodyweight value alongside measurement data - history doesn't show the weight input"
created: 2026-03-12T00:00:00Z
updated: 2026-03-12T00:00:00Z
---

## Current Focus

hypothesis: Bodyweight is stored in a separate table (bodyweight_logs) and the history list only queries body_measurements - no join or correlation exists
test: Traced full data flow from form save through DB to history rendering
expecting: Confirmed - two separate tables, no cross-reference
next_action: Return diagnosis

## Symptoms

expected: History tab entries should display the bodyweight value logged alongside chest/waist/hips/body_fat
actual: History items only show chest, waist, hips, body_fat_pct - no bodyweight
errors: None (functional gap, not a crash)
reproduction: Log a measurement with bodyweight + any circumference, check History tab
started: Always - bodyweight was never included in history display

## Eliminated

(none needed - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-03-12T00:00:00Z
  checked: MeasurementForm.tsx handleSave -> body-metrics.tsx handleSave
  found: Form collects bodyweight and passes it to onSave. The screen's handleSave splits the data - bodyweight goes to logWeight() (bodyweight_logs table) while measurements go to addMeasurement() (body_measurements table). These are two independent inserts with no shared foreign key.
  implication: Data is split at save time into two unrelated tables

- timestamp: 2026-03-12T00:00:00Z
  checked: BodyMeasurement type (types.ts)
  found: Type has fields: chest, waist, hips, body_fat_pct, measured_at. No bodyweight field exists.
  implication: The data model for body_measurements does not include bodyweight at all

- timestamp: 2026-03-12T00:00:00Z
  checked: useBodyMeasurements.ts fetchMeasurements
  found: Queries only body_measurements table with SELECT *. Maps to BodyMeasurement type. No join to bodyweight_logs.
  implication: History data source has no access to bodyweight values

- timestamp: 2026-03-12T00:00:00Z
  checked: MeasurementHistoryItem.tsx rendering logic (lines 52-64)
  found: Only renders chips for chest, waist, hips, body_fat_pct. No bodyweight chip.
  implication: Even if bodyweight data were available, the component wouldn't render it

- timestamp: 2026-03-12T00:00:00Z
  checked: bodyweight_logs table via useBodyweightData.ts
  found: Separate table with fields: id, weight, unit, logged_at, created_at. Uses logged_at (date only) as the temporal key with upsert on (user_id, logged_at).
  implication: Correlation between tables is only possible by matching dates (measured_at vs logged_at)

- timestamp: 2026-03-12T00:00:00Z
  checked: body-metrics.tsx History tab rendering (line 282-288)
  found: Only passes `measurements` array to MeasurementHistoryList. bodyweightEntries are available in scope but never passed to the history list.
  implication: Even the screen-level wiring doesn't attempt to correlate the two datasets

## Resolution

root_cause: Bodyweight data is stored in a completely separate table (bodyweight_logs) from body measurements (body_measurements). The BodyMeasurement type, the fetch hook, the history list, and the history item component all operate exclusively on body_measurements data which has no bodyweight column. When the form saves, bodyweight is routed to logWeight() independently. There is no mechanism to correlate or display bodyweight alongside measurement history entries.
fix: (diagnosis only)
verification: (diagnosis only)
files_changed: []
