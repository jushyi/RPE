# Quick Task 27: Move exercises off the home tab and into the plans tab as a separate screen with a button to access - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Task Boundary

Move the Exercises top-level tab into the Plans tab as a third inner tab (alongside Plans and History). Remove the Exercises bottom tab, leaving 3 bottom tabs: Home, Plans, Settings.

</domain>

<decisions>
## Implementation Decisions

### Tab Bar Layout
- Remove the Exercises bottom tab entirely
- Bottom tab bar becomes 3 tabs: Home (Dashboard), Plans, Settings

### Button/Access Placement
- Add "Exercises" as a third inner tab inside the Plans screen's PagerView
- Tab bar inside Plans becomes: Plans | History | Exercises

### Exercise Picker Impact
- The exercise picker modal used during plan creation and workouts stays unchanged
- Only the browsing/library tab is being relocated

### Claude's Discretion
- Animation and transition details for the new inner tab

</decisions>

<specifics>
## Specific Ideas

- The Plans screen already uses PagerView with an animated tab indicator for Plans/History — extend this to include Exercises as a third page
- The existing exercises.tsx tab screen content can be reused as-is inside the PagerView
- No changes needed to workout flow or plan creation exercise picker

</specifics>
