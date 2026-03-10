---
status: resolved
trigger: "Summary page keyboard scrolling + Dashboard single workout card"
created: 2026-03-10T00:00:00Z
updated: 2026-03-10T14:00:00Z
---

## Current Focus

hypothesis: Two separate UI issues with clear root causes identified
test: Code review complete
expecting: N/A
next_action: Return diagnosis

## Symptoms

expected: (1) Summary page scrolls when keyboard opens so inputs and buttons remain visible. (2) Dashboard auto-expands the workout card when only one workout exists.
actual: (1) Keyboard covers inputs and Done button with no scroll adjustment. (2) Single workout card is collapsed by default and requires tap to expand.
errors: None (UI/UX issues, not crashes)
reproduction: (1) Complete a workout with manual progression exercises, tap a text input on summary. (2) Complete one workout, return to dashboard.
started: Since implementation

## Eliminated

(none)

## Evidence

- timestamp: 2026-03-10
  checked: app/(app)/workout/summary.tsx lines 82-115
  found: Uses plain ScrollView from react-native with no keyboard handling. No KeyboardAvoidingView, no KeyboardAwareScrollView, no keyboardShouldPersistTaps prop.
  implication: When keyboard opens, ScrollView does not auto-scroll to keep focused input visible. The Done button at the bottom is buried under the keyboard.

- timestamp: 2026-03-10
  checked: src/features/workout/components/WeightTargetPrompt.tsx lines 108-149
  found: TextInput components have no scrollResponderHandleKeyboardWillShow or similar. No keyboard dismiss on scroll.
  implication: The component itself does nothing about keyboard visibility -- relies entirely on parent container.

- timestamp: 2026-03-10
  checked: app/(app)/(tabs)/dashboard.tsx lines 144-206 (CompletedWorkoutCard)
  found: Line 145 hardcodes `useState(false)` for expanded state. No props for initial state or count awareness. Line 153 always renders a Pressable toggle. No conditional logic for single vs multiple workouts.
  implication: Card is always collapsed by default and always collapsible, regardless of how many workouts exist.

- timestamp: 2026-03-10
  checked: app/(app)/(tabs)/dashboard.tsx lines 316-321 (render site)
  found: completedToday.map passes index but not total count. CompletedWorkoutCard receives {session, index} only.
  implication: The component has no way to know if it is the only workout -- it cannot conditionally auto-expand.

## Resolution

root_cause: |
  Issue 1: summary.tsx uses a plain ScrollView (line 84) with zero keyboard accommodation.
  No KeyboardAvoidingView wrapper, no KeyboardAwareScrollView, no keyboardShouldPersistTaps.
  When the soft keyboard opens for WeightTargetPrompt inputs, the ScrollView does not
  adjust its content inset or scroll position, so lower inputs and the Done button are hidden.

  Issue 2: CompletedWorkoutCard (line 145) hardcodes expanded state to false.
  It accepts no prop for total workout count or initial expanded state.
  The render site (line 318) passes no count information. There is no conditional
  logic anywhere to treat single-workout differently from multiple-workout scenarios.

fix: (not yet applied)
verification: (not yet applied)
files_changed: []
