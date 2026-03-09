# Phase 2: Exercise Library - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Pre-loaded exercise database (~30-40 core exercises), custom exercise creation with CRUD, and a searchable/filterable exercise library screen. This is the foundational data layer that all plans and workout sessions reference. No plan builder, no workout logging — those are Phase 3+.

</domain>

<decisions>
## Implementation Decisions

### Seed data scope
- ~30-40 core essential exercises covering major compound and common isolation lifts
- Organized by detailed muscle groups (Biceps, Triceps, Quads, Hamstrings, Lats, Delts, Chest, Glutes, Calves, Core, Traps, Forearms, etc.)
- Equipment type is a required field: Barbell, Dumbbell, Cable, Machine, Bodyweight, etc.
- Data model: global seed exercises (user_id = null) + user-owned custom exercises, merged in the library view
- Delivered via Supabase migration (seed SQL)

### Library browsing UX
- Search bar at top for text search by name
- Two rows of horizontal scrollable filter chips: muscle groups on top, equipment types below
- Filters are combinable (e.g., Chest + Dumbbell shows only chest dumbbell exercises)
- Search narrows results within active filters
- Custom exercises show a subtle "Custom" badge to distinguish from seed exercises
- Navigation: dedicated tab in bottom navigation for standalone browsing, plus the same component reused as an inline picker in Phase 3's plan builder

### Custom exercise creation
- Bottom sheet modal (slides up from bottom, stays in context of library)
- Fields: name (required), muscle group (required picker), equipment type (required picker), notes (optional freeform)
- Duplicate name validation: warn if name matches existing exercise, but allow saving anyway
- Full CRUD: edit reopens bottom sheet pre-filled, delete via swipe or long-press menu
- Custom exercises persist to Supabase with user_id and sync across devices

### Exercise detail display
- List items show: exercise name (primary text), muscle group (subtitle), equipment badge (chip)
- No detail view in Phase 2 — list is the full view (detail screens added in Phase 5+ when history/charts exist per exercise)
- Muscle group badges are color-coded (each muscle group gets a distinct accent color for quick visual scanning)
- Equipment badges use a neutral/uniform style
- Empty/filter-no-results state: friendly illustration + message + prominent "Add Exercise" button

### Claude's Discretion
- Exact muscle group color assignments
- Filter chip styling and scroll behavior
- Bottom sheet animation and dismiss behavior
- Specific seed exercise selection within the ~30-40 target
- List item spacing, typography, and Card component adaptation
- Swipe vs long-press menu implementation for edit/delete

</decisions>

<specifics>
## Specific Ideas

- Dark & bold aesthetic consistent with Phase 1 (dark backgrounds, clean typography, accent colors that pop)
- Library component should be designed for reuse as both a standalone tab screen and an exercise picker in plan builder (Phase 3)
- Color-coded muscle group badges provide quick visual scanning — should feel functional, not decorative

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/Card.tsx`: Card component for exercise list items
- `src/components/ui/Button.tsx`: Button component for actions (Add Exercise, etc.)
- `src/components/ui/Input.tsx`: Input component for search bar and form fields
- `src/stores/authStore.ts`: Zustand store pattern to follow for exercise state
- `src/lib/supabase/`: Supabase client setup, can extend with exercise queries

### Established Patterns
- StyleSheet.create for all styling (NativeWind className was converted away in Phase 1)
- Expo Router file-based routing (app/(app)/(tabs)/ for tab screens)
- Supabase migrations in supabase/migrations/ for schema changes
- Database types in src/lib/supabase/types/database.ts — extend with exercises table

### Integration Points
- Bottom tab navigator: add Exercise Library tab alongside existing Dashboard
- Supabase migration: new exercises table (id, name, muscle_group, equipment, notes, user_id nullable, timestamps)
- RLS policy: global exercises (user_id IS NULL) readable by all, custom exercises (user_id = auth.uid()) readable/writable only by owner
- database.ts types: add Exercise interface and extend Database type

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-exercise-library*
*Context gathered: 2026-03-09*
