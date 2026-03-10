# Quick Task 4: Add done button to collapse exercise edit view into summary with edit button - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Task Boundary

When adding or editing exercises in a day for a plan, there should be a "done" button that collapses the full view after you finish inputting and makes it look like a summary similar to the view when viewing plan. Add a button to collapsed view to edit after.

</domain>

<decisions>
## Implementation Decisions

### Collapsed summary content
- Show exercise name, muscle group badges, and the full sets table (Weight/Reps/RPE) — matching the read-only PlanDaySection view style

### Initial expand state
- All exercises start collapsed when entering edit mode — user taps Edit on the one they want to change

### Done button placement
- Full-width button at the bottom of the expanded exercise card, below the last field (weight progression)

</decisions>

<specifics>
## Specific Ideas

- Collapsed view should visually match the existing PlanDaySection exercise card style (read-only view)
- Edit button on collapsed card to re-expand for editing
- Newly added exercises should auto-expand so user can immediately input data

</specifics>
