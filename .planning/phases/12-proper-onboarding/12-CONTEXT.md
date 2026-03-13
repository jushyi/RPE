# Phase 12: Proper Onboarding - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the current minimal post-signup onboarding (PR baselines only) with a multi-step onboarding flow that collects user preferences, baseline data, and guides users toward creating their first workout plan. Existing users who completed old onboarding are unaffected.

</domain>

<decisions>
## Implementation Decisions

### Onboarding Steps (in order)
- 4 steps: Units > PR Baselines > Body Stats Baseline > First Plan Prompt
- No welcome/intro screen — jump straight into the first data-collection step after sign-up + email confirmation
- First plan prompt is the LAST step — nudges user to the existing plan builder, does not block onboarding completion
- First plan prompt shows explanation of how plans work, then a button to the plan creation flow; if they skip, onboarding completes and they go to dashboard

### Unit Preferences Step (Step 1)
- Single screen with two toggle rows: weight unit (kg/lbs) and measurement unit (in/cm)
- This step is NOT skippable — user must choose units before proceeding
- Sets both `preferredUnit` and `preferredMeasurementUnit` in authStore

### PR Baselines Step (Step 2)
- Keep Big 3 lifts only: bench press, squat, deadlift
- Skippable — user can skip without entering any values
- Unit toggle should default to the unit chosen in Step 1
- Full replacement of the old pr-baseline screen (new screen built as part of the onboarding flow)

### Body Stats Baseline Step (Step 3)
- Collects bodyweight + measurements (chest, waist, biceps, quad)
- Individual fields can be left empty — only filled fields are saved
- Skippable — user can skip the entire step
- Unit toggles default to units chosen in Step 1
- Saves via existing bodyweightStore and bodyMeasurementStore

### First Plan Prompt Step (Step 4)
- Explains what plans are and why they matter
- "Create Your First Plan" button navigates to existing plan builder
- Skippable — this is the final step, skipping completes onboarding and goes to dashboard
- After plan creation completes, onboarding finishes and user lands on dashboard

### Flow Structure
- Horizontal swipe between steps (PagerView) plus Next/Skip buttons
- Step dots progress indicator at the top showing current position
- Back navigation via swipe-back or back button
- Per-step skip (each step has its own Skip except Step 1 units which is required)
- No dashboard reminders for skipped steps — skipped means skipped

### Existing Users
- Users with `hasCompletedOnboarding: true` are NOT shown the new flow
- Only brand-new sign-ups see the new onboarding
- No migration or reset of existing users' onboarding state

### Claude's Discretion
- Visual design of step dots indicator
- Exact layout and styling of each step screen
- Animation transitions between steps
- How the "first plan prompt" screen is worded and laid out
- Whether PRBaselineForm component internals are reused or rewritten

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PRBaselineForm` (src/features/auth/components/PRBaselineForm.tsx): Current PR baseline form with unit toggles — being fully replaced but logic/patterns can inform the new PR step
- `UnitToggle` component inside PRBaselineForm: Reusable kg/lbs toggle pattern
- `MeasurementForm` (used in body metrics): Existing body measurement entry form
- `PagerView`: Already used in workout focus mode and body metrics detail — consistent swipe pattern
- `Button`, `Input` components (src/components/ui/): Standard UI components
- `SegmentedToggle` in settings PreferencesSection: Unit toggle pattern

### Established Patterns
- Zustand + MMKV for persisted state (authStore has `hasCompletedOnboarding`, `preferredUnit`, `preferredMeasurementUnit`)
- Stack-based navigation in onboarding layout (`app/(app)/onboarding/_layout.tsx`)
- Dark/bold aesthetic with `colors` from theme.ts
- StyleSheet.create for all component styles (no NativeWind)

### Integration Points
- `authStore.setOnboardingComplete()`: Called when onboarding finishes
- `authStore.setPreferredUnit()` and `authStore.setPreferredMeasurementUnit()`: Unit preference setters
- `bodyweightStore.addEntry()`: For saving initial bodyweight
- `bodyMeasurementStore`: For saving initial body measurements
- Root layout route guard (`app/_layout.tsx` line 65): Routes to onboarding if `!hasCompletedOnboarding`
- Plan builder navigation: `/(app)/plans/create` or equivalent existing route

</code_context>

<specifics>
## Specific Ideas

- First plan prompt should be last step so navigation to plan builder doesn't break the onboarding flow
- User wants PagerView swipe navigation (consistent with workout and body metrics screens)
- Per-step skip with units being the only required step
- Body stats step should allow partial entry (any individual field can be left empty)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-proper-onboarding*
*Context gathered: 2026-03-12*
