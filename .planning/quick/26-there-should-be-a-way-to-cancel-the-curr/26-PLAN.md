---
phase: quick-26
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/workout/hooks/useWorkoutSession.ts
  - src/features/workout/components/WorkoutHeader.tsx
  - app/(app)/workout/index.tsx
autonomous: true
requirements: [QUICK-26]
must_haves:
  truths:
    - "User can cancel an in-progress workout without saving it"
    - "User sees a confirmation dialog before the workout is discarded"
    - "After cancelling, user is navigated back to the previous screen"
  artifacts:
    - path: "src/features/workout/hooks/useWorkoutSession.ts"
      provides: "cancelWorkout function with confirmation alert"
      contains: "cancelWorkout"
    - path: "src/features/workout/components/WorkoutHeader.tsx"
      provides: "Cancel button in workout header"
      contains: "onCancelWorkout"
  key_links:
    - from: "src/features/workout/components/WorkoutHeader.tsx"
      to: "src/features/workout/hooks/useWorkoutSession.ts"
      via: "onCancelWorkout prop calling cancelWorkout"
      pattern: "onCancelWorkout"
---

<objective>
Add a "Cancel Workout" option to the active workout screen that discards the current session without saving.

Purpose: Users need a way to abandon a workout they started by mistake or don't want to complete, without it being saved to history.
Output: Cancel button in workout header with confirmation dialog, discards session and navigates back.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/workout/hooks/useWorkoutSession.ts
@src/features/workout/components/WorkoutHeader.tsx
@app/(app)/workout/index.tsx
@src/stores/workoutStore.ts

<interfaces>
From src/stores/workoutStore.ts:
```typescript
// Already exists - clears activeSession without saving
discardSession: () => void;
// discardSession: () => set({ activeSession: null, currentExerciseIndex: 0 }),
```

From src/features/workout/hooks/useWorkoutSession.ts:
```typescript
// Hook returns these (cancelWorkout needs to be added):
return {
  session, currentExercise, exerciseCount, currentIndex,
  startFromPlan, startFreestyle, logCurrentSet,
  finishWorkout, endEarly, addFreestyleExercise,
};
```

From src/features/workout/components/WorkoutHeader.tsx:
```typescript
interface WorkoutHeaderProps {
  exerciseName: string;
  currentSetNumber: number;
  totalSets: number;
  hasExercisesRemaining: boolean;
  onEndWorkout: () => void;
  onFinishWorkout: () => void;
  sessionTitle?: string;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add cancelWorkout to useWorkoutSession and wire into workout UI</name>
  <files>src/features/workout/hooks/useWorkoutSession.ts, src/features/workout/components/WorkoutHeader.tsx, app/(app)/workout/index.tsx</files>
  <action>
1. In `useWorkoutSession.ts`:
   - Import `discardSession` from workoutStore: `const discardSessionAction = useWorkoutStore((s) => s.discardSession);`
   - Add a `cancelWorkout` callback that shows `Alert.alert` with title "Cancel Workout?", message "All progress for this workout will be lost.", buttons: "Keep Going" (style: cancel) and "Cancel Workout" (style: destructive, onPress calls `discardSessionAction()` then `router.back()`)
   - Export `cancelWorkout` in the return object

2. In `WorkoutHeader.tsx`:
   - Add `onCancelWorkout: () => void` to `WorkoutHeaderProps`
   - Add a cancel button to the LEFT side of the header (before the title container). Use a Pressable with Ionicons `close-outline` icon, size 24, color `colors.textSecondary`. Style it as a simple icon button (no background pill, just the icon with 8px padding for touch target). This acts as a "back/dismiss" affordance.

3. In `app/(app)/workout/index.tsx`:
   - Destructure `cancelWorkout` from `useWorkoutSession()`
   - Pass `onCancelWorkout={cancelWorkout}` to the `WorkoutHeader` component
   - In the `emptyHeader` section (freestyle with no exercises), add a cancel icon button on the left side matching the same pattern as the WorkoutHeader cancel button (Ionicons close-outline, calls cancelWorkout)
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - Cancel (X) button visible in workout header on the left side
    - Tapping it shows confirmation alert with "Cancel Workout?" title
    - Confirming discards session (no data saved) and navigates back
    - Dismissing alert keeps workout active
    - Works for both plan-based and freestyle workouts
    - Works in empty freestyle state (no exercises added yet)
  </done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors
- Cancel button appears in workout header
- Confirmation dialog prevents accidental cancellation
- Session is fully discarded (not saved to history) on confirm
</verification>

<success_criteria>
User can cancel any in-progress workout via an X button in the workout header, with a confirmation dialog that discards all progress when confirmed.
</success_criteria>

<output>
After completion, create `.planning/quick/26-there-should-be-a-way-to-cancel-the-curr/26-SUMMARY.md`
</output>
