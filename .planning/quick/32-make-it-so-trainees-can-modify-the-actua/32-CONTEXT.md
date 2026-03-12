# Quick Task 32: Make it so trainees can modify the actual days the plan their coach scheduled for them - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Task Boundary

Make it so trainees can modify the actual days the plan their coach scheduled for them

</domain>

<decisions>
## Implementation Decisions

### Scope of changes
- Trainees can ONLY change the weekday assignment (which day of the week) for each training day in a coach-created plan
- Exercises, sets, day names, and day order stay locked — coach controls those

### Edit UX approach
- Inline tap-to-change: In the read-only plan detail view, each day shows its weekday as a tappable chip
- Tapping the chip opens a weekday picker (no need to enter full edit mode)
- This keeps the coach plan feeling "owned by coach" while giving trainees scheduling flexibility

### Claude's Discretion
- Coach notification: not discussed — skip for now (no notification when trainee reschedules)

</decisions>

<specifics>
## Specific Ideas

- The weekday chip should appear next to the day name in PlanDaySection (e.g., "Push - Monday" where "Monday" is tappable)
- Use a simple picker/action sheet for weekday selection (Sun-Sat)
- Only show the tappable chip on coach-created plans (where coach_id is set)
- Personal plans continue to use the existing full edit mode for weekday changes
- Save the weekday change directly to the database without requiring full plan edit flow

</specifics>
