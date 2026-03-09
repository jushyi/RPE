# Phase 4: Active Workout - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Live workout session in focus mode — logging sets with large tap targets, previous performance inline, instant PR flags, offline-first writes. Users can start from a plan day or freestyle. Plans are templates that pre-fill the session; logged actuals are separate entities. No workout history browsing, no progress charts — those are Phase 5+.

</domain>

<decisions>
## Implementation Decisions

### Session start flow
- Plan-based: tap a plan day in the Plans tab detail view to launch that workout directly
- Freestyle: start an empty session and add exercises one at a time using the exercise library picker as you go
- Freestyle entry available from both Dashboard ("Quick Workout" button) and Plans tab
- Mid-session flexibility: users can skip, reorder, and add exercises during any workout — plan is a starting template, not a locked sequence

### Focus mode layout
- Card-per-set design: exercise name at top, each set is a full-width card with oversized weight/reps inputs
- Swipe set card away to log it — reveals next set card (satisfying gesture-based logging)
- Navigate between exercises by swiping left/right (horizontal page-style navigation with progress dots)
- Pre-fill behavior determined per-exercise by the plan's weight_progression setting (Phase 3):
  - 'manual' exercises pre-fill from plan target weight
  - 'carry_previous' exercises pre-fill from last session's actual values
  - Freestyle exercises have no pre-fill (blank inputs)

### PR detection & celebration
- PR tracking on Big 3 by default (baselines from Phase 1), plus user-opted exercises
- PR opt-in lives in the exercise library (Phase 2) — global "Track PRs" toggle per exercise
- PR metric: max weight ever lifted for that exercise (any rep count)
- First time logging a PR-tracked exercise sets its baseline automatically
- Full-screen celebration overlay when a PR set is logged (brief, bold, unmissable)

### Session completion
- Stats card summary after finishing: duration, total volume (weight × reps), exercises completed, PRs hit
- Post-session weight target prompt: for exercises with weight_progression = 'manual', prompt "What weight next week?" per exercise after session ends — user sets an explicit target that pre-fills next session
- Exercises with weight_progression = 'carry_previous' skip the prompt — next session auto-fills from this session's actuals
- End early with confirmation: "You have X exercises remaining. End anyway?" — saves all completed sets
- No discard option — once sets are logged, they're saved (delete individual sessions in History, Phase 5)
- Crash recovery: on relaunch, detect unfinished session and prompt "Resume or start fresh?"

### Claude's Discretion
- Swipe gesture thresholds and card animation details
- Progress dots design for exercise navigation
- Stats card visual layout
- PR celebration overlay design (confetti, bold text, animation style)
- Crash recovery prompt design
- Set card completed state visual treatment
- Keyboard behavior for weight/reps numeric inputs

</decisions>

<specifics>
## Specific Ideas

- Dark & bold aesthetic consistent with Phases 1-3 (dark backgrounds, clean typography, accent colors)
- Card-per-set + swipe-to-log should feel physical and satisfying — the core daily interaction
- PR celebrations should feel like a genuine reward moment — full-screen, brief, bold
- Previous performance shown inline (WORK-04) must be visible without extra taps — the user needs this context while logging

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/Card.tsx`: Card component — adapt for set cards with oversized inputs
- `src/components/ui/Button.tsx`: Button component for session controls (End Workout, etc.)
- `src/components/ui/Input.tsx`: Input component — adapt for oversized weight/reps fields
- `src/stores/authStore.ts`: Zustand + MMKV persistence pattern to follow for workout session state
- Exercise library component (Phase 2): reuse as picker for freestyle exercise addition
- Bottom sheet pattern (Phase 2): established for exercise picker

### Established Patterns
- StyleSheet.create for all styling (no NativeWind className)
- Expo Router file-based routing: `app/(app)/(tabs)/` for tab screens
- Zustand + MMKV for offline-first state persistence
- Supabase migrations in `supabase/migrations/` for schema changes
- Database types in `src/lib/supabase/types/database.ts` — extend with workout session tables
- Per-exercise unit override pattern (Phase 1 PR baselines, Phase 3 plan builder)

### Integration Points
- Plans tab: plan day tap launches active workout screen (new route, likely `app/(app)/workout/`)
- Dashboard: "Quick Workout" button launches freestyle session
- Supabase schema: new tables for workout_sessions, session_exercises, set_logs
- RLS: users can only read/write their own workout sessions
- PR baselines table: read for comparison, update when new PR detected
- Exercise library picker: reuse in freestyle mode for adding exercises mid-session
- MMKV: persist active session state for crash recovery
- Phase 3 plan_day_exercises: read weight_progression setting to determine pre-fill source

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-active-workout*
*Context gathered: 2026-03-09*
