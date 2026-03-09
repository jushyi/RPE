# Phase 5: Workout History - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can review every past workout session in a scrollable log and see estimated 1RM calculations. Includes session list, session detail view, delete session/set capability, and Epley 1RM calculation + storage. No progress charts, no body metrics — those are Phase 6+.

</domain>

<decisions>
## Implementation Decisions

### Session list display
- Reverse chronological order (most recent at top)
- Each session card shows: date, exercise names (truncated with "+N more" after 2), total volume, PR badge/count if any PRs were hit
- Empty state: friendly message + CTA button to start a workout (consistent with Phase 2/3 empty state patterns)

### Session detail view
- Card-per-exercise layout (reuses Card component, consistent with app-wide card-based UI)
- Detail header matches Phase 4 post-session stats card: date, duration, total volume, exercise count, PR count
- Inline delta indicators showing +/- weight and reps vs previous session for the same plan day
- Users can delete entire sessions or individual sets within a session (with confirmation dialogs)

### 1RM calculation & display
- Estimated 1RM calculated via Epley formula on set log
- 1RM values stored in database per-set for Phase 6 chart use (no on-the-fly recalculation needed)
- 1RM display is opt-in per exercise — reuses Phase 4's "Track PRs" toggle (if PRs are tracked, 1RM is shown)
- For opted-in exercises, best estimated 1RM for that session shown in the exercise card header (not per-set rows)

### Navigation & access
- History lives as a sub-tab within the Plans bottom tab (not a separate bottom tab)
- Plans tab has two swipeable pages: "Plans" (active plans) and "History" (past sessions)
- Tab indicators at top with swipe left/right navigation between views
- History shows all sessions by default with a plan filter to narrow by specific plan or show freestyle-only

### Claude's Discretion
- Swipeable page implementation details and animation
- Tab indicator styling
- Delta indicator visual treatment (color-coded up/down arrows, etc.)
- Plan filter UI (dropdown, chip bar, etc.)
- Confirmation dialog wording for delete actions
- Card layout spacing and typography within session detail
- How freestyle sessions are labeled in the list

</decisions>

<specifics>
## Specific Ideas

- Dark & bold aesthetic consistent with Phases 1-4 (dark backgrounds, clean typography, accent colors)
- Session detail header mirrors Phase 4 post-session summary — user sees the same stats in both contexts
- Delta indicators give a quick "did I improve?" signal without needing charts (Phase 6)
- 1RM in exercise card header keeps the detail view scannable without per-set noise

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/Card.tsx`: Card component for session list items and exercise detail cards
- `src/components/ui/Button.tsx`: Button component for empty state CTA, delete actions
- `src/stores/authStore.ts`: Zustand + MMKV persistence pattern to follow for history state
- Exercise library component (Phase 2): pattern reference for list with filter
- Bottom sheet pattern (Phase 2): potential use for plan filter or delete confirmations

### Established Patterns
- StyleSheet.create for all styling (no NativeWind className)
- Expo Router file-based routing: `app/(app)/(tabs)/` for tab screens
- Zustand + MMKV for state management
- Supabase migrations in `supabase/migrations/` for schema changes
- Database types in `src/lib/supabase/types/database.ts`
- Card-based list UI pattern (Phase 2 exercise library, Phase 3 plan list)
- Empty state with CTA pattern (Phase 2, Phase 3)

### Integration Points
- Plans tab: add swipeable sub-tab navigation (Plans | History)
- Supabase: query workout_sessions, session_exercises, set_logs tables (created in Phase 4)
- Add estimated_1rm column to set_logs table or separate 1rm_estimates table
- PR tracking toggle on exercises (Phase 4): determines which exercises show 1RM
- TanStack Query for data fetching with Supabase nested selects
- Phase 4 session completion: sessions saved here become history entries

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-workout-history*
*Context gathered: 2026-03-09*
