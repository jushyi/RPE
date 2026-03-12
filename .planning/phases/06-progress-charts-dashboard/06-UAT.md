---
status: diagnosed
phase: 06-progress-charts-dashboard
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md]
started: 2026-03-12T00:00:00Z
updated: 2026-03-12T00:02:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Dashboard Card Layout
expected: Open the app to the Dashboard tab. You should see 4 cards stacked vertically in this order: (1) Today's Workout, (2) Progress Summary, (3) Bodyweight, (4) PR Baselines. No Sign Out button on dashboard.
result: pass

### 2. Today's Workout Card States
expected: The Today's Workout card shows one of three states depending on your active plan: (a) If today is a planned workout day — shows the workout name with a "Start Workout" button, (b) If today is a rest day — shows rest day message with a "Quick Workout" option, (c) If no plan exists — shows "Create Plan" and "Quick Workout" options.
result: pass

### 3. Progress Summary Card
expected: The Progress Summary card displays your weekly streak count, recent PRs (if any), workout count and volume stats for the week, and small sparkline trend lines for key lifts.
result: issue
reported: "sparkline looks weird cant tell if theres not enough data"
severity: minor

### 4. Bodyweight Card Display and Logging
expected: The Bodyweight card shows your latest logged weight and a sparkline trend. Tapping it expands an inline input area where you can enter a new weight, toggle between kg/lbs, and submit. After submitting, the card updates immediately with the new value (no page refresh needed).
result: pass

### 5. Exercise Chart Access from Exercises Tab
expected: Navigate to the Exercises tab. Each exercise in the list should show a small chart/trend icon. Tapping that icon navigates to the exercise's progress chart screen.
result: issue
reported: "the lines on the graphs go off the screen. also the est.1rm doesn't have the right weight values?"
severity: major

### 6. Exercise Progress Chart Screen
expected: On the exercise chart screen, you see an SVG line chart of your progress. Above or below the chart are metric tabs (Est. 1RM, Max Weight, Volume) — tapping each changes the chart data. Time range selector chips (1M, 3M, 6M, 1Y, All) filter the date range. The chart updates when switching metrics or time ranges.
result: pass

### 7. Chart Empty State
expected: Navigate to a chart for an exercise with no logged sets. Instead of a blank chart, you see an empty state message (icon + text) indicating no data is available yet.
result: pass

## Summary

total: 7
passed: 5
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "Progress Summary sparklines display clear, readable trend lines"
  status: failed
  reason: "User reported: sparkline looks weird cant tell if theres not enough data"
  severity: minor
  test: 3
  root_cause: "Three compounding issues: (1) Ghost labels — useProgressSummary adds exercises with 1+ points but Sparkline returns null for <2 points, leaving blank gaps with labels. (2) No insufficient-data feedback — silent null render. (3) Auto-scaling exaggeration — no yDomain padding + curveType natural causes cubic overshoot with few points."
  artifacts:
    - path: "src/features/progress/components/Sparkline.tsx"
      issue: "No minimum-data UX, no domain bounds, misleading curve type for sparse data"
    - path: "src/features/dashboard/hooks/useProgressSummary.ts"
      issue: "Data threshold too low (1 instead of 2+)"
    - path: "src/features/dashboard/components/ProgressSummaryCard.tsx"
      issue: "Renders sparkItem container unconditionally even when Sparkline returns null"
  missing:
    - "Raise threshold in useProgressSummary to 3+ data points"
    - "Add not-enough-data placeholder in Sparkline"
    - "Add yDomain padding to prevent visual exaggeration"
    - "Switch curveType from natural to linear for sparklines"
  debug_session: ".planning/debug/sparkline-rendering-edge-cases.md"

- truth: "Exercise chart lines render within chart bounds and Est. 1RM shows correct weight values"
  status: failed
  reason: "User reported: the lines on the graphs go off the screen. also the est.1rm doesn't have the right weight values? Additional: all charts affected, lines look random."
  severity: major
  test: 5
  root_cause: "Two bugs: (1) Chart overflow — CartesianChart padding {left:10,right:10,bottom:5,top:10} is too small for axis labels, causing polyline to render outside visible bounds. (2) Est. 1RM never populated on new inserts — useSyncQueue.ts does not include estimated_1rm in insert payload and no DB trigger exists, so all new set_logs have estimated_1rm=NULL, displayed as 0."
  artifacts:
    - path: "src/features/progress/components/ExerciseChart.tsx"
      issue: "Padding values too small (line 54)"
    - path: "src/features/workout/hooks/useSyncQueue.ts"
      issue: "Missing estimated_1rm in insert payload (lines 120-129)"
    - path: "supabase/migrations/20260313000000_add_estimated_1rm_to_set_logs.sql"
      issue: "Only backfills existing data, no trigger for ongoing inserts"
  missing:
    - "Increase chart padding to ~{left:50,right:16,bottom:25,top:16}"
    - "Compute estimated_1rm client-side in useSyncQueue before insert using Epley formula"
  debug_session: ".planning/debug/exercise-chart-overflow-1rm.md"
