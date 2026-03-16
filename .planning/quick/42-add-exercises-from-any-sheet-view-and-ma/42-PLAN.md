---
phase: quick-42
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/plans/components/ExercisePicker.tsx
  - src/features/workout/components/FreestyleExercisePicker.tsx
  - src/features/exercises/hooks/useExercises.ts
  - supabase/migrations/20260316000001_admin_exercises_global.sql
autonomous: true
requirements: [Q42-01, Q42-02]

must_haves:
  truths:
    - "User can create a new exercise directly from the ExercisePicker sheet when adding exercises to a plan day"
    - "User can create a new exercise directly from the FreestyleExercisePicker modal during a workout"
    - "Exercises created by maserinj@gmail.com are visible to all users as global exercises"
  artifacts:
    - path: "src/features/plans/components/ExercisePicker.tsx"
      provides: "Create Exercise button in plan exercise picker"
    - path: "src/features/workout/components/FreestyleExercisePicker.tsx"
      provides: "Create Exercise button in freestyle exercise picker"
    - path: "supabase/migrations/20260316000001_admin_exercises_global.sql"
      provides: "RLS policy and trigger for admin user global exercises"
  key_links:
    - from: "ExercisePicker.tsx"
      to: "useExercises.createExercise"
      via: "inline form or ExerciseBottomSheet"
      pattern: "createExercise"
    - from: "FreestyleExercisePicker.tsx"
      to: "useExercises.createExercise"
      via: "inline form or ExerciseBottomSheet"
      pattern: "createExercise"
---

<objective>
Add the ability to create new exercises from any exercise picker sheet (plan builder and freestyle workout), and make all exercises created by maserinj@gmail.com automatically become global exercises visible to all users.

Purpose: Users currently must exit plan/workout mode, navigate to the Exercises tab, create an exercise, then go back. This breaks flow. Also, admin-created exercises should benefit all users.
Output: Updated ExercisePicker and FreestyleExercisePicker with "Create New" buttons, plus Supabase migration for admin global exercise policy.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/plans/components/ExercisePicker.tsx
@src/features/workout/components/FreestyleExercisePicker.tsx
@src/features/exercises/components/ExerciseBottomSheet.tsx
@src/features/exercises/hooks/useExercises.ts
@src/features/exercises/types.ts
@src/stores/exerciseStore.ts
@supabase/migrations/20260310000000_create_exercises.sql

<interfaces>
From src/features/exercises/hooks/useExercises.ts:
```typescript
export function useExercises(): {
  exercises: Exercise[];
  isLoading: boolean;
  fetchExercises: (force?: boolean) => Promise<void>;
  createExercise: (exercise: Omit<Exercise, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'track_prs'> & { track_prs?: boolean }) => Promise<any>;
  updateExercise: (id: string, updates: Partial<Pick<Exercise, 'name' | 'muscle_groups' | 'equipment' | 'notes'>>) => Promise<any>;
  deleteExercise: (id: string) => Promise<void>;
  toggleTrackPRs: (exerciseId: string, trackPRs: boolean) => void;
}
```

From src/features/exercises/types.ts:
```typescript
export interface Exercise {
  id: string;
  user_id: string | null; // null = global seed exercise
  name: string;
  muscle_groups: MuscleGroup[];
  equipment: Equipment;
  notes: string | null;
  track_prs: boolean;
  created_at: string;
  updated_at: string;
}
```

