# Phase 6: Progress Charts + Dashboard - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Per-exercise progress charts (estimated 1RM, max weight, volume over time), bodyweight logging with trend chart, and upgrading the dashboard shell into a real home screen showing today's planned workout and progress summary. No body measurements, no progress photos — those are Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Exercise chart access
- Both paths: accessible from exercise in history detail view AND from a dedicated progress section
- Progress section accessible from dashboard or exercises tab for proactive progress checking
- Tapping an exercise in a past session detail opens its chart for natural discovery

### Exercise chart metrics
- Estimated 1RM is the primary chart line (main visual)
- Max weight and total volume available on demand via tabs or toggles below the chart
- Clean default with detail on demand

### Exercise chart time range
- Default to all time (full history shown)
- Switchable time ranges: 1M / 3M / 6M / 1Y / All
- Auto-scale axis to fit available data

### Exercise chart interaction
- View only — no tappable data points
- The trend line tells the story; no tooltip interaction needed

### Dashboard progress summary card
- Combined card: top section shows current streak + recent PRs hit (exercise + weight), bottom section shows this week's stats (workouts completed, total volume)
- Includes small sparkline charts showing trend direction for key lifts

### Dashboard card ordering
- Today's Workout card first (action-oriented: what to do NOW)
- Progress summary card second
- Bodyweight card third
- PR baselines card kept as a separate card (not merged into progress summary) — tappable to edit as already built

### Bodyweight logging
- Dashboard card with latest weight + mini sparkline trend + quick-add button
- Unit selector shown on every bodyweight input (always ask, not inferred)
- One decimal precision supported (e.g., 185.5 lbs)
- No separate full-screen bodyweight page — logging and chart live on the dashboard card

### Today's workout card — planned day
- Shows plan name, day label, exercise count, and estimated duration
- "Start Workout" button on the card
- Lighter preview with quick stats, not full exercise list

### Today's workout card — rest day / no workout
- Shows "Rest day" message with next planned workout teaser (e.g., "Next: Push Day — Tomorrow")
- Includes freestyle "Quick Workout" button

### Today's workout card — no plan exists
- Offers both: "Create a plan" button (links to plan builder) and "Quick freestyle workout" button
- New users aren't blocked from using the app immediately

### Today's workout card — tap behavior
- "Start Workout" button launches active workout directly (fastest path)
- Tapping elsewhere on the card navigates to plan day detail for preview
- Both paths available from the same card

### Claude's Discretion
- Charting library selection (researcher will investigate options)
- Sparkline implementation approach
- Chart axis labeling, grid styling, and color scheme for lines
- Streak calculation logic (consecutive days? weekly adherence?)
- Progress summary card internal layout
- Bodyweight input UI (inline expand, bottom sheet, modal)
- How to determine "today's workout" from plan day assignments
- Estimated duration calculation method

</decisions>

<specifics>
## Specific Ideas

- Dark & bold aesthetic consistent with Phases 1-5 (dark backgrounds, clean typography, accent colors)
- Dashboard should feel like opening the app and immediately knowing: what to do today + how you're progressing
- Sparklines give a quick visual "am I trending up?" signal without navigating to full charts
- Today's workout card is the primary action point — top position, most prominent
- Bodyweight mini chart on dashboard card enables daily weigh-in habit without extra navigation

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/Card.tsx`: Card component for all dashboard cards
- `src/components/ui/Button.tsx`: Button for Start Workout, Quick Workout, Create Plan CTAs
- `src/components/ui/Input.tsx`: Adapt for bodyweight numeric input
- `app/(app)/(tabs)/dashboard.tsx`: Existing dashboard shell with placeholder cards to upgrade
- `src/constants/theme.ts`: Dark theme colors (background #0a0a0a, surface #1a1a1a, accent #3b82f6, success #22c55e)
- `src/stores/authStore.ts`: Zustand + MMKV pattern for new bodyweight store
- Bottom sheet pattern (Phase 2): potential use for bodyweight quick-log input

### Established Patterns
- StyleSheet.create for all styling (no NativeWind className)
- Expo Router file-based routing: `app/(app)/(tabs)/` for tab screens
- Zustand + MMKV for state management
- Supabase migrations in `supabase/migrations/` for schema changes
- Card-based list UI pattern (Phase 2, Phase 3, Phase 5)
- useFocusEffect for refreshing data when screen gains focus

### Integration Points
- Dashboard tab: replace placeholder cards with real data-driven cards
- Supabase: query set_logs for chart data (1RM stored per-set from Phase 5)
- New bodyweight_logs table needed (user_id, weight, unit, logged_at)
- Plan store: read active plan + today's day assignment for Today's Workout card
- Phase 4 active workout: "Start Workout" button navigates to workout route
- Phase 5 history: exercise tap in session detail navigates to chart view

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-progress-charts-dashboard*
*Context gathered: 2026-03-09*
