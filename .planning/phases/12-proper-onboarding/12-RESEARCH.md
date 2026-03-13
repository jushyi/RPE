# Phase 12: Proper Onboarding - Research

**Researched:** 2026-03-12
**Domain:** React Native multi-step onboarding flow (PagerView, Zustand, Supabase)
**Confidence:** HIGH

## Summary

This phase replaces the current single-screen PR baseline onboarding with a 4-step flow: Units > PR Baselines > Body Stats > First Plan Prompt. The codebase already has all the building blocks: `react-native-pager-view` (used in workout focus, body metrics, and plans tabs), progress dots pattern (ExercisePager), unit toggle components (PRBaselineForm UnitToggle, PreferencesSection SegmentedToggle), body measurement saving hooks (useBodyMeasurements, useBodyweightData), and the PR baseline hook (usePRBaselines). The authStore already has `preferredUnit`, `preferredMeasurementUnit`, `hasCompletedOnboarding`, and `setOnboardingComplete`.

The root layout (`app/_layout.tsx` line 65-66) already routes unauthenticated-but-onboarding-incomplete users to `/(app)/onboarding/pr-baseline`. This routing logic needs updating to point to the new multi-step flow entry point. The existing `onboarding/_layout.tsx` is a simple Stack layout that will be replaced with a single-screen PagerView approach.

**Primary recommendation:** Build the onboarding as a single screen with PagerView containing 4 pages, reusing the exact dot progress pattern from ExercisePager, the SegmentedToggle pattern from PreferencesSection for the unit step, adapted PRBaselineForm logic for the PR step, and adapted MeasurementForm field patterns for the body stats step.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 4 steps in order: Units > PR Baselines > Body Stats Baseline > First Plan Prompt
- No welcome/intro screen -- jump straight into first data-collection step
- First plan prompt is LAST step -- nudges user to existing plan builder, does not block onboarding completion
- First plan prompt shows explanation of how plans work, then button to plan creation flow; skip completes onboarding to dashboard
- Unit Preferences Step (Step 1): Single screen with two toggle rows (kg/lbs and in/cm), NOT skippable
- PR Baselines Step (Step 2): Big 3 lifts only (bench, squat, deadlift), skippable, unit toggle defaults to Step 1 choice, full replacement of old screen
- Body Stats Baseline Step (Step 3): Bodyweight + measurements (chest, waist, biceps, quad), individual fields can be empty, skippable, unit toggles default to Step 1 choice
- First Plan Prompt Step (Step 4): Explains plans, "Create Your First Plan" button to existing builder, skippable (completes onboarding), after plan creation completes onboarding finishes to dashboard
- Horizontal swipe between steps (PagerView) plus Next/Skip buttons
- Step dots progress indicator at top showing current position
- Back navigation via swipe-back or back button
- Per-step skip (each step has own Skip except Step 1 which is required)
- No dashboard reminders for skipped steps
- Users with hasCompletedOnboarding: true NOT shown new flow
- Only brand-new sign-ups see new onboarding
- No migration or reset of existing users' onboarding state

### Claude's Discretion
- Visual design of step dots indicator
- Exact layout and styling of each step screen
- Animation transitions between steps
- How the "first plan prompt" screen is worded and laid out
- Whether PRBaselineForm component internals are reused or rewritten

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-pager-view | 8.0.0 | Horizontal swipe navigation between onboarding steps | Already used in workout focus, body metrics, and plans -- consistent UX |
| zustand + MMKV | Current | Persist onboarding state and unit preferences | Existing pattern for all stores in the app |
| @expo/vector-icons (Ionicons) | Current | Icons for step screens | Project convention -- no emojis per CLAUDE.md |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-router | Current | Navigation between onboarding and plan builder | Route to `/(app)/plans/create` from Step 4 |
| expo-haptics | Current | Feedback on step completion | Already used in plan toggle and measurement save |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PagerView | ScrollView with paging | PagerView already established in codebase; native gesture handling |
| Single-screen PagerView | Stack navigation between screens | PagerView gives swipe + dots pattern for free; consistent with workout/metrics |