ExerciseBottomSheet props:
```typescript
interface ExerciseBottomSheetProps {
  exerciseToEdit: Exercise | null;
  readOnly?: boolean;
  onSave: () => void;
  onDelete?: (id: string) => void;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add "Create New Exercise" to ExercisePicker and FreestyleExercisePicker</name>
  <files>
    src/features/plans/components/ExercisePicker.tsx
    src/features/workout/components/FreestyleExercisePicker.tsx
  </files>
  <action>
**ExercisePicker.tsx (BottomSheetModal-based, used in plan builder):**

1. Add a second BottomSheetModal ref (`createSheetRef`) for the ExerciseBottomSheet used to create exercises.
2. Import `ExerciseBottomSheet` from `@/features/exercises/components/ExerciseBottomSheet`.
3. Add a "Create New" button at the top of the exercise list, between the filter bar and the BottomSheetFlatList. Style it as a row with an `add-circle-outline` Ionicons icon and "Create New Exercise" text in `colors.accent`. Use a Pressable that calls `createSheetRef.current?.present()`.
4. Render `<ExerciseBottomSheet ref={createSheetRef} exerciseToEdit={null} onSave={handleExerciseCreated} />` inside the component. The `handleExerciseCreated` callback should call `fetchExercises(true)` to force-refresh the list so the new exercise appears immediately in the picker.
5. The ExerciseBottomSheet is also a BottomSheetModal so it will stack on top of the ExercisePicker sheet. This is the standard @gorhom/bottom-sheet stacking behavior already in use (app already has BottomSheetModalProvider in _layout.tsx).

**FreestyleExercisePicker.tsx (Modal-based, used in workout):**

1. This component uses a regular React Native `Modal`, not BottomSheetModal. We cannot nest a BottomSheetModal inside a plain Modal easily. Instead, add an inline "quick create" mini-form at the top of the list.
2. Add state: `showCreateForm` (boolean), and form fields: `newName`, `newMuscleGroups` (MuscleGroup[]), `newEquipment` (Equipment | '').
3. Add a "Create New Exercise" Pressable button below the filter bar (same style as ExercisePicker: Ionicons add-circle-outline + accent text). When pressed, toggle `showCreateForm`.
4. When `showCreateForm` is true, render an inline form below the button with:
   - TextInput for name (styled like ExerciseBottomSheet inputs)
   - Horizontal ScrollView of muscle group chips (reuse MUSCLE_GROUPS and MUSCLE_GROUP_COLORS from `@/features/exercises/constants/muscleGroups`)
   - Horizontal ScrollView of equipment chips (reuse EQUIPMENT_TYPES from `@/features/exercises/constants/equipmentTypes`)
   - "Save" button (accent background, white text). On press: validate name non-empty and at least one muscle group and equipment selected, then call `createExercise({ name: newName.trim(), muscle_groups: newMuscleGroups, equipment: newEquipment, notes: null })` from useExercises. After successful create, call `fetchExercises(true)`, reset form fields, set `showCreateForm = false`.
   - "Cancel" text button to collapse the form.
5. Import `useExercises` destructuring to also get `createExercise` (it already imports useExercises but only destructures `exercises` and `fetchExercises`).
6. Import MUSCLE_GROUPS, MUSCLE_GROUP_COLORS from `@/features/exercises/constants/muscleGroups` and EQUIPMENT_TYPES from `@/features/exercises/constants/equipmentTypes`.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Projects/Gym-App && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Both ExercisePicker and FreestyleExercisePicker have a "Create New Exercise" option. ExercisePicker opens ExerciseBottomSheet as stacked modal. FreestyleExercisePicker shows inline quick-create form. Both refresh the exercise list after creation.</done>
</task>

<task type="auto">
  <name>Task 2: Make maserinj@gmail.com exercises global via Supabase migration</name>
  <files>
    supabase/migrations/20260316000001_admin_exercises_global.sql
  </files>
  <action>
Create a new Supabase migration that:

1. Creates a trigger function `make_admin_exercises_global()` that fires BEFORE INSERT on the exercises table. It checks if the `NEW.user_id` corresponds to the user with email `maserinj@gmail.com` in `auth.users`. If so, set `NEW.user_id = NULL` (which makes the exercise global per existing RLS policy "Anyone can read global exercises"). Return NEW.

```sql
CREATE OR REPLACE FUNCTION public.make_admin_exercises_global()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the inserting user is the admin
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = NEW.user_id
    AND email = 'maserinj@gmail.com'
  ) THEN
    -- Make exercise global by setting user_id to NULL
    NEW.user_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. Create the trigger:
```sql
CREATE TRIGGER trg_admin_exercises_global
  BEFORE INSERT ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.make_admin_exercises_global();
```

3. Also retroactively update any existing exercises by maserinj@gmail.com to be global:
```sql
UPDATE public.exercises
SET user_id = NULL
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'maserinj@gmail.com'
);
```

Note: The INSERT RLS policy requires `auth.uid() = user_id`, but the trigger fires BEFORE the RLS check completes the insert. Since the trigger sets user_id to NULL, the RLS WITH CHECK would fail. To handle this, also add an INSERT policy that allows the admin user to insert global exercises:

```sql
CREATE POLICY "Admin can insert global exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (
    user_id IS NULL
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'maserinj@gmail.com'
    )
  );
```

This way: admin inserts with user_id=their_id -> trigger sets user_id=NULL -> RLS checks the new policy "admin can insert global" -> passes.

After creating the migration file, apply it to remote Supabase:
```bash
npx supabase db push
```

If db push fails due to the migration already being applied or other issues, apply directly via the Supabase MCP or SQL editor.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Projects/Gym-App && cat supabase/migrations/20260316000001_admin_exercises_global.sql | head -40</automated>
  </verify>
  <done>Migration file exists with trigger function, trigger, retroactive update, and admin insert policy. Admin user's exercises are automatically converted to global (user_id=NULL) on insert, visible to all users.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors
2. ExercisePicker shows "Create New Exercise" button that opens the ExerciseBottomSheet form
3. FreestyleExercisePicker shows "Create New Exercise" button that expands inline form
4. New exercises created from either picker appear immediately in the list
5. Migration file creates trigger for admin global exercises
</verification>

<success_criteria>
- Users can create exercises without leaving the plan builder or workout flow
- Exercises created by maserinj@gmail.com are automatically global (user_id = NULL)
- All existing exercise selection and filtering continues to work
</success_criteria>

<output>
After completion, create `.planning/quick/42-add-exercises-from-any-sheet-view-and-ma/42-SUMMARY.md`
</output>
