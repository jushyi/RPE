---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/plans/components/DaySlotEditor.tsx
  - src/features/plans/components/PlanExerciseRow.tsx
autonomous: true
requirements: [QT-4]
must_haves:
  truths:
    - "All exercises start collapsed when entering edit mode"
    - "Collapsed exercises show summary with name, muscle badges, sets table, and notes"
    - "Collapsed exercises have an edit button (pencil icon) to re-expand"
    - "Expanded exercises have a full-width Done button at the bottom to collapse"
    - "Newly added exercises auto-expand so user can immediately input data"
  artifacts:
    - path: "src/features/plans/components/DaySlotEditor.tsx"
      provides: "Collapse state management and prop passing"
    - path: "src/features/plans/components/PlanExerciseRow.tsx"
      provides: "Collapsed summary view and Done button styling"
  key_links:
    - from: "DaySlotEditor.tsx"
      to: "PlanExerciseRow"
      via: "collapsed and onToggleCollapse props"
      pattern: "collapsed=.*onToggleCollapse="
---

<objective>
Wire up the existing collapse/expand infrastructure in DaySlotEditor and PlanExerciseRow so exercises can be collapsed to a summary view with an edit button, and expanded with a full-width Done button.

Purpose: Reduce visual clutter when editing plan days with multiple exercises. User finishes editing one exercise, taps Done, it collapses to a clean summary, then moves on.
Output: Working collapse/expand behavior in plan exercise editing.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/4-add-done-button-to-collapse-exercise-edi/4-CONTEXT.md
@src/features/plans/components/DaySlotEditor.tsx
@src/features/plans/components/PlanExerciseRow.tsx
@src/features/plans/components/PlanDaySection.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Wire collapse state and update Done button styling</name>
  <files>src/features/plans/components/DaySlotEditor.tsx, src/features/plans/components/PlanExerciseRow.tsx</files>
  <action>
**DaySlotEditor.tsx changes:**

1. Change the initial `collapsedExercises` state: Instead of starting as an empty Set, initialize it so ALL existing exercises start collapsed. Change the useState initializer to compute from the `days` prop — collect all exercise tempIds into the set. Use a lazy initializer: `useState(() => { const ids = new Set<string>(); days.forEach(d => d.exercises.forEach(e => ids.add(e.tempId))); return ids; })`.

2. In `handleExerciseSelected`, after creating the new exercise with `makeTempId()`, do NOT add its tempId to `collapsedExercises` — this ensures newly added exercises auto-expand for immediate editing.

3. Pass `collapsed` and `onToggleCollapse` props to each `PlanExerciseRow` in the normal edit mode rendering (the non-reorder branch around line 234-256):
   ```
   collapsed={collapsedExercises.has(item.tempId)}
   onToggleCollapse={() => toggleExerciseCollapse(item.tempId)}
   ```

**PlanExerciseRow.tsx changes:**

4. Update the Done button styling to be full-width at the bottom of the card (per user decision). Change `s.doneBtn` from `justifyContent: 'flex-end'` to `justifyContent: 'center'`, add `backgroundColor: colors.surfaceElevated`, `borderRadius: 8`, `paddingVertical: 10`, and `marginTop: 12`. Update `s.doneBtnText` fontSize to 14.

5. The collapsed summary view and Edit button already exist in PlanExerciseRow (lines 58-103) and look correct — they show name, muscle badges, sets table, and notes matching the PlanDaySection read-only style. No changes needed to collapsed view rendering.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Desktop/Gym-App && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
    - When entering plan edit mode, all existing exercises render in collapsed summary view (name + badges + sets table + notes)
    - Each collapsed exercise has a pencil icon edit button that expands it for editing
    - Each expanded exercise has a full-width "Done" button at the bottom that collapses it back to summary
    - Newly added exercises via "Add Exercise" auto-expand for immediate data input
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- Open the app, navigate to Plans tab, tap an existing plan, enter edit mode
- Verify all exercises appear in collapsed summary view showing name, muscle group badges, and sets table
- Tap pencil icon on a collapsed exercise — it expands to full edit view
- Tap Done button at bottom of expanded exercise — it collapses back to summary
- Tap "Add Exercise" to add a new exercise — it appears expanded for immediate editing
- Tap Done on the new exercise — it collapses to summary with the data just entered
</verification>

<success_criteria>
- Exercises start collapsed in edit mode with summary matching read-only view style
- Edit button on collapsed view re-expands for editing
- Full-width Done button at bottom of expanded view collapses exercise
- Newly added exercises auto-expand
- No TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/4-add-done-button-to-collapse-exercise-edi/4-SUMMARY.md`
</output>