**Installation:** No new packages needed. Everything is already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/(app)/onboarding/
  _layout.tsx           # Stack layout (already exists, keep as-is)
  index.tsx             # NEW: main onboarding screen with PagerView (replaces pr-baseline as entry)
  pr-baseline.tsx       # KEEP for edit mode only (dashboard PR editing)
src/features/onboarding/
  components/
    OnboardingPager.tsx       # PagerView wrapper with dots + navigation buttons
    StepDots.tsx              # Reusable step dots indicator (extracted from ExercisePager pattern)
    UnitPreferencesStep.tsx   # Step 1: weight unit + measurement unit toggles
    PRBaselineStep.tsx        # Step 2: Big 3 lift entry (adapted from PRBaselineForm)
    BodyStatsStep.tsx         # Step 3: bodyweight + chest/waist/biceps/quad
    FirstPlanPromptStep.tsx   # Step 4: plan explanation + CTA button
```

### Pattern 1: PagerView with Controlled Navigation
**What:** Single PagerView with ref-based page switching, matching ExercisePager pattern
**When to use:** All step transitions
**Example:**
```typescript
// Source: ExercisePager.tsx (existing codebase pattern)
const pagerRef = useRef<PagerView>(null);
const [currentStep, setCurrentStep] = useState(0);

const goNext = () => {
  if (currentStep < TOTAL_STEPS - 1) {
    pagerRef.current?.setPage(currentStep + 1);
  }
};

const goBack = () => {
  if (currentStep > 0) {
    pagerRef.current?.setPage(currentStep - 1);
  }
};

<PagerView
  ref={pagerRef}
  style={{ flex: 1 }}
  initialPage={0}
  onPageSelected={(e) => setCurrentStep(e.nativeEvent.position)}
  scrollEnabled={true}
>
  {/* Step pages */}
</PagerView>
```

### Pattern 2: SegmentedToggle for Unit Selection
**What:** Reuse the SegmentedToggle pattern from PreferencesSection for Step 1
**When to use:** Step 1 unit preference selection
**Example:**
```typescript
// Source: PreferencesSection.tsx (existing codebase pattern)
// Either extract SegmentedToggle to shared component or duplicate locally
<SegmentedToggle
  options={[
    { label: 'lbs', value: 'lbs' },
    { label: 'kg', value: 'kg' },
  ]}
  value={weightUnit}
  onChange={setWeightUnit}
