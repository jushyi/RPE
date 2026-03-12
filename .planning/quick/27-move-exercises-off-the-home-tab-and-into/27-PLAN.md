---
phase: quick-27
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/(tabs)/plans.tsx
  - app/(app)/(tabs)/_layout.tsx
  - app/(app)/(tabs)/exercises.tsx
autonomous: true
requirements: [MOVE-EXERCISES-TO-PLANS-TAB]

must_haves:
  truths:
    - "Bottom tab bar shows exactly 3 tabs: Home, Plans, Settings"
    - "Plans screen inner tab bar shows Plans | History | Exercises"
    - "Swiping to the Exercises page shows the full exercise library with search, filters, FAB, and bottom sheet"
    - "Exercise picker modal in plan creation and workouts is unaffected"
  artifacts:
    - path: "app/(app)/(tabs)/plans.tsx"
      provides: "3-page PagerView with Plans, History, Exercises tabs"
      contains: "ExercisesContent"
    - path: "app/(app)/(tabs)/_layout.tsx"
      provides: "3-tab bottom navigation (no Exercises tab)"
  key_links:
    - from: "app/(app)/(tabs)/plans.tsx"
      to: "features/exercises/hooks/useExercises"
      via: "import in ExercisesContent component"
      pattern: "useExercises"
---

<objective>
Move the Exercises bottom tab into the Plans screen as a third inner PagerView page.

Purpose: Simplify the bottom tab bar to 3 tabs (Home, Plans, Settings) while keeping exercises accessible inside the Plans screen alongside Plans and History.
Output: Updated tab layout and Plans screen with 3-page PagerView.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(app)/(tabs)/_layout.tsx
@app/(app)/(tabs)/plans.tsx
@app/(app)/(tabs)/exercises.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move exercise library into Plans PagerView and remove Exercises bottom tab</name>
  <files>app/(app)/(tabs)/plans.tsx, app/(app)/(tabs)/_layout.tsx, app/(app)/(tabs)/exercises.tsx</files>
  <action>
In `app/(app)/(tabs)/plans.tsx`:
1. Add all imports currently used by exercises.tsx: `useExercises`, `ExerciseFilterBar`, `ExerciseListItem`, `EmptyState`, `ExerciseBottomSheet`, `isCustomExercise`, and the Exercise/MuscleGroup/Equipment types. Also add `BottomSheetModal` from `@gorhom/bottom-sheet`.
2. Change `const TABS = ['Plans', 'History'] as const;` to `const TABS = ['Plans', 'History', 'Exercises'] as const;`.
3. Update `offscreenPageLimit` on PagerView from `1` to `2` so all three pages are kept alive.
4. Add a third page inside the PagerView after the history page:
   ```
   <View key="exercises" style={s.page}>
     <ExercisesContent />
   </View>
   ```
5. Create an `ExercisesContent` component (same file, below `PlansContent`). Copy the entire body of `ExercisesScreen` from exercises.tsx but:
   - Remove the `SafeAreaView` wrapper and the header `<View style={s.header}>` with title text (the Plans screen already has its own SafeAreaView and tab bar header).
   - Keep everything else: `useExercises` hook, filter state, `filteredExercises` memo, `ExerciseFilterBar`, `FlatList`, `EmptyState`, FAB button, and `ExerciseBottomSheet`.
   - Add top padding to the filter bar area (paddingTop: 12) so content doesn't sit flush against the tab indicator.
6. Add the necessary styles for ExercisesContent (reuse existing style names where possible, add `exercisesContainer`, `exercisesList`, `exercisesFab`, `exercisesFabPressed`, `exercisesFabText` to the StyleSheet).

In `app/(app)/(tabs)/_layout.tsx`:
1. Remove the entire `<Tabs.Screen name="exercises" ... />` block.
2. The remaining tabs should be: dashboard, plans, settings (in that order).

In `app/(app)/(tabs)/exercises.tsx`:
1. Delete the file entirely. It is no longer a tab route.

IMPORTANT: The exercise picker modal used during plan creation and workouts (ExercisePicker component) is a separate component and must NOT be touched.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Bottom tab bar shows 3 tabs (Home, Plans, Settings). Plans screen inner tab bar shows Plans | History | Exercises. Swiping to Exercises page shows the full exercise library with search, filters, add button, and edit/view bottom sheet. exercises.tsx tab file is deleted.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- Bottom tab bar renders exactly 3 tabs: Home, Plans, Settings
- Plans screen PagerView has 3 swipeable pages
- Exercises page within Plans shows filter bar, exercise list, FAB, and bottom sheet functionality
- Exercise picker in plan creation/workout flow is unchanged
</verification>

<success_criteria>
- Exercises bottom tab removed; 3 bottom tabs remain
- Exercises accessible as third inner tab in Plans screen
- All exercise library functionality preserved (search, filter, add, edit, delete)
- No TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/27-move-exercises-off-the-home-tab-and-into/27-SUMMARY.md`
</output>
