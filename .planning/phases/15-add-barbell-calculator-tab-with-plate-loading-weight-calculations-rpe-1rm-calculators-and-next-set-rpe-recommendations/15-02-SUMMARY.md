---
plan: "15-02"
title: "Calculator Tab UI"
status: complete
started: 2026-03-13
completed: 2026-03-13
---

## What Was Built

Complete Calculator tab UI with three sub-tools accessible via PagerView with segmented control.

### Plates Sub-Tool
- lb/kg toggle at top (independent of user preferred unit)
- Target weight input with bar weight picker (Olympic/Women's/EZ Curl/Training)
- Half-bar SVG diagram showing one side with IPF color-coded plates
- Per-side plate summary and remainder warning
- Plate colors mapped between lb and kg (55lb/25kg=red, 45lb/20kg=blue, etc.)

### RPE/1RM Sub-Tool
- Weight, Reps, and RPE inputs
- RPE-aware 1RM estimation (uses RPE percentage table, not just Epley)
- RPE percentage grid (RPE 6-10 x Reps 1-10) populated from estimated 1RM

### Next Set Sub-Tool
- Last Set inputs (weight/reps/RPE) and Target inputs (RPE/reps)
- RPE values snapped to nearest valid half-step (6-10) for reliable table lookup
- NextSetCard showing recommended weight, percentage change badge, and explanation
- No auto-fill of target fields

## Key Files

### key-files.created
- `app/(app)/(tabs)/calculator.tsx` — Tab route with PagerView
- `src/features/calculator/components/PlateCalculator.tsx` — Plates sub-tool with lb/kg toggle
- `src/features/calculator/components/BarbellDiagram.tsx` — Half-bar SVG diagram
- `src/features/calculator/components/BarWeightPicker.tsx` — Bar weight dropdown
- `src/features/calculator/components/RpeCalculator.tsx` — RPE/1RM sub-tool with RPE input
- `src/features/calculator/components/RpeTable.tsx` — RPE percentage grid
- `src/features/calculator/components/NextSetCalculator.tsx` — Next set recommendation
- `src/features/calculator/components/NextSetCard.tsx` — Result display card

### key-files.modified
- `app/(app)/(tabs)/_layout.tsx` — Added Calculator tab to bottom navigation

## Deviations

- Showed only one half of bar instead of full bar for better visibility on mobile
- Added lb/kg toggle on Plates tab per user feedback (not in original plan)
- Used RPE table for 1RM estimation instead of Epley formula per user feedback
- Added RPE snapping to nearest valid half-step to prevent invalid lookups
- Removed auto-fill of target fields per user feedback

## Self-Check: PASSED
