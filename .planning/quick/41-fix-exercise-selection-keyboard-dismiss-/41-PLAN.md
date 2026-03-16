---
phase: quick-41
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/plans/components/ExercisePicker.tsx
autonomous: true
requirements: [QUICK-41]
must_haves:
  truths:
    - "Tapping an exercise in the picker while keyboard is open immediately selects it"
    - "The bottom sheet does not visually collapse or resize before the selection registers"
    - "Search still works normally and keyboard can still be dismissed by other means"
  artifacts:
    - path: "src/features/plans/components/ExercisePicker.tsx"
      provides: "Fixed exercise selection handler that prioritizes selection over keyboard dismiss"
  key_links:
    - from: "ExercisePicker handleSelect"
      to: "DaySlotEditor handleExerciseSelected"
      via: "onSelect callback"
      pattern: "onSelect\\(exercise\\)"
---

<objective>
Fix the exercise selection keyboard dismiss bug in the plan creation ExercisePicker. When the keyboard is open from searching and the user taps an exercise, the keyboard dismiss causes the bottom sheet to resize/collapse (via `keyboardBlurBehavior="restore"`), which can hide exercise items or swallow the tap. The selection should be processed immediately without the keyboard dismiss interfering.

Purpose: Tapping an exercise after searching should always register the selection without visual glitches.
Output: Updated ExercisePicker.tsx with fixed selection behavior.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/plans/components/ExercisePicker.tsx
@src/features/plans/components/DaySlotEditor.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix exercise selection to prioritize tap over keyboard dismiss</name>
  <files>src/features/plans/components/ExercisePicker.tsx</files>
  <action>
The root cause is two-fold:

1. `handleSelect` (line 51-58) calls `Keyboard.dismiss()` BEFORE `onSelect(exercise)`. When the keyboard is visible, this triggers the bottom sheet's `keyboardBlurBehavior="restore"` which snaps the sheet back to its pre-keyboard size, causing the visual collapse and potentially losing the touch target.

2. The `keyboardBlurBehavior="restore"` on the BottomSheetModal (line 84) causes the sheet to resize when the keyboard dismisses, which happens synchronously with the tap.

Fix:

A) In `handleSelect`, remove the `Keyboard.dismiss()` call entirely. The sheet's `dismiss()` call (line 55) already handles cleanup, and it will dismiss the keyboard as a side effect when the modal closes.

B) Change `keyboardBlurBehavior` from `"restore"` to `"none"` on the BottomSheetModal. This prevents the sheet from collapsing/resizing when the keyboard is dismissed (e.g., by tapping an exercise item). Since the sheet immediately closes after selection anyway, the resize is unnecessary and causes the visual glitch. The `"none"` value keeps the sheet at its current snap point when the keyboard goes away.

C) Keep `Keyboard.dismiss()` in `handleDismiss` (line 60-65) — that is the correct place for it since `handleDismiss` is called when the sheet itself is closed, not when an item is selected.

The result: tapping an exercise will call `onSelect` then `dismiss()` without any intermediate sheet resize. The keyboard will go away naturally when the modal closes.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Projects/Gym-App && npx tsc --noEmit src/features/plans/components/ExercisePicker.tsx 2>&1 | head -20</automated>
  </verify>
  <done>
    - handleSelect no longer calls Keyboard.dismiss()
    - keyboardBlurBehavior is set to "none" instead of "restore"
    - handleDismiss still calls Keyboard.dismiss() for sheet close cleanup
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- Open the app, go to plan creation, add a day, tap "Add Exercise"
- Type a search query in the search field (keyboard is open)
- Tap on an exercise in the filtered list
- The exercise should be selected immediately without the sheet collapsing first
- The sheet should close smoothly after selection
</verification>

<success_criteria>
- Exercise selection works instantly when keyboard is open
- No visual collapse/resize of the bottom sheet before selection registers
- Search functionality still works normally
</success_criteria>

<output>
After completion, create `.planning/quick/41-fix-exercise-selection-keyboard-dismiss-/41-SUMMARY.md`
</output>
