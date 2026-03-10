---
status: resolved
trigger: "Freestyle exercise picker FAB doesn't work and no workout title"
created: 2026-03-10T00:00:00Z
updated: 2026-03-10T14:00:00Z
---

## Current Focus

hypothesis: Two separate bugs - FAB positioning issue and missing title field
test: Code review of component tree and data model
expecting: Identify root causes for both issues
next_action: Report diagnosis

## Symptoms

expected: (1) Tapping FAB opens exercise picker bottom sheet. (2) Workout screen shows auto-generated title.
actual: (1) FAB tap does nothing visible. (2) No workout title displayed anywhere.
errors: None reported
reproduction: Start freestyle workout, tap plus button, observe no picker and no title
started: Likely since implementation

## Eliminated

- hypothesis: FAB not rendered for freestyle sessions
  evidence: isFreestyle check at index.tsx:103 correctly checks plan_id === null; FAB renders at line 137-144
  timestamp: 2026-03-10

- hypothesis: pickerRef not connected to bottom sheet
  evidence: pickerRef created at line 42, passed to FreestyleExercisePicker at line 148; component uses forwardRef correctly
  timestamp: 2026-03-10

- hypothesis: openPicker not wired to FAB
  evidence: openPicker calls pickerRef.current?.present() at line 86; FAB onPress={openPicker} at line 139
  timestamp: 2026-03-10

## Evidence

- timestamp: 2026-03-10
  checked: Component tree layout in workout/index.tsx
  found: FreestyleExercisePicker (line 147-150) is rendered OUTSIDE KeyboardAvoidingView but INSIDE SafeAreaView and BottomSheetModalProvider. The FAB (line 137-144) is INSIDE KeyboardAvoidingView. This is correct structurally.
  implication: The BottomSheetModal should be able to present.

- timestamp: 2026-03-10
  checked: Freestyle session initial state
  found: startFreestyleSession (workoutStore.ts:76-87) creates session with exercises=[] (empty array). In workout/index.tsx:89-91, when session exists but exercises is empty, the early return does NOT trigger (session is not null). However at line 112, WorkoutHeader is guarded by currentExercise which is null when exercises=[]. So NO header renders.
  implication: For a fresh freestyle session with 0 exercises, currentExercise is null, so the header is hidden entirely.

- timestamp: 2026-03-10
  checked: FAB rendering with empty exercises
  found: When exerciseCount=0, the empty container renders (line 130-134) taking flex:1. The FAB at line 137-144 is positioned absolute inside KeyboardAvoidingView (style flex:1). The FAB should still render and be tappable over the empty container.
  implication: FAB should be visible and tappable. The present() call should work.

- timestamp: 2026-03-10
  checked: BottomSheetModal present() behavior
  found: FreestyleExercisePicker uses BottomSheetModal (not BottomSheet). BottomSheetModal requires BottomSheetModalProvider ancestor. Provider is at line 106. However, FreestyleExercisePicker is placed as a sibling AFTER KeyboardAvoidingView inside SafeAreaView (line 147-150), but it is still within BottomSheetModalProvider. This is correct.
  implication: present() should work. But need to check if the exercises list from useExercises() hook returns data.

- timestamp: 2026-03-10
  checked: WorkoutSession type definition
  found: WorkoutSession interface (types.ts:33-41) has NO title field. Fields are: id, user_id, plan_id, plan_day_id, started_at, ended_at, exercises.
  implication: Title was never added to the data model. Cannot display what doesn't exist.

- timestamp: 2026-03-10
  checked: WorkoutHeader component
  found: WorkoutHeader (WorkoutHeader.tsx) accepts exerciseName, currentSetNumber, totalSets, hasExercisesRemaining, onEndWorkout, onFinishWorkout. There is NO session title prop. It displays exerciseName and set progress only.
  implication: WorkoutHeader was designed to show current exercise info, not session-level title.

## Resolution

root_cause: |
  ISSUE 1 (FAB / Exercise Picker): Two compounding problems.

  (A) FreestyleExercisePicker (FreestyleExercisePicker.tsx:19) calls useExercises() and destructures
  only { exercises } -- it never calls fetchExercises(). The only places fetchExercises() is called
  are: exercises.tsx:24 (the exercises tab) and ExercisePicker.tsx:30 (plan builder picker). If the
  user starts a freestyle workout WITHOUT first visiting the exercises tab, the exerciseStore is
  empty, so the picker opens showing "No exercises found". This makes it APPEAR like the FAB does
  nothing -- it actually opens the bottom sheet, but with an empty list that may not be visually
  obvious against the dark background.

  (B) The FAB wiring itself (index.tsx:85-87, 137-144) is correct. pickerRef, present(), and the
  BottomSheetModal are all connected properly. The FAB does work -- the user just sees an empty
  or barely-visible picker.

  ISSUE 2 (Title): The WorkoutSession type (types.ts:33-41) has NO title field at all. The store's
  startFreestyleSession (workoutStore.ts:76-87) creates no title. WorkoutHeader component
  (WorkoutHeader.tsx:6-13) accepts only exerciseName, currentSetNumber, totalSets, etc. -- no
  session-level title prop. The title feature was never implemented in either the data model or UI.

fix: N/A (diagnosis only)
verification: N/A
files_changed: []
