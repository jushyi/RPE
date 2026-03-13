---
status: diagnosed
trigger: "Progress Summary Card sparkline looks weird, user can't tell if there's not enough data"
created: 2026-03-12T00:00:00Z
updated: 2026-03-12T00:00:00Z
---

## Current Focus

hypothesis: Multiple edge cases in Sparkline component cause confusing visual output
test: Code review of rendering logic, data pipeline, and edge case handling
expecting: Identify specific conditions that produce misleading sparklines
next_action: Return diagnosis

## Symptoms

expected: Progress Summary sparklines display clear, readable trend lines for key lifts
actual: Sparkline looks weird, user can't tell if there's not enough data
errors: none (visual issue)
reproduction: Have few data points for a key lift exercise
started: Likely from initial implementation

## Eliminated

(none - code review based investigation)

## Evidence

- timestamp: 2026-03-12T00:00:00Z
  checked: Sparkline.tsx minimum data threshold
  found: Component returns null for data.length < 2, but shows sparkline for exactly 2 points. No "not enough data" indicator is ever shown -- the sparkline section just silently disappears.
  implication: With 1 data point the sparkline vanishes with no explanation. With 2 points a line renders but provides no meaningful trend.

- timestamp: 2026-03-12T00:00:00Z
  checked: ProgressSummaryCard sparkline section visibility
  found: hasSparklines checks Object.keys(sparklines).length > 0, but sparklines map includes entries even with very few data points. If Sparkline returns null for <2 points, the sparkItem container (label + empty space) still renders because the map entry exists.
  implication: User sees exercise label with blank space where sparkline should be -- confusing "weird" appearance.

- timestamp: 2026-03-12T00:00:00Z
  checked: useProgressSummary data pipeline for sparklines
  found: chartData is included in sparklineMap if chartData.length > 0 (line 194). A single session produces 1 data point, which gets added to the map. Sparkline then returns null for that entry, but the label still renders.
  implication: Exercises with exactly 1 session create a visible label with no chart.

- timestamp: 2026-03-12T00:00:00Z
  checked: CartesianChart scaling behavior with edge cases
  found: No explicit yDomain or domain padding is configured. Victory Native auto-scales. With 2 points of similar value (e.g., 225 and 227), the y-axis range is only 2 units, making a tiny difference look like a huge swing. With all identical values, the line may render as a flat line compressed to top/bottom edge.
  implication: Auto-scaling without domain padding creates misleading visual representation of small variations.

- timestamp: 2026-03-12T00:00:00Z
  checked: curveType "natural" behavior with few points
  found: curveType="natural" uses cubic spline interpolation. With only 2-3 points, natural curves can overshoot, creating peaks/valleys that don't exist in the data -- visually misleading for a sparkline.
  implication: Curve interpolation on sparse data creates artificial visual noise.

## Resolution

root_cause: |
  Three compounding issues cause the "weird" sparkline appearance:

  1. GHOST LABELS: useProgressSummary adds exercises to sparklineMap with 1+ data points (line 194),
     but Sparkline returns null for <2 points (line 17). ProgressSummaryCard renders the sparkItem
     container (label text) regardless, so the user sees an exercise name with empty space beside it.

  2. NO USER FEEDBACK: There is no "not enough data" indicator anywhere. The sparkline either renders
     or silently returns null. The user has no way to understand WHY a sparkline is missing or looks off.

  3. AUTO-SCALING WITHOUT BOUNDS: CartesianChart has no yDomain or domain padding configured. With few
     data points of similar value, tiny differences get visually exaggerated to fill the entire height.
     Combined with curveType="natural" (cubic spline), 2-3 points can produce curves with overshooting
     artifacts that misrepresent the actual trend.

fix: (diagnosis only - not applied)
verification: (diagnosis only)
files_changed: []
