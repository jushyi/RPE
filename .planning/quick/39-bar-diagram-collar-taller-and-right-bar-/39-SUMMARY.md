---
phase: quick-39
plan: 39
subsystem: calculator
tags: [barbell-diagram, svg, visual, calculator]
dependency_graph:
  requires: []
  provides: [differentiated-bar-sections]
  affects: [BarbellDiagram]
tech_stack:
  added: []
  patterns: [svg-rect-layering]
key_files:
  modified:
    - src/features/calculator/components/BarbellDiagram.tsx
decisions:
  - "Split single bar Rect into two: left stub (height 36) and right sleeve (height 42) for realistic barbell appearance"
  - "Collar height increased from 57 to 70 to be visibly taller than both bar sections"
  - "Collar rendered last in SVG so it draws on top and covers the join between left and right bar segments"
metrics:
  duration: 2min
  completed_date: "2026-03-13"
  tasks_completed: 1
  files_modified: 1
---

# Quick Task 39: Bar Diagram Collar Taller and Right Bar Summary

**One-liner:** Three distinct SVG Rect elements replace single bar — left stub (36px), right sleeve (42px), collar (70px) — all vertically centered for realistic barbell proportions.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Split bar into left stub + right sleeve with differentiated heights | 4fe830e | src/features/calculator/components/BarbellDiagram.tsx |

## What Was Built

Replaced the single unified bar `Rect` in `BarbellDiagram.tsx` with three layered SVG elements:

1. **Left bar stub** — `BAR_HEIGHT = 36`, x=0 to `COLLAR_X`, centered at `LEFT_BAR_Y`
2. **Right sleeve** — `SLEEVE_HEIGHT = 42`, x=`COLLAR_X + COLLAR_WIDTH` to `TOTAL_WIDTH`, centered at `SLEEVE_Y`
3. **Collar** — `COLLAR_HEIGHT = 70` (up from 57), rendered last so it overlaps and covers the gap between left and right bar segments

All three elements use `(DIAGRAM_HEIGHT - height) / 2` for their Y position to stay vertically centered.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- File exists: `src/features/calculator/components/BarbellDiagram.tsx` - FOUND
- Commit 4fe830e - FOUND
- TypeScript check: No BarbellDiagram errors
