---
phase: quick-46
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/(tabs)/dashboard.tsx
  - app/(app)/plans/trainee-history.tsx
  - app/(app)/plans/trainee-plans.tsx
  - app/(app)/workout/summary.tsx
autonomous: true
requirements: [FIX-ESLINT-CI]
must_haves:
  truths:
    - "npx expo lint exits with code 0 (no errors)"
    - "All 4 ESLint errors are resolved"
    - "No behavioral changes to any component"
  artifacts:
    - path: "app/(app)/(tabs)/dashboard.tsx"
      provides: "Escaped apostrophe on line 365"
    - path: "app/(app)/plans/trainee-history.tsx"
      provides: "Escaped apostrophe on line 131"
    - path: "app/(app)/plans/trainee-plans.tsx"
      provides: "Escaped apostrophe on line 145"
    - path: "app/(app)/workout/summary.tsx"
      provides: "useMemo moved before early return"
  key_links: []
---

<objective>
Fix all 4 ESLint errors causing CI failure (exit code 1).

Purpose: Unblock CI pipeline -- currently fails on ESLint check.
Output: Clean ESLint run with 0 errors.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(app)/(tabs)/dashboard.tsx
@app/(app)/plans/trainee-history.tsx
@app/(app)/plans/trainee-plans.tsx
@app/(app)/workout/summary.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix 3 unescaped entity errors</name>
  <files>app/(app)/(tabs)/dashboard.tsx, app/(app)/plans/trainee-history.tsx, app/(app)/plans/trainee-plans.tsx</files>
  <action>
    Replace unescaped apostrophes in JSX text content with {"\u0027"} (the escaped form):

    1. **dashboard.tsx line 365:** Change `Today's Workouts` to `Today{"\u0027"}s Workouts`
    2. **trainee-history.tsx line 131:** Change `{traineeName ?? 'Trainee'}'s History` to `{traineeName ?? 'Trainee'}{"\u0027"}s History`
    3. **trainee-plans.tsx line 145:** Change `{traineeName ?? 'Trainee'}'s Plans` to `{traineeName ?? 'Trainee'}{"\u0027"}s Plans`

    Use the curly-brace string expression approach (`{"'"}`) rather than HTML entities since this is React Native (Text components, not HTML DOM).
  </action>
  <verify>
    <automated>cd c:/Users/maser/Projects/Gym-App && npx expo lint 2>&1 | grep -c "react/no-unescaped-entities" | grep "^0$"</automated>
  </verify>
  <done>Zero "react/no-unescaped-entities" errors remain.</done>
</task>

<task type="auto">
  <name>Task 2: Fix conditional useMemo hook in workout summary</name>
  <files>app/(app)/workout/summary.tsx</files>
  <action>
    The `useMemo` on line 93 is called AFTER an early return on line 72-88 (`if (!session)`), violating React's rules of hooks.

    Fix: Move the `useMemo` call (lines 92-106) to BEFORE the early return (after line 60, the last useEffect). Since `session` could be null at that point, guard inside the memo:

    ```typescript
    const prExercises = useMemo(() => {
      if (!session) return [];
      const summary = computeSessionSummary(session);
      if (summary.prs_hit === 0) return [];
      return session.exercises
        .filter((ex) => ex.logged_sets.some((set) => set.is_pr))
        .map((ex) => {
          const prSets = ex.logged_sets.filter((set) => set.is_pr);
          const maxPR = prSets.reduce((max, set) => set.weight > max.weight ? set : max, prSets[0]);
          return {
            name: ex.exercise_name,
            weight: maxPR.weight,
            unit: maxPR.unit,
          };
        });
    }, [session]);
    ```

    Then keep `const summary = computeSessionSummary(session);` on line 90 (after the early return) for use by the rest of the render. The `summary` used inside useMemo is computed independently within the memo closure.

    IMPORTANT: Verify that `prExercises` is not referenced in the early-return branch (it is not -- that branch just shows a "Workout Complete" fallback). Also verify `summary` is still available where needed after the early return for SessionSummaryCard etc.
  </action>
  <verify>
    <automated>cd c:/Users/maser/Projects/Gym-App && npx expo lint 2>&1 | grep -c "react-hooks/rules-of-hooks" | grep "^0$"</automated>
  </verify>
  <done>Zero "react-hooks/rules-of-hooks" errors remain.</done>
</task>

</tasks>

<verification>
Run full ESLint check and confirm zero errors:
```bash
cd c:/Users/maser/Projects/Gym-App && npx expo lint 2>&1 | tail -5
```
Expected: warnings only, exit code 0, no error count.
</verification>

<success_criteria>
- `npx expo lint` exits with code 0
- All 4 ESLint errors eliminated
- No runtime behavior changes (apostrophes still display correctly, useMemo still computes same values)
</success_criteria>

<output>
After completion, create `.planning/quick/46-fix-all-failing-eslint-ci-check-errors/46-SUMMARY.md`
</output>
