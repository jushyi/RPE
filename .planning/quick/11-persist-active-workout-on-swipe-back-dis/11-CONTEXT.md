# Quick Task 11: Persist active workout on swipe-back dismiss with resume bar and history tab resume - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Task Boundary

When a user starts a workout and swipes left from the edge (back gesture), the workout screen dismisses and all progress appears lost. The workout data IS persisted in MMKV via Zustand, but there's no UI affordance to resume it. This task adds visible resume paths so the user can get back to their in-progress workout.

</domain>

<decisions>
## Implementation Decisions

### Back Swipe Behavior
- Allow back swipe freely — no confirmation dialog. The workout persists silently in the background. The resume bar makes it obvious the workout is still active.

### Resume Bar Design
- Compact bar sitting directly above the bottom tab bar on all tab screens
- Shows: workout name (plan name or "Freestyle") + elapsed timer + play/resume icon
- Visible on every tab while a workout is in progress
- Tapping it navigates back to the workout screen

### History In-Progress Entry
- Card in the history list with a distinct border and "In Progress" text
- Styled differently from completed sessions to stand out
- Tapping it navigates back to the active workout screen

### Claude's Discretion
- Timer implementation details (use existing elapsed time from session or add a live timer)
- Exact styling/colors for the resume bar and in-progress card (follow existing app design patterns)
- Whether to also show something on the dashboard tab (user chose history list specifically)

</decisions>

<specifics>
## Specific Ideas

- Resume bar collapses the workout into a "mini player" style bar (like Spotify's now-playing bar)
- In-progress card in history should be at the top of the list, not sorted by date
- The CrashRecoveryPrompt already handles app-crash scenarios — this is about intentional navigation away

</specifics>
