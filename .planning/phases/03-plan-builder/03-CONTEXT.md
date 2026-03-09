# Phase 3: Plan Builder - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Create structured workout plans with named day slots (optionally mapped to weekdays), per-day exercise configuration with full detail (sets/reps/weight/RPE/notes), and plan CRUD. One active plan at a time. Plans are templates — editing a plan never alters previously logged workout sessions. No workout logging, no active session — those are Phase 4+.

</domain>

<decisions>
## Implementation Decisions

### Plan creation flow
- Single screen for plan creation: name at top, day slots below
- Day slots are flexible named slots (Day A, Day B, Day C) with optional weekday mapping (Mon/Tue/Wed)
- Optional weekday mapping connects naturally to Phase 8 alarms
- One active plan at a time — user can create multiple plans but only one drives dashboard and alarms
- Plan Builder lives in a dedicated bottom tab (alongside Dashboard and Exercise Library)

### Per-day exercise configuration
- Bottom sheet picker to add exercises — reuses the Phase 2 exercise library component with search/filter
- Inline row editing for each exercise: Set 1 [weight] [reps] [RPE], Set 2 [...], + Add Set
- Each exercise shows all sets with target weight, reps, RPE fields, plus a notes field
- Drag to reorder exercises within a training day
- Per-exercise unit override (defaults to user's profile kg/lbs preference, but each exercise can override) — consistent with Phase 1 PR baseline approach

### Plan list & navigation
- Card-based list with summary info: plan name, active badge, number of training days, day names/weekdays (reuses Card component)
- Long-press or dedicated button on plan card to set as active — active plan gets visual badge/highlight
- Empty state: friendly illustration + "Create your first workout plan" + prominent button (consistent with Phase 2 empty state)
- Plan detail view: scrollable all-days view with collapsible sections per day, all days visible in a single scroll

### Edit & delete behavior
- View/edit toggle: plan detail is read-only by default, tap "Edit" to enter edit mode where fields become editable
- Explicit save button — changes require tapping Save to persist, Cancel to discard
- Delete available from two places: swipe left on plan card in list + delete button inside plan editor
- Delete confirmation dialog with reassuring message: "Delete '[Plan Name]'? Past workouts logged with this plan will be kept."

### Per-exercise weight progression mode
- Each exercise in a plan has a weight_progression setting chosen on first add: 'manual' or 'carry_previous'
- 'manual': user sets a specific target weight for next week (explicit goal)
- 'carry_previous': system uses the weight from the previous week's logged session (auto-carry)
- Default to 'manual' on first add — user picks during exercise configuration
- This setting is stored per plan_day_exercise and drives future workout sessions

### Claude's Discretion
- Card styling and summary layout details
- Collapsible section animation and expand/collapse behavior
- Drag handle visual design and haptic feedback
- Bottom sheet sizing for exercise picker
- Day slot naming conventions and add/remove day UX
- Active plan badge design
- Exact form field layout within inline row editing

</decisions>

<specifics>
## Specific Ideas

- Dark & bold aesthetic consistent with Phase 1 and 2 (dark backgrounds, clean typography, accent colors)
- Exercise library picker reused as bottom sheet — same component, different presentation context (Phase 2 designed for this)
- Per-exercise unit override mirrors PR baseline approach from Phase 1 — consistent UX pattern
- Plan/actuals separation is a critical architectural concept — delete confirmation makes this visible to users

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/Card.tsx`: Card component for plan list items
- `src/components/ui/Button.tsx`: Button component for actions (Create Plan, Save, etc.)
- `src/components/ui/Input.tsx`: Input component for plan name and set fields
- `src/stores/authStore.ts`: Zustand store pattern to follow for plan state
- Exercise library component (Phase 2): designed for reuse as inline picker via bottom sheet

### Established Patterns
- StyleSheet.create for all styling (no NativeWind className)
- Expo Router file-based routing: `app/(app)/(tabs)/` for tab screens
- Supabase migrations in `supabase/migrations/` for schema changes
- Database types in `src/lib/supabase/types/database.ts` — extend with plan tables
- Bottom sheet modal pattern established in Phase 2 (custom exercise creation)
- Color-coded badges pattern from Phase 2 exercise library

### Integration Points
- Bottom tab navigator: add Plans tab alongside Dashboard and Exercise Library
- Supabase schema: new tables for plans, plan_days, plan_day_exercises (with exercise_id FK to exercises table)
- RLS: users can only read/write their own plans
- Active plan concept needs a flag (is_active boolean or active_plan_id on profile)
- Exercise library picker component reused in bottom sheet context
- database.ts types: add Plan, PlanDay, PlanDayExercise interfaces

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-plan-builder*
*Context gathered: 2026-03-09*
