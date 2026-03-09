---
phase: quick
plan: 3
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/(tabs)/exercises.tsx
  - src/features/exercises/components/ExerciseListItem.tsx
  - src/features/exercises/components/ExerciseBottomSheet.tsx
autonomous: true
requirements: ["single-tap-edit-delete"]
must_haves:
  truths:
    - "Single tap on a custom exercise opens the edit bottom sheet with form pre-filled"
    - "Single tap on a built-in exercise opens a read-only detail view in the bottom sheet"
    - "Delete button is visible inside the edit bottom sheet for custom exercises"
    - "Delete button triggers confirmation alert then deletes the exercise"
    - "Long-press alert behavior is removed"
  artifacts:
    - path: "app/(app)/(tabs)/exercises.tsx"
      provides: "Single-tap onPress handler replacing long-press Alert flow"
    - path: "src/features/exercises/components/ExerciseBottomSheet.tsx"
      provides: "Read-only mode for built-in exercises, delete button for custom exercises"
    - path: "src/features/exercises/components/ExerciseListItem.tsx"
      provides: "onPress prop replacing onLongPress"
  key_links:
    - from: "ExerciseListItem"
      to: "exercises.tsx handlePress"
      via: "onPress callback"
    - from: "exercises.tsx"
      to: "ExerciseBottomSheet"
      via: "exerciseToEdit + readOnly prop"
---

<objective>
Replace the long-press Alert menu on exercises with single-tap behavior: tapping a custom exercise opens the edit bottom sheet (with a delete button inside); tapping a built-in exercise opens a read-only detail view in the same bottom sheet.

Purpose: More intuitive UX -- users expect single-tap interaction, not hidden long-press menus.
Output: Updated ExerciseListItem, ExerciseBottomSheet, and exercises.tsx screen.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(app)/(tabs)/exercises.tsx
@src/features/exercises/components/ExerciseListItem.tsx
@src/features/exercises/components/ExerciseBottomSheet.tsx
@src/features/exercises/types.ts

<interfaces>
From src/features/exercises/types.ts:
```typescript
export interface Exercise {
  id: string;
  user_id: string | null; // null = global seed exercise
  name: string;
  muscle_groups: MuscleGroup[];
  equipment: Equipment;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const isCustomExercise = (exercise: Exercise): boolean =>
  exercise.user_id !== null;
```

From src/features/exercises/components/ExerciseBottomSheet.tsx:
```typescript
interface ExerciseBottomSheetProps {
  exerciseToEdit: Exercise | null;
  onSave: () => void;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Wire single-tap and add read-only mode to bottom sheet</name>
  <files>
    app/(app)/(tabs)/exercises.tsx
    src/features/exercises/components/ExerciseListItem.tsx
    src/features/exercises/components/ExerciseBottomSheet.tsx
  </files>
  <action>
**ExerciseListItem.tsx:**
- Change `onLongPress` prop to `onPress` prop in interface and Pressable usage
- Keep the pressed opacity style for feedback

**exercises.tsx:**
- Remove the `handleLongPress` callback entirely (delete the Alert.alert flow)
- Create a new `handlePress` callback that:
  - Sets `exerciseToEdit` to the tapped exercise
  - Presents the bottom sheet via `bottomSheetRef.current?.present()`
- Add a `readOnly` state: `const [readOnly, setReadOnly] = useState(false)`
- In `handlePress`: set `setReadOnly(!isCustomExercise(exercise))` before presenting
- In `handleAddExercise`: set `setReadOnly(false)` (new exercises are always editable)
- Pass `readOnly` prop to ExerciseBottomSheet
- Update renderItem to pass `onPress={() => handlePress(item)}` instead of `onLongPress`

**ExerciseBottomSheet.tsx:**
- Add `readOnly?: boolean` to `ExerciseBottomSheetProps`
- Add `onDelete?: (id: string) => void` to props
- When `readOnly` is true:
  - Change title to the exercise name (not "Edit Exercise")
  - Show all fields (muscle groups, equipment, notes) as plain Text, not form inputs
  - Hide the submit button entirely
  - Show a subtle "Built-in exercise" label at top (plain text, no emoji, use colors.textMuted)
- When `readOnly` is false AND `isEditMode` is true (editing custom exercise):
  - Show the form as currently implemented
  - Add a Delete button BELOW the "Save Changes" button
  - Style the Delete button: transparent background, red text (colors.error), borderWidth 1, borderColor colors.error, borderRadius 12, paddingVertical 14, marginTop 12
  - Delete button text: "Delete Exercise"
  - On press: show Alert.alert confirmation ("Delete Exercise", "Are you sure you want to delete {name}?", Cancel + destructive Delete)
  - On confirm: call `onDelete(exerciseToEdit.id)`, then dismiss the bottom sheet

**Back in exercises.tsx:**
- Pass `onDelete={deleteExercise}` to ExerciseBottomSheet
  </action>
  <verify>
    <automated>cd C:/Users/maser/Desktop/Gym-App && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
    - Tapping any exercise opens the bottom sheet (no more long-press Alert)
    - Custom exercises open in edit mode with a delete button below save
    - Built-in exercises open in read-only detail view showing name, muscle groups, equipment, notes
    - Delete button shows confirmation then removes the exercise
    - FAB still opens the sheet in create mode
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- TypeScript compiles: `npx tsc --noEmit`
- App loads without crash: start Expo, navigate to Exercises tab
- Tap a built-in exercise: read-only detail view appears in bottom sheet
- Tap a custom exercise: edit form appears with delete button
- Tap delete: confirmation alert, then exercise removed from list
- Tap FAB: empty create form appears (no delete button)
</verification>

<success_criteria>
- Single tap opens bottom sheet for all exercises
- Custom exercises: editable form + delete button
- Built-in exercises: read-only detail view
- No long-press behavior remains
- No emojis in any UI text
</success_criteria>

<output>
After completion, create `.planning/quick/3-single-tap-to-edit-delete-exercises-buil/3-SUMMARY.md`
</output>
