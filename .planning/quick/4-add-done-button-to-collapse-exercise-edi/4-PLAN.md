---
phase: quick
plan: 4
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/plans/components/PlanExerciseRow.tsx
  - src/features/plans/components/DaySlotEditor.tsx
autonomous: true
requirements: [QUICK-4]
must_haves:
  truths:
    - "Each exercise in edit mode has a Done button that collapses it to a summary view"
    - "Collapsed exercise shows name, muscle badges, sets table, and notes (like read-only PlanDaySection)"
    - "Collapsed exercise has an Edit button to re-expand to full edit mode"
    - "Newly added exercises start in expanded (editing) mode"
  artifacts:
    - path: "src/features/plans/components/PlanExerciseRow.tsx"
      provides: "Collapsed summary view and Done/Edit toggle"
    - path: "src/features/plans/components/DaySlotEditor.tsx"
      provides: "Collapsed state tracking per exercise"
  key_links:
    - from: "DaySlotEditor.tsx"
      to: "PlanExerciseRow.tsx"
      via: "collapsed prop and onToggleCollapse callback"
      pattern: "collapsed=.*onToggleCollapse="
---

<objective>
Add a "Done" button to each exercise row in the plan editor that collapses the full edit view into a compact summary (matching the read-only style in PlanDaySection). Add an "Edit" button on the collapsed view to re-expand.

Purpose: Reduce visual clutter after finishing exercise configuration, giving users a clean overview while still allowing quick re-editing.
Output: Updated PlanExerciseRow with collapsed/expanded states, DaySlotEditor with collapse tracking.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/plans/components/PlanExerciseRow.tsx
@src/features/plans/components/DaySlotEditor.tsx
@src/features/plans/components/PlanDaySection.tsx (reference for summary layout style)
@src/features/plans/components/SetRow.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add collapsed/expanded toggle to PlanExerciseRow and wire in DaySlotEditor</name>
  <files>src/features/plans/components/PlanExerciseRow.tsx, src/features/plans/components/DaySlotEditor.tsx</files>
  <action>
**PlanExerciseRow.tsx changes:**

1. Add two new props to `PlanExerciseRowProps`:
   - `collapsed: boolean` (whether this exercise is in collapsed summary mode)
   - `onToggleCollapse: () => void` (callback to toggle collapsed state)

2. When `isEditing && !collapsed` (expanded edit mode — current behavior):
   - Keep all existing edit UI (sets, notes, unit, weight progression, remove button)
   - Add a "Done" button at the bottom of the exercise card. Style: a Pressable row with Ionicons `checkmark-circle-outline` (size 16, color `colors.success`) and text "Done" (fontSize 13, fontWeight 600, color `colors.success`). Place it in a new View with `flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10`. On press, call `onToggleCollapse()`.

3. When `isEditing && collapsed` (collapsed summary mode):
   - Render a compact summary view modeled after PlanDaySection's exercise cards:
     - Exercise name + muscle group badges (reuse existing header layout)
     - A sets summary table identical to PlanDaySection: header row ("Set", "Weight", "Reps", "RPE") and data rows for each target_set. Use the same column widths (setNumCol width 36, setValueCol flex 1 centered).
     - If notes exist, show them in italic muted text below the table.
     - An "Edit" button in the top-right corner of the header (replacing the trash icon position): Pressable with Ionicons `create-outline` (size 18, color `colors.accent`). On press, call `onToggleCollapse()`.
   - Do NOT show: SetRow components, Add Set button, notes TextInput, unit override picker, weight progression picker, remove/trash button.

4. When `!isEditing` (read-only mode): no changes needed (this prop combination is not currently used but keep existing behavior).

5. Add these new styles to the StyleSheet:
   - `doneBtn`: `{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 10 }`
   - `doneBtnText`: `{ color: colors.success, fontSize: 13, fontWeight: '600' }`
   - `editBtn`: `{ padding: 4 }`
   - `summaryTable`: `{ marginTop: 4 }`
   - `summaryHeaderRow`: `{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.surfaceElevated, paddingBottom: 4, marginBottom: 2 }`
   - `summaryHeaderCell`: `{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }`
   - `summaryRow`: `{ flexDirection: 'row', paddingVertical: 3 }`
   - `summaryCell`: `{ color: colors.textSecondary, fontSize: 13 }`
   - `summarySetNumCol`: `{ width: 36 }`
   - `summarySetValueCol`: `{ flex: 1, textAlign: 'center' }`
   - `summaryNotes`: `{ color: colors.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 6 }`

**DaySlotEditor.tsx changes:**

1. Add state to track which exercises are collapsed:
   `const [collapsedExercises, setCollapsedExercises] = useState<Set<string>>(new Set());`

2. Add a toggle handler:
   ```
   const toggleExerciseCollapse = (tempId: string) => {
     setCollapsedExercises(prev => {
       const next = new Set(prev);
       if (next.has(tempId)) next.delete(tempId);
       else next.add(tempId);
       return next;
     });
   };
   ```

3. In the normal edit mode exercise map (not reorder mode), pass new props to each PlanExerciseRow:
   - `collapsed={collapsedExercises.has(item.tempId)}`
   - `onToggleCollapse={() => toggleExerciseCollapse(item.tempId)}`

4. Newly added exercises (via handleExerciseSelected) should NOT be added to the collapsed set, so they start expanded by default. No change needed since the Set starts empty.

5. When an exercise is removed (removeExercise), clean up the collapsed set:
   ```
   setCollapsedExercises(prev => {
     if (!prev.has(exercises[exIndex].tempId)) return prev;
     const next = new Set(prev);
     next.delete(exercises[exIndex].tempId);
     return next;
   });
   ```
   Access the tempId before calling onChange to remove.

No emojis in any UI text — use Ionicons only.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Desktop/Gym-App && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
    - Expanded exercise rows show a "Done" button that collapses to summary view
    - Collapsed exercises show name, badges, sets table, notes in read-only compact style
    - Collapsed exercises show an "Edit" icon button that re-expands to full edit mode
    - New exercises start expanded; TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- TypeScript compiles: `npx tsc --noEmit`
- Visual check: Open plan editor, add exercise, configure sets, tap Done — should collapse to summary. Tap Edit icon — should expand back to full edit view.
</verification>

<success_criteria>
- Exercise rows in plan editor can be toggled between full edit and collapsed summary views
- Collapsed view matches the visual style of PlanDaySection's read-only exercise cards
- Done button uses checkmark-circle-outline icon (no emoji), Edit button uses create-outline icon
</success_criteria>

<output>
After completion, create `.planning/quick/4-add-done-button-to-collapse-exercise-edi/4-SUMMARY.md`
</output>