/>
```

### Pattern 3: Step 4 Navigation to Plan Builder
**What:** Navigate to plan creation and detect return to complete onboarding
**When to use:** Step 4 "Create Your First Plan" button
**Example:**
```typescript
// Navigate to plan creation
router.push('/(app)/plans/create');
// On return (or skip), complete onboarding:
setOnboardingComplete();
router.replace('/(app)/(tabs)/dashboard');
```

### Anti-Patterns to Avoid
- **Stack navigation between steps:** Don't use separate routes for each step -- PagerView gives swipe continuity
- **Blocking onboarding on Step 4:** Plan creation is optional. Never require it to complete onboarding
- **Saving units only on PR save:** Step 1 must save units to authStore immediately when user taps Next, not when PR baselines are saved
- **Reusing MeasurementForm directly:** It has date picker, edit mode, and "at least one field required" validation that don't apply to onboarding. Adapt the field layout pattern instead

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal swipe paging | Custom ScrollView paging | react-native-pager-view | Already in project, native gesture handling |
| Step progress dots | Custom animated indicators | Simple View dots (ExercisePager pattern) | Proven pattern, 20 lines of code |
| Unit toggle UI | New toggle component | SegmentedToggle pattern from PreferencesSection | Consistent visual language |
| PR baseline saving | New Supabase calls | usePRBaselines hook | Already handles upsert, error handling, loading state |
| Body measurement saving | Direct Supabase calls | useBodyMeasurements.addMeasurement | Already handles temp IDs, optimistic updates |
| Bodyweight saving | Direct Supabase calls | useBodyweightData.addEntry | Already handles temp IDs, optimistic updates |

**Key insight:** This phase is primarily UI composition, not data layer work. Every save operation already exists in a hook or store action. The work is building 4 step screens and wiring them into a PagerView.

## Common Pitfalls

### Pitfall 1: PagerView Scroll Lock on Step 1
**What goes wrong:** User swipes past Step 1 without selecting units, then subsequent steps have wrong defaults
**Why it happens:** PagerView allows free swiping by default
**How to avoid:** Set `scrollEnabled={false}` on PagerView when on Step 1 until units are selected (both weight and measurement). Or: since Step 1 is required, disable forward swiping until both toggles have been explicitly interacted with. Simpler approach: set defaults (lbs/in) and require explicit tap of Next button -- the defaults are already lbs/in in authStore so swipe-forward is harmless
**Warning signs:** Users reach PR baseline step with wrong unit defaults

### Pitfall 2: Step 4 Plan Builder Navigation Race
**What goes wrong:** User creates plan, plan builder navigates to plan detail, user goes back, onboarding state is ambiguous
**Why it happens:** Plan creation pushes new screens onto the stack; returning pops back to onboarding
**How to avoid:** After tapping "Create Your First Plan", mark onboarding as complete BEFORE navigating to plan builder. That way, if user creates a plan and the root layout guard re-evaluates, they go to dashboard not back to onboarding. Alternatively, use a flag in onboarding state to track "plan creation started"
**Warning signs:** User stuck in onboarding after creating a plan

### Pitfall 3: Root Layout Route Guard Update
**What goes wrong:** Old route guard still points to `/(app)/onboarding/pr-baseline` instead of new index
**Why it happens:** Root layout line 66 hardcodes the onboarding route
**How to avoid:** Update `app/_layout.tsx` line 66 to route to `/(app)/onboarding` (which resolves to index.tsx)
**Warning signs:** New users see old PR-only onboarding screen

### Pitfall 4: Existing PR Edit Mode Breaks
**What goes wrong:** Dashboard PR editing (which uses `pr-baseline.tsx?mode=edit`) stops working
**Why it happens:** If pr-baseline.tsx is deleted or modified for the new flow
**How to avoid:** Keep `pr-baseline.tsx` for edit mode. The new onboarding index.tsx is a separate screen. PR editing from dashboard continues to route to `pr-baseline?mode=edit`
**Warning signs:** Dashboard PR tap navigates to full onboarding instead of edit form

### Pitfall 5: Body Stats Saving Without Authentication Race
**What goes wrong:** Supabase calls fail because userId is not yet available
**Why it happens:** Onboarding runs immediately after sign-up; auth state may not be fully propagated
**How to avoid:** All existing hooks (usePRBaselines, useBodyMeasurements, useBodyweightData) already guard on userId. This is handled. But verify that userId is populated before Step 3 saves attempt
**Warning signs:** Silent save failures on body stats step

## Code Examples

### Step Dots Component (from ExercisePager)
```typescript
// Source: src/features/workout/components/ExercisePager.tsx lines 42-52, 67-85
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={dotStyles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            dotStyles.dot,
            index === current ? dotStyles.dotActive : dotStyles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}
```

### Unit Preferences Step Pattern
```typescript
// Source: PreferencesSection.tsx pattern adapted for onboarding
// Two SegmentedToggle rows: weight (kg/lbs) and measurement (in/cm)
// Next button saves to authStore and advances pager
const handleNext = () => {
  setPreferredUnit(weightUnit);
  setPreferredMeasurementUnit(measurementUnit);
  pagerRef.current?.setPage(1);
};
```

### Body Stats Step (Adapted from MeasurementForm)
```typescript
// Source: MeasurementForm.tsx FieldRow pattern (lines 282-322)
// Reuse FieldRow-style layout for bodyweight + 4 circumference fields
// No date picker needed (onboarding = today's date)
// No "at least one required" validation (step is fully skippable)
// Units default from authStore preferences set in Step 1
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single PR baseline screen | 4-step onboarding flow | Phase 12 | Better first-run experience, collects more baseline data |
| Units set implicitly by PR toggle | Explicit unit selection in Step 1 | Phase 12 | Users always have correct units before any data entry |

