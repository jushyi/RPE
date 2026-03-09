# Phase 3: Plan Builder - Research

**Researched:** 2026-03-09
**Domain:** Workout plan CRUD with nested day/exercise schema, drag-to-reorder, bottom sheet picker
**Confidence:** HIGH

## Summary

Phase 3 builds the Plan Builder feature: users create named workout plans with flexible day slots (optionally mapped to weekdays), add exercises from the library to each day with full detail (sets/reps/weight/RPE/notes), and manage plans via list, detail, edit, and delete views. One plan can be marked "active" at a time.

The architecture follows the established project pattern exactly: Supabase migration for schema, RLS for ownership, Zustand + MMKV for local state, feature folder under `src/features/plans/`, and Expo Router file-based routing for screens. The key new libraries are `react-native-draggable-flatlist` for exercise reordering within days. The bottom sheet and gesture handler should already be installed from Phase 2 (`@gorhom/bottom-sheet` v5 + `react-native-gesture-handler` v2).

**Primary recommendation:** Use a three-table schema (workout_plans, plan_days, plan_day_exercises), a Zustand planStore with nested state, and reuse the Phase 2 exercise library components inside a BottomSheetModal for the exercise picker. Use `react-native-draggable-flatlist` for drag-to-reorder exercises within a day.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single screen for plan creation: name at top, day slots below
- Day slots are flexible named slots (Day A, Day B, Day C) with optional weekday mapping (Mon/Tue/Wed)
- Optional weekday mapping connects naturally to Phase 8 alarms
- One active plan at a time -- user can create multiple plans but only one drives dashboard and alarms
- Plan Builder lives in a dedicated bottom tab (alongside Dashboard and Exercise Library)
- Bottom sheet picker to add exercises -- reuses the Phase 2 exercise library component with search/filter
- Inline row editing for each exercise: Set 1 [weight] [reps] [RPE], Set 2 [...], + Add Set
- Each exercise shows all sets with target weight, reps, RPE fields, plus a notes field
- Drag to reorder exercises within a training day
- Per-exercise unit override (defaults to user's profile kg/lbs preference, but each exercise can override)
- Card-based list with summary info: plan name, active badge, number of training days, day names/weekdays (reuses Card component)
- Long-press or dedicated button on plan card to set as active -- active plan gets visual badge/highlight
- Empty state: friendly illustration + "Create your first workout plan" + prominent button (consistent with Phase 2 empty state)
- Plan detail view: scrollable all-days view with collapsible sections per day, all days visible in a single scroll
- View/edit toggle: plan detail is read-only by default, tap "Edit" to enter edit mode where fields become editable
- Explicit save button -- changes require tapping Save to persist, Cancel to discard
- Delete available from two places: swipe left on plan card in list + delete button inside plan editor
- Delete confirmation dialog with reassuring message: "Delete '[Plan Name]'? Past workouts logged with this plan will be kept."

### Claude's Discretion
- Card styling and summary layout details
- Collapsible section animation and expand/collapse behavior
- Drag handle visual design and haptic feedback
- Bottom sheet sizing for exercise picker
- Day slot naming conventions and add/remove day UX
- Active plan badge design
- Exact form field layout within inline row editing

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAN-01 | User can create a named workout plan | Plan creation screen with name input, planStore.createPlan(), Supabase INSERT to workout_plans table |
| PLAN-02 | User can assign training days (Mon/Tue/Wed etc.) to a plan | plan_days table with day_name + optional weekday columns, day slot UI with add/remove |
| PLAN-03 | User can add exercises to each training day from the exercise library | BottomSheetModal exercise picker reusing Phase 2 components, plan_day_exercises table with exercise_id FK |
| PLAN-04 | User can set target sets, reps, weight, RPE, and notes per exercise in the plan | plan_day_exercises stores target_sets JSONB array [{weight, reps, rpe}], plus notes and unit_override columns |
| PLAN-05 | User can edit and delete existing plans | View/edit toggle pattern, cascade deletes in Supabase, confirmation dialog |

</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0.11 | Plan state management | Already used for auth + exercise stores; same pattern |
| react-native-mmkv | ^4.2.0 | Persistent local cache for plans | Already used; named MMKV instance per store |
| @supabase/supabase-js | ^2.99.0 | Backend CRUD for plans | Already used; RLS policies for ownership |
| expo-router | ^55.0.4 | File-based routing for plan screens | Already used for tabs and auth screens |
| react-native-reanimated | 4.2.1 | Animations for collapsible sections | Already installed; used for connectivity banner |
| zod | ^4.3.6 | Plan form validation | Already used for auth forms |
| react-hook-form | ^7.71.2 | Plan name form management | Already used for auth; consistent pattern |

### Core (installed by Phase 2)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @gorhom/bottom-sheet | ^5 | Exercise picker bottom sheet | Installed in Phase 2 for custom exercise creation |
| react-native-gesture-handler | ^2 | Required for bottom sheet + drag | Installed in Phase 2 as peer dependency |

### New for Phase 3
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-draggable-flatlist | ^4 | Drag-to-reorder exercises within day | De facto standard for RN drag reorder; uses Reanimated + Gesture Handler (both already installed); works with Expo managed workflow |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-draggable-flatlist | Custom PanResponder reorder | Massive complexity for smooth drag UX; library handles edge cases (scroll, haptics, placeholder) |
| JSONB for target sets | Separate plan_day_exercise_sets table | JSONB is simpler for template data; sets are always read/written together; separate table only needed if sets are individually queried (they are not for plans) |
| Zustand planStore | React Query / SWR | Project already uses Zustand for all state; consistency matters more than caching sophistication at this scale |

**Installation (Phase 3 only):**
```bash
npx expo install react-native-draggable-flatlist
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  features/
    plans/
      components/
        PlanCard.tsx             # Card for plan list with active badge
        PlanDaySection.tsx       # Collapsible day section in detail view
        PlanExerciseRow.tsx      # Inline exercise row with sets
        SetRow.tsx              # Single set row (weight/reps/RPE inputs)
        ExercisePicker.tsx      # Bottom sheet wrapping exercise library
        PlanEmptyState.tsx      # Empty state for plan list
        DaySlotEditor.tsx       # Add/remove/rename day slots
      hooks/
        usePlans.ts             # CRUD operations bridging store + Supabase
        usePlanDetail.ts        # Load single plan with days + exercises
      types.ts                  # Plan, PlanDay, PlanDayExercise interfaces
      constants.ts              # Weekday options, default day names
app/
  (app)/
    (tabs)/
      plans.tsx                 # Plan list screen (new tab)
      _layout.tsx               # Updated to add Plans tab
    plans/
      create.tsx                # Plan creation screen
      [id].tsx                  # Plan detail/edit screen
```

### Pattern 1: Three-Table Schema
**What:** Normalized schema with `workout_plans` -> `plan_days` -> `plan_day_exercises`
**When to use:** Always -- this is the canonical way to model plans with days and exercises
**Example:**
```sql
-- workout_plans: top-level plan metadata
CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- plan_days: named day slots within a plan
CREATE TABLE public.plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL,           -- "Day A", "Push", "Upper Body", etc.
  weekday SMALLINT,                 -- 0=Sun, 1=Mon, ... 6=Sat; NULL if unmapped
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- plan_day_exercises: exercises assigned to a day with targets
CREATE TABLE public.plan_day_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id UUID NOT NULL REFERENCES public.plan_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  target_sets JSONB NOT NULL DEFAULT '[]',  -- [{weight: 135, reps: 8, rpe: 7}, ...]
  notes TEXT,
  unit_override TEXT,               -- 'kg' | 'lbs' | NULL (NULL = use profile default)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Pattern 2: Active Plan Enforcement (Database Trigger)
**What:** Ensure only one plan is active per user using a database trigger
**When to use:** When setting a plan as active
**Example:**
```sql
-- Before setting a plan active, deactivate all other plans for same user
CREATE OR REPLACE FUNCTION deactivate_other_plans()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.workout_plans
    SET is_active = false, updated_at = now()
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_active_plan
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION deactivate_other_plans();
```

### Pattern 3: Zustand Plan Store (following exerciseStore pattern)
**What:** Local state with MMKV persistence for plans
**When to use:** Always -- matches existing store pattern exactly
**Example:**
```typescript
// src/stores/planStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { Plan } from '@/features/plans/types';

const storage = createMMKV({ id: 'plan-storage' });
const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface PlanState {
  plans: Plan[];
  isLoading: boolean;
  lastFetched: number | null;
}

interface PlanActions {
  setPlans: (plans: Plan[]) => void;
  addPlan: (plan: Plan) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  removePlan: (id: string) => void;
  setActivePlan: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const usePlanStore = create<PlanState & PlanActions>()(
  persist(
    (set) => ({
      plans: [],
      isLoading: false,
      lastFetched: null,
      setPlans: (plans) => set({ plans, lastFetched: Date.now() }),
      addPlan: (plan) => set((s) => ({ plans: [...s.plans, plan] })),
      updatePlan: (id, updates) =>
        set((s) => ({
          plans: s.plans.map((p) => p.id === id ? { ...p, ...updates } : p),
        })),
      removePlan: (id) =>
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),
      setActivePlan: (id) =>
        set((s) => ({
          plans: s.plans.map((p) => ({
            ...p,
            is_active: p.id === id,
          })),
        })),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'plan-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

### Pattern 4: Collapsible Day Sections with Reanimated
**What:** Animated expand/collapse for day sections in plan detail view
**When to use:** Plan detail screen showing all days
**Example:**
```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

function CollapsibleSection({ title, children, defaultExpanded = true }) {
  const isExpanded = useSharedValue(defaultExpanded ? 1 : 0);
  const heightProgress = useAnimatedStyle(() => ({
    height: isExpanded.value === 1 ? 'auto' : 0,
    overflow: 'hidden',
    opacity: withTiming(isExpanded.value, { duration: 200 }),
  }));

  const toggle = () => {
    isExpanded.value = withTiming(isExpanded.value === 1 ? 0 : 1, { duration: 250 });
  };

  return (
    <View>
      <Pressable onPress={toggle}>
        <Text>{title}</Text>
        {/* Chevron icon rotating */}
      </Pressable>
      <Animated.View style={heightProgress}>
        {children}
      </Animated.View>
    </View>
  );
}
```

**Note:** Reanimated `height: 'auto'` animation is tricky. A simpler approach: measure content height with `onLayout`, then animate between 0 and measured height. Or use `LayoutAnimation` from React Native for a simpler solution that works well for expand/collapse.

### Pattern 5: Exercise Picker as Bottom Sheet
**What:** Reuse Phase 2 exercise list components inside a BottomSheetModal
**When to use:** When adding exercises to a plan day
**Example:**
```typescript
import { BottomSheetModal, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { ExerciseFilterBar } from '@/features/exercises/components/ExerciseFilterBar';
import { ExerciseListItem } from '@/features/exercises/components/ExerciseListItem';

function ExercisePicker({ onSelect, bottomSheetRef }) {
  const { exercises, fetchExercises } = useExercises();
  // Reuse same filter/search logic from exercises tab
  const snapPoints = useMemo(() => ['75%', '90%'], []);

  return (
    <BottomSheetModal ref={bottomSheetRef} snapPoints={snapPoints}>
      <ExerciseFilterBar ... />
      <BottomSheetFlatList
        data={filteredExercises}
        renderItem={({ item }) => (
          <Pressable onPress={() => onSelect(item)}>
            <ExerciseListItem exercise={item} />
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
      />
    </BottomSheetModal>
  );
}
```

**Critical:** Use `BottomSheetFlatList` (not regular `FlatList`) inside the bottom sheet for proper scroll/gesture handling.

### Anti-Patterns to Avoid
- **Storing sets as separate rows for plan templates:** Over-normalized for template data. Sets within a plan exercise are always read/written together. JSONB array is correct for templates. Separate rows would only matter for logged actuals (Phase 4+).
- **Mutating plan data to create workout logs:** Plans and actuals MUST be separate entities. Phase 4 will snapshot plan data into workout_sessions. Never modify plan tables during logging.
- **Using React state for plan editing instead of a draft copy:** Edit mode should work on a deep-cloned draft. Only persist on Save. Cancel discards the draft. This prevents partial saves and data corruption.
- **Fetching full plan tree on every render:** Fetch plan list (summary) for the list view. Fetch full plan with days+exercises only when entering detail view. Use `.select('*, plan_days(*, plan_day_exercises(*))')` for single-query nested fetch.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-to-reorder exercises | Custom PanResponder reorder | react-native-draggable-flatlist | Handles scroll interaction, placeholder rendering, haptic feedback, animation; dozens of edge cases |
| Bottom sheet exercise picker | Custom animated modal | @gorhom/bottom-sheet BottomSheetModal | Gesture dismiss, snap points, keyboard avoidance, backdrop, scroll inside sheet |
| Single-active-plan enforcement | Application-level check before every update | Database trigger (deactivate_other_plans) | Race condition free; enforced at DB level regardless of client |
| Collapsible sections | Custom height animation from scratch | Reanimated withTiming + measured height OR LayoutAnimation | Smooth 60fps, handles content changes |
| Delete confirmation | Custom modal component | Alert.alert with destructive button | Native feel, platform-appropriate, zero maintenance |

**Key insight:** This phase has significant UI complexity (nested forms, drag reorder, collapsible sections, bottom sheet picker). Using established libraries for interaction patterns lets implementation focus on business logic and data flow.

## Common Pitfalls

### Pitfall 1: Bottom Sheet Scroll Conflicts
**What goes wrong:** FlatList inside BottomSheetModal doesn't scroll, or scrolling dismisses the sheet
**Why it happens:** Regular FlatList and BottomSheet both try to handle the same gesture
**How to avoid:** ALWAYS use `BottomSheetFlatList`, `BottomSheetScrollView`, or `BottomSheetTextInput` inside bottom sheets. Never use regular RN scroll components inside @gorhom/bottom-sheet.
**Warning signs:** Content inside sheet can't scroll, or sheet closes when trying to scroll

### Pitfall 2: Cascade Delete Not Set Up
**What goes wrong:** Deleting a plan leaves orphaned plan_days and plan_day_exercises rows
**Why it happens:** Forgot ON DELETE CASCADE on foreign keys
**How to avoid:** All FK references in the migration use ON DELETE CASCADE: plan_days -> workout_plans, plan_day_exercises -> plan_days. The exercise FK uses ON DELETE RESTRICT (don't delete exercise if it's used in a plan).
**Warning signs:** Data integrity errors, ghost data in child tables

### Pitfall 3: Edit Mode Mutates Live State
**What goes wrong:** User starts editing, changes some fields, then navigates back -- partial changes are persisted
**Why it happens:** Editing directly on the Zustand store state without a draft copy
**How to avoid:** When entering edit mode, create a deep clone of the plan into local component state. Only call planStore.updatePlan() and Supabase update on explicit Save. Cancel discards the local clone.
**Warning signs:** Plan data changes without user pressing Save

### Pitfall 4: JSONB Target Sets Type Safety
**What goes wrong:** target_sets JSONB column accepts any shape, leading to runtime crashes when reading malformed data
**Why it happens:** JSONB has no schema enforcement at the database level
**How to avoid:** Define a TypeScript interface for TargetSet, validate with Zod on read/write, and always initialize with a properly shaped default `[{weight: 0, reps: 0, rpe: null}]`.
**Warning signs:** `undefined is not an object` errors when rendering set rows

### Pitfall 5: Active Plan Race Condition
**What goes wrong:** Two plans end up marked active simultaneously
**Why it happens:** Client-side toggle without server-side enforcement
**How to avoid:** Use the database trigger to deactivate other plans. Also update local state optimistically but re-fetch on error.
**Warning signs:** Multiple plans showing active badge

### Pitfall 6: Drag Reorder Not Persisting sort_order
**What goes wrong:** User reorders exercises, leaves screen, comes back -- order is reset
**Why it happens:** Drag callback updates local state but doesn't persist sort_order to Supabase
**How to avoid:** After drag ends, update sort_order for all affected exercises in both local state and Supabase. Batch the update with a single RPC call or multiple updates.
**Warning signs:** Exercise order resets on screen re-entry

### Pitfall 7: Weekday Mapping Confusion
**What goes wrong:** Days display incorrectly across timezones or locale differences
**Why it happens:** Storing weekday as string names instead of numbers
**How to avoid:** Store weekday as SMALLINT (0=Sun through 6=Sat, matching JavaScript Date.getDay()). Display names are derived at render time using locale-aware formatting.
**Warning signs:** "Monday" showing up on the wrong day

## Code Examples

### Supabase RLS Policies for Plans
```sql
-- Same pattern as exercises: users own their plans
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own plans"
  ON public.workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
  ON public.workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON public.workout_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON public.workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- plan_days and plan_day_exercises: cascade through plan ownership
-- RLS on child tables checks parent plan ownership
ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plan days"
  ON public.plan_days FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE id = plan_days.plan_id AND user_id = auth.uid()
    )
  );

ALTER TABLE public.plan_day_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plan day exercises"
  ON public.plan_day_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.workout_plans wp ON wp.id = pd.plan_id
      WHERE pd.id = plan_day_exercises.plan_day_id AND wp.user_id = auth.uid()
    )
  );
```

### Fetching Full Plan with Nested Data
```typescript
// Single query to get plan + days + exercises using Supabase relations
const { data, error } = await supabase
  .from('workout_plans')
  .select(`
    *,
    plan_days (
      *,
      plan_day_exercises (
        *,
        exercise:exercises (id, name, muscle_group, equipment)
      )
    )
  `)
  .eq('id', planId)
  .single();

// Order days and exercises by sort_order client-side
if (data) {
  data.plan_days.sort((a, b) => a.sort_order - b.sort_order);
  data.plan_days.forEach(day => {
    day.plan_day_exercises.sort((a, b) => a.sort_order - b.sort_order);
  });
}
```

### TypeScript Interfaces for Plan Types
```typescript
// src/features/plans/types.ts
export interface TargetSet {
  weight: number;
  reps: number;
  rpe: number | null;  // 1-10 scale, nullable
}

export interface PlanDayExercise {
  id: string;
  plan_day_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: TargetSet[];
  notes: string | null;
  unit_override: 'kg' | 'lbs' | null;  // null = use profile default
  created_at: string;
  // Joined data (from exercise relation)
  exercise?: {
    id: string;
    name: string;
    muscle_group: string;
    equipment: string;
  };
}

export interface PlanDay {
  id: string;
  plan_id: string;
  day_name: string;           // "Day A", "Push", "Upper Body"
  weekday: number | null;     // 0-6 (Sun-Sat), null if unmapped
  sort_order: number;
  created_at: string;
  plan_day_exercises: PlanDayExercise[];
}

export interface Plan {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  plan_days: PlanDay[];
}

// For list view (without nested data)
export interface PlanSummary {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  day_count: number;
  day_names: string[];
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
```

### Tab Layout Update
```typescript
// Add Plans tab to app/(app)/(tabs)/_layout.tsx
<Tabs.Screen
  name="plans"
  options={{
    title: 'Plans',
    tabBarIcon: ({ color }) => (
      <Text style={{ fontSize: 20, color }}>{'📋'}</Text>
    ),
  }}
/>
```

### Drag-to-Reorder with react-native-draggable-flatlist
```typescript
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';

function ExerciseList({ exercises, onReorder, isEditing }) {
  const renderItem = ({ item, drag, isActive }: RenderItemParams<PlanDayExercise>) => (
    <ScaleDecorator>
      <Pressable
        onLongPress={isEditing ? drag : undefined}
        disabled={isActive}
      >
        <PlanExerciseRow exercise={item} isEditing={isEditing} />
      </Pressable>
    </ScaleDecorator>
  );

  return (
    <DraggableFlatList
      data={exercises}
      onDragEnd={({ data }) => onReorder(data)}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
    />
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-native-gesture-handler v1 (auto root) | v2 with explicit GestureHandlerRootView | 2023 | Must wrap root; Phase 2 handles this |
| @gorhom/bottom-sheet v4 | v5 (Reanimated v3 + GH v2) | 2024 | Use v5 API exclusively |
| FlatList inside bottom sheet | BottomSheetFlatList | v5 | Scroll/gesture conflicts otherwise |
| Separate tables for every nested field | JSONB for structured but co-accessed data | Ongoing | target_sets as JSONB is idiomatic for template data |

**Deprecated/outdated:**
- `react-native-modal`: Replaced by @gorhom/bottom-sheet for gesture-driven modals
- PanResponder for drag reorder: Replaced by react-native-draggable-flatlist
- `LayoutAnimation` for complex animations: Still works but Reanimated is more predictable

## Open Questions

1. **Saving plan with multiple child inserts atomically**
   - What we know: Supabase JS client does not have built-in transaction support for multiple table inserts
   - What's unclear: Whether to use an RPC function for atomic plan creation or accept sequential inserts with error recovery
   - Recommendation: Use sequential inserts (plan -> days -> exercises) with try/catch. If any step fails, delete the partially created plan. For v1 with a single user, this is acceptable. An RPC function can be added later if needed.

2. **Plan summary for list view without full nested fetch**
   - What we know: Fetching all plan data for the list view is wasteful
   - What's unclear: Whether to use a Supabase view/function or compute client-side
   - Recommendation: Fetch plans with a count of days: `supabase.from('workout_plans').select('*, plan_days(day_name)')`. This gives plan + day names without exercise detail. Lightweight enough for a list.

3. **Collapsible section height animation approach**
   - What we know: Reanimated `height: 'auto'` is not directly animatable
   - What's unclear: Best approach for smooth expand/collapse
   - Recommendation: Use `onLayout` to measure content height, store it, animate between 0 and measured height with `withTiming`. Alternatively, use React Native's built-in `LayoutAnimation.configureNext()` which handles this simply -- it works on both platforms and requires no measurement. Start with LayoutAnimation for simplicity.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest v29 + jest-expo v55 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest tests/plans/ --bail` |
| Full suite command | `npx jest --bail` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAN-01 | Create named workout plan in store and Supabase | unit | `npx jest tests/plans/plan-store.test.ts -x` | No - Wave 0 |
| PLAN-02 | Assign day slots with optional weekday mapping | unit | `npx jest tests/plans/plan-days.test.ts -x` | No - Wave 0 |
| PLAN-03 | Add exercises from library to a plan day | unit | `npx jest tests/plans/plan-exercises.test.ts -x` | No - Wave 0 |
| PLAN-04 | Set target sets/reps/weight/RPE/notes per exercise | unit | `npx jest tests/plans/plan-exercises.test.ts -x` | No - Wave 0 |
| PLAN-05 | Edit and delete plans with proper cascade | unit | `npx jest tests/plans/plan-crud.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest tests/plans/ --bail`
- **Per wave merge:** `npx jest --bail`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/plans/plan-store.test.ts` -- covers PLAN-01, PLAN-05 (store CRUD operations)
- [ ] `tests/plans/plan-days.test.ts` -- covers PLAN-02 (day slot management, weekday mapping)
- [ ] `tests/plans/plan-exercises.test.ts` -- covers PLAN-03, PLAN-04 (exercise assignment, target sets)
- [ ] `tests/plans/plan-crud.test.ts` -- covers PLAN-05 (edit/delete with active plan enforcement)

## Sources

### Primary (HIGH confidence)
- Project codebase analysis: `src/stores/authStore.ts`, `src/stores/exerciseStore.ts`, `src/features/exercises/` -- established patterns for stores, hooks, feature organization
- Supabase migration pattern: `supabase/migrations/20260310000000_create_exercises.sql` -- RLS policy pattern, table structure conventions
- Phase 2 research: `.planning/phases/02-exercise-library/02-RESEARCH.md` -- @gorhom/bottom-sheet v5 compatibility confirmed, gesture handler setup documented

### Secondary (MEDIUM confidence)
- [@gorhom/bottom-sheet docs](https://gorhom.dev/react-native-bottom-sheet/) -- BottomSheetModal API, BottomSheetFlatList usage
- [react-native-draggable-flatlist npm](https://www.npmjs.com/package/react-native-draggable-flatlist) -- v4 API, Expo compatibility

### Tertiary (LOW confidence)
- Collapsible section animation approach -- multiple valid patterns exist; LayoutAnimation vs Reanimated measured height recommendation is based on general RN knowledge, not project-specific validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries either already installed or well-established in RN ecosystem
- Architecture: HIGH -- follows existing project patterns exactly (stores, features, migrations, RLS)
- Schema design: HIGH -- three-table normalized schema is the standard approach for plan/day/exercise hierarchies
- Pitfalls: HIGH -- based on direct analysis of codebase patterns and known @gorhom/bottom-sheet issues
- Drag reorder: MEDIUM -- react-native-draggable-flatlist is standard but not yet validated in this specific Expo SDK 55 project
- Collapsible animation: MEDIUM -- multiple valid approaches; recommendation is reasonable but not battle-tested in this codebase

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain; no fast-moving dependencies)
