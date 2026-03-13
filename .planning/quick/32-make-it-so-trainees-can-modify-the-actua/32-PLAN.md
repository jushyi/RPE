---
phase: quick-32
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/plans/hooks/usePlanDetail.ts
  - src/features/plans/components/PlanDaySection.tsx
  - app/(app)/plans/[id].tsx
autonomous: true
requirements: [QUICK-32]

must_haves:
  truths:
    - "Trainee sees a tappable weekday chip next to each day name on a coach-created plan"
    - "Tapping the chip opens a weekday picker (Sun-Sat) and selecting a day updates it immediately"
    - "Weekday change persists to the database without requiring full plan edit mode"
    - "Personal plans (no coach_id) do NOT show the tappable chip — they use existing edit flow"
  artifacts:
    - path: "src/features/plans/hooks/usePlanDetail.ts"
      provides: "updateDayWeekday function for single-row weekday update"
      exports: ["updateDayWeekday"]
    - path: "src/features/plans/components/PlanDaySection.tsx"
      provides: "WeekdayPicker modal and tappable chip in PlanDaySection"
      contains: "WeekdayPickerModal"
    - path: "app/(app)/plans/[id].tsx"
      provides: "Passes isCoachPlan and onWeekdayChange callback to PlanDaySection"
  key_links:
    - from: "src/features/plans/components/PlanDaySection.tsx"
      to: "src/features/plans/hooks/usePlanDetail.ts"
      via: "onWeekdayChange callback prop"
      pattern: "onWeekdayChange"
    - from: "app/(app)/plans/[id].tsx"
      to: "src/features/plans/components/PlanDaySection.tsx"
      via: "isCoachPlan and onWeekdayChange props"
      pattern: "isCoachPlan.*onWeekdayChange"
---

<objective>
Allow trainees to change the weekday assignment on coach-created plans without entering full edit mode.

Purpose: Coaches create plans with exercises/sets locked, but trainees need scheduling flexibility to fit their own availability.
Output: Tappable weekday chip on coach plans that opens a picker and saves directly to the database.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/plans/types.ts
@src/features/plans/constants.ts
@src/features/plans/hooks/usePlanDetail.ts
@src/features/plans/components/PlanDaySection.tsx
@app/(app)/plans/[id].tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add lightweight updateDayWeekday to usePlanDetail and wire into plan detail screen</name>
  <files>src/features/plans/hooks/usePlanDetail.ts, app/(app)/plans/[id].tsx</files>
  <action>
In usePlanDetail.ts, add a new `updateDayWeekday` function that:
- Takes `dayId: string` and `weekday: number` (0-6, Sun-Sat)
- Updates ONLY the `weekday` column on the single `plan_days` row via `supabase.from('plan_days').update({ weekday }).eq('id', dayId)`
- Updates the local `plan` state by mapping over plan_days and setting the matching day's weekday
- Updates the plan store via `updateInStore` to keep MMKV cache in sync
- Is fire-and-forget for the DB call (optimistic local update, console.warn on error)
- Return this function from the hook alongside existing returns

In [id].tsx (PlanDetailScreen):
- Destructure `updateDayWeekday` from `usePlanDetail(id)`
- Determine `isCoachPlan` from `!!plan.coach_id`
- In the read-only FlatList renderItem, pass two new props to PlanDaySection:
  - `isCoachPlan={isCoachPlan}`
  - `onWeekdayChange={(dayId, weekday) => updateDayWeekday(dayId, weekday)}`
- Do NOT pass these props when in edit mode (DaySlotEditor handles its own editing)
  </action>
  <verify>TypeScript compiles: npx tsc --noEmit --pretty 2>&1 | head -30</verify>
  <done>usePlanDetail exposes updateDayWeekday; plan detail screen passes isCoachPlan and onWeekdayChange to PlanDaySection for coach plans only</done>
</task>

<task type="auto">
  <name>Task 2: Add tappable weekday chip and picker modal to PlanDaySection</name>
  <files>src/features/plans/components/PlanDaySection.tsx</files>
  <action>
Add two new optional props to PlanDaySectionProps:
- `isCoachPlan?: boolean` (default false)
- `onWeekdayChange?: (dayId: string, weekday: number) => void`

Create a small `WeekdayPickerModal` component (inline in same file) that:
- Uses React Native `Modal` with `transparent` and `animationType="fade"`
- Shows a dark semi-transparent overlay (rgba(0,0,0,0.5)) with a centered card
- Card has title "Select Day" and 7 rows (Sunday through Saturday) using WEEKDAY_LABELS
- Each row is a Pressable with the full weekday name (Sunday, Monday, ..., Saturday)
- Currently selected weekday gets accent color highlight
- Tapping a weekday calls onWeekdayChange and closes the modal
- Has a "Cancel" button at the bottom or tapping overlay closes it

Full weekday names for the picker: `['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']`

Modify the header area of PlanDaySection:
- When `isCoachPlan && onWeekdayChange` are provided, render the weekday label as a tappable chip (small rounded Pressable with accent border) instead of plain text
- The chip shows the abbreviated weekday (e.g., "Mon") from WEEKDAY_LABELS
- If weekday is null, show "Set Day" as placeholder text in the chip
- Tapping the chip opens the WeekdayPickerModal
- When NOT a coach plan, keep the existing plain text weekday display unchanged

Add styles for the chip: small rounded border using colors.accent, paddingHorizontal 8, paddingVertical 2, marginLeft 8. Text inside uses colors.accent, fontSize 13, fontWeight '600'.

Add styles for the modal: overlay with flex 1, justifyContent center, alignItems center, backgroundColor rgba(0,0,0,0.5). Card with backgroundColor colors.surface, borderRadius 14, padding 16, width 260. Each option row paddingVertical 12, borderBottom using surfaceElevated. Selected row text in colors.accent.
  </action>
  <verify>TypeScript compiles: npx tsc --noEmit --pretty 2>&1 | head -30</verify>
  <done>Coach-created plans show a tappable weekday chip on each day; tapping opens a modal picker; selecting a weekday calls onWeekdayChange and closes the modal; personal plans display weekdays as plain text (unchanged)</done>
</task>

</tasks>

<verification>
- Open a coach-created plan as a trainee: each day shows a tappable weekday chip
- Tap the chip: weekday picker modal appears with 7 options
- Select a different day: modal closes, chip updates immediately
- Refresh or navigate away and back: the changed weekday persists
- Open a personal plan (no coach_id): weekday displays as plain text (no chip), edit button still works normally
</verification>

<success_criteria>
- Trainees can change weekday assignments on coach-created plans via tappable chip + picker
- Changes persist to Supabase plan_days table
- Personal plans are unaffected (no visual or behavioral change)
- No full edit mode required for weekday-only changes on coach plans
</success_criteria>

<output>
After completion, create `.planning/quick/32-make-it-so-trainees-can-modify-the-actua/32-SUMMARY.md`
</output>
