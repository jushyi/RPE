# Phase 15: Barbell Calculator Tab - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a new bottom tab with gym calculator utilities: plate loading visualizer, combined RPE/1RM calculator, and next-set RPE-based weight recommendations. All tools are standalone utilities with manual input — no coupling to active workout state.

</domain>

<decisions>
## Implementation Decisions

### Tab placement & navigation
- New 4th bottom tab between Plans and Settings
- Tab icon: Ionicons `calculator-outline`
- Tab title: "Calc" (short for tab bar)
- Three sub-tools organized via segmented tabs at top: Plates, RPE/1RM, Next Set
- Swipe between sub-tools enabled (PagerView) — consistent with Plans tab inner-tab pattern
- Tap segments also switches content

### Plate calculator
- Numeric keypad input for target weight (matches SetCard input pattern from active workouts)
- Bar weight: default 45 lb / 20 kg, configurable via dropdown with common bar presets (45lb Olympic, 35lb women's, 25lb EZ curl, etc.)
- Visual barbell diagram: horizontal bar with color-coded plates proportional to real sizes, plates shown per side
- Standard fixed plate set — no customization: 45, 35, 25, 10, 5, 2.5 lb (or kg equivalents: 25, 20, 15, 10, 5, 2.5, 1.25 kg)
- Unit handling follows user's preferred unit setting

### RPE & 1RM calculator
- Combined into one tool (not separate sections)
- User enters weight + reps, sees estimated 1RM using Epley formula (reuse existing `calculateEpley1RM` from `src/features/history/utils/epley.ts`)
- RPE output displayed as table grid: RPE x Reps matrix showing the weight for each combination based on the estimated 1RM
- Always starts blank — no auto-fill from workout history
- Epley formula only (no multi-formula selection)

### Next-set RPE recommendations
- Manual input only: user enters last set's weight, reps, and RPE felt
- User can adjust both target RPE and target reps for next set (supports back-off sets, drop sets, pyramid sets)
- Recommendation displayed as single card: recommended weight, percentage change from last set, brief logic explanation
- Recommended weight auto-rounds to nearest 5 lb / 2.5 kg (plate-loadable increment)

### Claude's Discretion
- Exact plate color scheme for the barbell diagram
- RPE percentage table values (standard Tuchscherer RPE chart or similar)
- Keyboard dismiss behavior and scroll handling
- Loading/empty states
- Exact segmented control styling

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `calculateEpley1RM` and `bestSessionE1RM` in `src/features/history/utils/epley.ts` — direct reuse for 1RM calculations
- `Card` component in `src/components/ui/Card.tsx` — for result cards
- `Button` component in `src/components/ui/Button.tsx` — for actions
- `Input` component in `src/components/ui/Input.tsx` — for text inputs
- `colors` theme constants in `src/constants/theme.ts` — dark theme palette
- `EQUIPMENT_TYPES` in `src/features/exercises/constants/equipmentTypes.ts` — includes 'Barbell' type
- RPE field already exists in plan target sets (`TargetSet.rpe: number | null`)

### Established Patterns
- Bottom tabs use `expo-router` Tabs with Ionicons, ActiveWorkoutBar above tab bar
- Inner tab pattern: segmented control + PagerView (used in Plans tab)
- Dark theme: `colors.surface`, `colors.surfaceElevated`, `colors.accent` for consistent styling
- Feature code organized in `src/features/{feature-name}/` with components, hooks, types, utils subdirs
- `StyleSheet.create` for all styling (no NativeWind)

### Integration Points
- Tab bar in `app/(app)/(tabs)/_layout.tsx` — add new Tabs.Screen
- New route directory: `app/(app)/(tabs)/calculator/` or similar
- New feature directory: `src/features/calculator/`
- User's preferred unit setting accessible for lb/kg toggling

</code_context>

<specifics>
## Specific Ideas

- Swipe between sub-tools must work like Plans tab inner tabs — established UX pattern in the app
- Barbell diagram should be visual and color-coded, not just a text list — readable at a glance while at the gym
- RPE table grid is the classic powerlifting reference chart format (RPE rows x rep count columns)
- Next-set recommendation should feel decisive: one number with explanation, not a vague range

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-add-barbell-calculator-tab-with-plate-loading-weight-calculations-rpe-1rm-calculators-and-next-set-rpe-recommendations*
*Context gathered: 2026-03-12*
