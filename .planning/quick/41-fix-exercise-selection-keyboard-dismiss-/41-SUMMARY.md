---
phase: quick-41
plan: 01
subsystem: plans/exercise-picker
tags: [bug-fix, ux, keyboard, bottom-sheet]
dependency_graph:
  requires: []
  provides: [reliable-exercise-selection]
  affects: [plan-creation-flow]
tech_stack:
  added: []
  patterns: [keyboard-dismiss-deferral]
key_files:
  modified:
    - src/features/plans/components/ExercisePicker.tsx
decisions:
  - Removed Keyboard.dismiss() from handleSelect; modal dismiss handles keyboard cleanup
  - Changed keyboardBlurBehavior to "none" to prevent sheet resize on keyboard dismiss
metrics:
  duration: 1min
  completed: "2026-03-16T13:05:00Z"
  tasks_completed: 1
  tasks_total: 1
---

# Quick Task 41: Fix Exercise Selection Keyboard Dismiss Summary

Fixed exercise picker tap-through failure when keyboard is open by removing premature Keyboard.dismiss() and disabling sheet resize on keyboard blur.

## What Changed

The ExercisePicker bottom sheet had a race condition: tapping an exercise while the search keyboard was open would trigger `Keyboard.dismiss()` before `onSelect()`, causing the bottom sheet's `keyboardBlurBehavior="restore"` to resize/collapse the sheet. This resize could hide the tapped exercise item or swallow the touch event entirely.

**Fix applied (two changes):**

1. **Removed `Keyboard.dismiss()` from `handleSelect`** -- The modal's own `dismiss()` call already dismisses the keyboard as a side effect when the modal closes. Calling it explicitly before `onSelect` was causing the premature sheet resize.

2. **Changed `keyboardBlurBehavior` from `"restore"` to `"none"`** -- This prevents the bottom sheet from snapping back to its pre-keyboard snap point when the keyboard is dismissed. Since the sheet closes immediately after selection, the intermediate resize was unnecessary and caused the visual glitch.

`handleDismiss` (called when the sheet is closed without selection) still calls `Keyboard.dismiss()` for proper cleanup.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix exercise selection to prioritize tap over keyboard dismiss | 179cea5 | src/features/plans/components/ExercisePicker.tsx |

## Deviations from Plan

None -- plan executed exactly as written.
