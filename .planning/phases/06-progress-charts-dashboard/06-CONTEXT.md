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
- Progress section accessible from dashboard or exercises tab — users can proactively browse exercise charts
- Tapping an exercise in a past session detail also opens its chart — natural discovery while reviewing history

### Exercise chart metrics
- Estimated 1RM is the primary chart line (main visual)
- Max weight and total volume available as secondary metrics via tabs or toggles below the chart
- Clean default with detail on demand — don't overwhelm the chart

### Exercise chart time range
- Default to last 3 months
- Switchable time ranges: 1M / 3M / 6M / 1Y / All
- Most data points visible at useful density for the default

### Exercise chart interaction
- Tappable data points showing tooltip with date, weight, reps, estimated 1RM
- Lets users inspect specific sessions from the chart view

### Dashboard progress summary card
- Combined card: top section shows current streak + recent PRs hit (exercise + weight), bottom section shows this week's stats (workouts completed, total volume)
- Includes small sparkline charts showing trend direction for key lifts — visual motivation without navigating to full charts

### Dashboard card ordering
- Today's Workout card first (action-oriented: what to do NOW)
- Progress summary card second
- Bodyweight card third
- PR baselines card merged into progress summary (not a separate card)

### Bodyweight logging
- Quick-log from a dashboard bodyweight card (latest value + mini trend + add button)
- Tapping the card opens a dedicated screen with full chart + log history + add entry
- Unit follows PR baseline unit (if user set PRs in lbs, bodyweight defaults to lbs)
- One decimal precision supported (e.g., 185.5 lbs)
- Bodyweight chart is its own section on the dashboard, separate from exercise progress charts — it's a different kind of metric

### Today's workout card — planned day
- Shows plan name, day label, and first 2-3 exercises with a "Start Workout" button
- Enough context to know what's coming without leaving the dashboard

### Today's workout card — rest day / no workout
- Shows "Rest day" message with next planned workout teaser (e.g., "Next: Push Day — Tomorrow")
- Includes freestyle "Quick Workout" button — acknowledges the day off but keeps the door open

### Today's workout card — no plan exists
- Offers both: "Create a plan" button (links to plan builder) and "Quick freestyle workout" button
- Choice without friction — new users aren't blocked from using the app immediately

### Today's workout card — tap behavior
- "Start Workout" button launches active workout directly (fastest path from dashboard)
- Tapping elsewhere on the card navigates to plan day detail for preview — both paths available

### Claude's Discretion
- Charting library selection (researcher will investigate options)
- Sparkline implementation approach
- Chart axis labeling and grid styling
- Streak calculation logic (consecutive days? weekly adherence?)
- Progress summary card layout details
- Bodyweight input modal/sheet design
- Transition animations between dashboard and detail views
- How to determine "today's workout" from plan day assignments

</decisions>

<specifics>
## Specific Ideas

- Dark & bold aesthetic consistent with Phases 1-5 (dark backgrounds, clean typography, accent colors)
- Dashboard should feel like opening the app and immediately knowing: what to do today + how you're progressing
- Sparklines give a quick visual "am I trending up?" signal without tapping into full charts
- Today's workout card is the primary action point — biggest card, most prominent position
- Bodyweight card on dashboard enables habit of daily weigh-ins without navigating away from home

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/Card.tsx`: Card component for all dashboard cards
- `src/components/ui/Button.tsx`: Button for Start Workout, Quick Workout, Create Plan CTAs
- `src/components/ui/Input.tsx`: Adapt for bodyweight numeric input
- `app/(app)/(tabs)/dashboard.tsx`: Existing dashboard shell with placeholder cards to upgrade
- `src/constants/theme.ts`: Dark theme colors (background #0a0a0a, surface #1a1a1a, accent #3b82f6)
- `src/stores/authStore.ts`: Zustand + MMKV pattern for new bodyweight store
- Bottom sheet pattern (Phase 2): potential use for bodyweight quick-log input

### Established Patterns
- StyleSheet.create for all styling (no NativeWind className)
- Expo Router file-based routing: `app/(app)/(tabs)/` for tab screens
- Zustand + MMKV for state management
- Supabase migrations in `supabase/migrations/` for schema changes
- Card-based list UI pattern (Phase 2, Phase 3, Phase 5)
- TanStack Query for data fetching (if established in Phase 4/5)
- useFocusEffect for refreshing data when screen gains focus

### Integration Points
- Dashboard tab: replace placeholder cards with real data-driven cards
- Supabase: query set_logs for chart data (1RM stored per-set from Phase 5)
- New bodyweight_logs table needed (user_id, weight, unit, logged_at)
- Plan store: read active plan + today's day assignment for Today's Workout card
- PR baselines: merge into progress summary card (currently separate PRCard component)
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
