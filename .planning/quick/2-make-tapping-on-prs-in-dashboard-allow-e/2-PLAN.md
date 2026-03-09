---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/auth/components/PRBaselineForm.tsx
  - app/(app)/(tabs)/dashboard.tsx
  - app/(app)/onboarding/pr-baseline.tsx
autonomous: true
requirements: ["QUICK-2"]
must_haves:
  truths:
    - "Tapping the PR card on the dashboard navigates to an edit screen"
    - "Edit screen pre-fills with existing PR values"
    - "Saving updated PRs returns to the dashboard with refreshed values"
    - "Onboarding PR flow still works unchanged"
  artifacts:
    - path: "src/features/auth/components/PRBaselineForm.tsx"
      provides: "PR form that accepts initialValues for editing"
    - path: "app/(app)/(tabs)/dashboard.tsx"
      provides: "Tappable PRCard that navigates to edit"
    - path: "app/(app)/onboarding/pr-baseline.tsx"
      provides: "PR screen that reads route params to distinguish edit vs onboarding mode"
  key_links:
    - from: "app/(app)/(tabs)/dashboard.tsx"
      to: "app/(app)/onboarding/pr-baseline.tsx"
      via: "router.push with mode param"
      pattern: "router\\.push.*pr-baseline"
    - from: "app/(app)/onboarding/pr-baseline.tsx"
      to: "src/features/auth/components/PRBaselineForm.tsx"
      via: "initialValues prop"
      pattern: "initialValues"
---

<objective>
Make tapping on the Personal Records card in the dashboard navigate to the existing PR baseline form pre-filled with current values, allowing the user to edit their PRs.

Purpose: Users currently cannot edit their PRs after onboarding -- the PR card is display-only. This adds edit capability by reusing the existing PRBaselineForm.
Output: Tappable PR card on dashboard that opens editable PR form pre-filled with current values.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/features/auth/components/PRBaselineForm.tsx
@app/(app)/(tabs)/dashboard.tsx
@app/(app)/onboarding/pr-baseline.tsx
@src/features/auth/hooks/usePRBaselines.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add initialValues support to PRBaselineForm and edit mode to pr-baseline screen</name>
  <files>src/features/auth/components/PRBaselineForm.tsx, app/(app)/onboarding/pr-baseline.tsx</files>
  <action>
1. In PRBaselineForm.tsx, add an optional `initialValues` prop to PRBaselineFormProps:
   ```
   initialValues?: Array<{ exercise_name: string; weight: number; unit: 'kg' | 'lbs' }>;
   ```
   Also add an optional `mode` prop: `mode?: 'onboarding' | 'edit'` (default 'onboarding').

2. Update the lifts state initialization: if `initialValues` is provided, pre-fill the weight fields from matching entries. Set globalUnit from the first initialValue's unit if available.

3. When mode is 'edit':
   - Change title from "Set Your Starting PRs" to "Edit Your PRs"
   - Change subtitle from "Enter your current 1RM for each lift (optional)" to "Update your personal records"
   - Change save button text from "Save & Continue" to "Save"
   - Hide the "Skip" button (not relevant for editing)

4. In app/(app)/onboarding/pr-baseline.tsx:
   - Read route params using `useLocalSearchParams` from expo-router for `mode` (string) and `baselines` (JSON string).
   - If `mode === 'edit'`, parse `baselines` JSON into the initialValues array.
   - If mode is 'edit', the handleComplete should use `router.back()` instead of `router.replace('/(app)/(tabs)/dashboard')`.
   - If mode is 'edit', do NOT call setOnboardingComplete.
   - Show a back/close header button when in edit mode (use Stack.Screen options: headerShown true, title "Edit PRs", headerStyle with background color).
  </action>
  <verify>
    <automated>cd /c/Users/maser/Desktop/Gym-App && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>PRBaselineForm accepts initialValues and mode props. pr-baseline screen reads route params to support edit mode with pre-filled values and back navigation.</done>
</task>

<task type="auto">
  <name>Task 2: Make PRCard tappable and pass baselines to edit screen</name>
  <files>app/(app)/(tabs)/dashboard.tsx</files>
  <action>
1. In the PRCard component in dashboard.tsx, wrap the entire card content (when baselines exist) in a Pressable that navigates to the pr-baseline screen with edit params:
   ```typescript
   router.push({
     pathname: '/(app)/onboarding/pr-baseline',
     params: {
       mode: 'edit',
       baselines: JSON.stringify(baselines.map(b => ({
         exercise_name: b.exercise_name,
         weight: b.weight,
         unit: b.unit,
       }))),
     },
   });
   ```

2. Add a visual edit indicator: add a small "Edit" text or pencil-like indicator (use text "Edit >" in textSecondary color, right-aligned) in the card title row so users know the card is tappable. Import Pressable if not already imported (it is already imported).

3. Wrap the Card in a Pressable with appropriate styling (no opacity flash -- use `android_ripple` for Android and a subtle opacity style for pressed state).

4. After returning from the edit screen, refresh baselines. Add a `useFocusEffect` from `@react-navigation/native` (or use expo-router's `useFocusEffect`) to re-fetch baselines whenever the dashboard regains focus, replacing the current useEffect that only runs once:
   ```typescript
   import { useFocusEffect } from 'expo-router';
   // Replace useEffect for baselines with:
   useFocusEffect(
     useCallback(() => {
       getPRBaselines().then(setBaselines).catch(() => {});
     }, [getPRBaselines])
   );
   ```
   Import useCallback from react.
  </action>
  <verify>
    <automated>cd /c/Users/maser/Desktop/Gym-App && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>PRCard is tappable when baselines exist. Tapping navigates to edit screen with current values. Dashboard refreshes PRs when returning from edit screen.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors: `npx tsc --noEmit`
2. App loads dashboard, PR card shows existing values
3. Tapping PR card navigates to edit screen with pre-filled values
4. Editing values and saving returns to dashboard with updated values
5. Onboarding PR flow still works normally (skip/save both work)
</verification>

<success_criteria>
- PRCard is tappable and navigates to the edit form
- Edit form pre-fills with existing PR values
- Saving edited PRs returns to dashboard
- Dashboard shows updated values after editing
- Onboarding flow is unaffected
</success_criteria>

<output>
After completion, create `.planning/quick/2-make-tapping-on-prs-in-dashboard-allow-e/2-SUMMARY.md`
</output>