**Deprecated/outdated:**
- `app/(app)/onboarding/pr-baseline.tsx` as onboarding entry point: Will be replaced by `index.tsx` for new users (kept for edit mode)
- Root layout route to `/(app)/onboarding/pr-baseline`: Must change to `/(app)/onboarding`

## Open Questions

1. **Step 4 plan builder return detection**
   - What we know: Plan creation routes to `/(app)/plans/create` which is a Stack screen. After creation, it navigates to the plan detail screen.
   - What's unclear: How does the user return from plan creation to complete onboarding? Does the back stack include onboarding?
   - Recommendation: Mark onboarding complete BEFORE navigating to plan builder. This way, when root layout guard re-evaluates after plan creation, user goes to dashboard. No need to "return" to onboarding.

2. **PagerView swipe control on required Step 1**
   - What we know: Step 1 is not skippable -- user must choose units. PagerView allows free swiping.
   - What's unclear: Should swiping be disabled until Next is tapped, or is the default lbs/in acceptable as implicit selection?
   - Recommendation: Allow swiping (defaults are sensible lbs/in). The Next button explicitly saves. If user swipes forward, they can swipe back. The key constraint is they MUST set units, which the defaults satisfy. Add a visual emphasis on the Next button to encourage explicit selection.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 55 |
| Config file | package.json (jest config section) |
| Quick run command | `npx jest --bail --testPathPattern onboarding` |
| Full suite command | `npx jest --bail` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OB-01 | Unit preferences saved to authStore from Step 1 | unit | `npx jest --bail --testPathPattern onboarding` | No - Wave 0 |
| OB-02 | PR baselines saved via usePRBaselines on Step 2 | unit | `npx jest --bail --testPathPattern onboarding` | No - Wave 0 |
| OB-03 | Body stats saved via existing hooks on Step 3 | unit | `npx jest --bail --testPathPattern onboarding` | No - Wave 0 |
| OB-04 | Onboarding completes and routes to dashboard | unit | `npx jest --bail --testPathPattern onboarding` | No - Wave 0 |
| OB-05 | Existing users bypass new onboarding | manual-only | N/A | N/A - route guard logic in root layout |
| OB-06 | PR edit mode from dashboard still works | manual-only | N/A | N/A - navigation flow test |

### Sampling Rate
- **Per task commit:** `npx jest --bail --testPathPattern onboarding`
- **Per wave merge:** `npx jest --bail`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- No existing test files for onboarding (current codebase has zero test files in src/)
- Test infrastructure exists (Jest + testing-library configured) but no tests have been written for any feature
- Given the project pattern of zero tests, Wave 0 testing is likely not practical for this phase
- Manual validation is the established pattern for this project

## Sources

### Primary (HIGH confidence)
- `src/features/workout/components/ExercisePager.tsx` - PagerView + dots pattern (direct codebase)
- `src/features/settings/components/PreferencesSection.tsx` - SegmentedToggle pattern (direct codebase)
- `src/stores/authStore.ts` - Auth state shape with unit preferences (direct codebase)
- `src/features/auth/components/PRBaselineForm.tsx` - PR baseline form pattern (direct codebase)
- `src/features/body-metrics/components/MeasurementForm.tsx` - Body measurement field pattern (direct codebase)
- `src/features/body-metrics/hooks/useBodyMeasurements.ts` - Measurement saving hook (direct codebase)
- `src/features/progress/hooks/useBodyweightData.ts` - Bodyweight saving hook (direct codebase)
- `app/_layout.tsx` - Root layout route guard (direct codebase)

### Secondary (MEDIUM confidence)
- react-native-pager-view v8 API - used in 3 places in codebase, API well established

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use in the codebase
- Architecture: HIGH - pattern directly copies ExercisePager + PreferencesSection patterns
- Pitfalls: HIGH - based on direct code reading of route guard and navigation patterns

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- all dependencies already locked in project)
