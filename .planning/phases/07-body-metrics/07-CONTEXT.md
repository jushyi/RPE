# Phase 7: Body Metrics - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can track body composition changes via body measurements (chest, waist, hips, body fat %). No progress photos — removed from scope. The Phase 6 bodyweight dashboard card is expanded into a combined body card that also shows measurements, with a full body metrics detail screen accessible from it.

</domain>

<decisions>
## Implementation Decisions

### Measurement set
- Core 4 measurements: chest, waist, hips, body fat %
- Circumference measurements support inches or cm via per-input unit selector (consistent with Phase 6 bodyweight pattern)
- Body fat % is unitless (percentage)

### Measurement entry form
- All-at-once form showing all 4 measurement fields plus bodyweight
- User fills in whichever fields they want, leaves others blank
- Date picker for entry date (defaults to today)
- Unit selector shown on every numeric input

### Combined dashboard card
- Merges with Phase 6 bodyweight card into a single "Body" card on dashboard
- Shows latest bodyweight + latest measurement values (compact) + sparkline for bodyweight trend
- Tap to open full body metrics detail screen

### Full body metrics detail screen
- Two tabs within the screen:
  - **Charts tab**: Entry form at top for logging new measurements, per-measurement trend charts below (bodyweight, chest, waist, hips, body fat % — each gets its own chart). Bodyweight chart included here alongside measurements.
  - **History tab**: Reverse-chronological list of past measurement entries with date and filled values
- Can edit/delete existing entries from history tab (with confirmation dialog, consistent with Phase 5 pattern)

### Navigation
- No new bottom tab — body metrics accessed from the combined dashboard card
- Full detail screen is a stack screen (not a tab), navigated to from dashboard

### Claude's Discretion
- Chart library reuse from Phase 6 for measurement trend charts
- Measurement form field ordering and layout
- Combined card layout and sparkline implementation
- Empty state copy when no measurements logged
- How bodyweight quick-add integrates with the combined card (Phase 6 designed a quick-add button)
- Chart time range controls (reuse Phase 6 pattern or simplify)

</decisions>

<specifics>
## Specific Ideas

- Unit selector on every measurement input — same pattern as bodyweight in Phase 6, never infer units
- Dashboard card is the single entry point — no separate tab, keeps navigation simple
- Full screen has form + charts on first tab (log and see trends together), history as second tab
- Bodyweight data consolidates into this screen — dashboard card becomes the unified body data card

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/Card.tsx`: Card component for dashboard body card
- `src/components/ui/Button.tsx`: Button for log measurement CTA
- `src/components/ui/Input.tsx`: Numeric input for measurement values
- `src/constants/theme.ts`: Dark theme colors (background #0a0a0a, surface #1a1a1a, accent #3b82f6)
- Phase 6 bodyweight card: base to expand into combined body card
- Phase 6 chart patterns: reuse for per-measurement trend charts
- Phase 5 swipeable sub-tab pattern: reuse for Charts | History tabs in detail screen

### Established Patterns
- StyleSheet.create for all styling (no NativeWind className)
- Expo Router file-based routing: `app/(app)/` for stack screens
- Zustand + MMKV for state management
- Supabase migrations in `supabase/migrations/` for schema changes
- Card-based list UI pattern throughout app
- useFocusEffect for refreshing data when screen gains focus

### Integration Points
- Dashboard: expand Phase 6 bodyweight card into combined body card
- New stack screen: `app/(app)/body-metrics.tsx` (or similar) for full detail view
- New Supabase table: `body_measurements` (user_id, chest, waist, hips, body_fat_pct, units, measured_at)
- Phase 6 bodyweight_logs table: queried alongside measurements for unified body view
- Phase 6 chart infrastructure: reuse for measurement trend charts

</code_context>

<deferred>
## Deferred Ideas

- Progress photos (front/side/back with Supabase Storage) — removed from Phase 7, could be a future phase if desired

</deferred>

---

*Phase: 07-body-metrics*
*Context gathered: 2026-03-10*
