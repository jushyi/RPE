# Phase 5: Workout History - Research

**Researched:** 2026-03-09
**Domain:** Workout history list, session detail screens, swipeable sub-tab navigation, Epley 1RM calculation and storage
**Confidence:** HIGH

## Summary

Phase 5 adds a workout history feature inside the existing Plans tab using swipeable sub-tab navigation (Plans | History). Users see a reverse-chronological list of past sessions with summary data, can tap into a session to see full detail (every set logged per exercise), and see estimated 1RM values calculated via the Epley formula. The phase also adds deletion capability for sessions and individual sets.

The architecture builds on Phase 4's database tables (workout_sessions, session_exercises, set_logs) which already store completed workout data. The main work is: (1) adding an `estimated_1rm` column to set_logs, (2) building a Zustand + MMKV history store with Supabase nested selects for data fetching, (3) implementing swipeable sub-tab navigation using react-native-pager-view (already installed for Phase 4), and (4) building session list and detail UI using the established Card component and dark theme patterns.

The Epley formula is straightforward: `1RM = weight * (1 + reps / 30)`. For 1-rep sets, the actual weight IS the 1RM. Values are stored per-set at log time (Phase 4 session completion or via a migration/backfill) so Phase 6 charts can query them directly without recalculation.

**Primary recommendation:** Use react-native-pager-view for Plans/History sub-tabs (reuse from Phase 4), Zustand + MMKV for history state (consistent with all other stores), Supabase nested selects for fetching session data with exercises and sets in one query, and add `estimated_1rm` column to set_logs table.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Reverse chronological order (most recent at top)
- Each session card shows: date, exercise names (truncated with "+N more" after 2), total volume, PR badge/count if any PRs were hit
- Empty state: friendly message + CTA button to start a workout (consistent with Phase 2/3 empty state patterns)
- Card-per-exercise layout (reuses Card component, consistent with app-wide card-based UI)
- Detail header matches Phase 4 post-session stats card: date, duration, total volume, exercise count, PR count
- Inline delta indicators showing +/- weight and reps vs previous session for the same plan day
- Users can delete entire sessions or individual sets within a session (with confirmation dialogs)
- Estimated 1RM calculated via Epley formula on set log
- 1RM values stored in database per-set for Phase 6 chart use (no on-the-fly recalculation needed)
- 1RM display is opt-in per exercise -- reuses Phase 4's "Track PRs" toggle (if PRs are tracked, 1RM is shown)
- For opted-in exercises, best estimated 1RM for that session shown in the exercise card header (not per-set rows)
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

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HIST-01 | User can view list of past workout sessions with date, exercises, and total volume | History sub-tab with FlatList of session cards; Supabase nested select for workout_sessions with session_exercises and set_logs; historyStore with Zustand + MMKV |
| HIST-06 | Estimated 1RM auto-calculated from logged sets using Epley formula | Add estimated_1rm column to set_logs; Epley formula: weight * (1 + reps/30); calculated at session save time; stored per-set for Phase 6 chart queries |

</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0.11 | History state store with MMKV persistence | Same pattern as authStore, planStore, exerciseStore |
| react-native-mmkv | ^4.2.0 | Synchronous persistence for history cache | Established pattern across all stores |
| react-native-pager-view | (Phase 4 install) | Swipeable Plans/History sub-tabs | Already installed for Phase 4 exercise paging; native ViewPager/UIPageViewController |
| react-native-reanimated | 4.2.1 | Tab indicator animations, delta indicator transitions | Already installed; UI thread animations |
| @supabase/supabase-js | ^2.99.0 | Fetching session data with nested selects | Already used; RLS policies already on workout tables |
| @gorhom/bottom-sheet | ^5.2.8 | Plan filter bottom sheet (optional) | Already installed; used in Phase 2 |
| expo-router | ^55.0.4 | Session detail navigation | Already used; push to /history/[sessionId] |
| expo-haptics | ~55.0.8 | Haptic feedback on delete actions | Already installed; used in plans |

### New for Phase 5
No new libraries required. All needed dependencies are already installed from previous phases.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PagerView for sub-tabs | react-native-tab-view | Tab-view adds another dependency; PagerView is already installed and simpler for 2-page navigation |
| Zustand store for history | TanStack Query | TanStack Query is not in the project stack; adding it would be inconsistent with established patterns; Zustand + manual fetch is the project convention |
| Chip bar for plan filter | Dropdown/Picker | Chip bar is consistent with ExerciseFilterBar pattern from Phase 2; already has a visual precedent |
| Supabase nested select | Multiple queries | Nested select (`workout_sessions(*, session_exercises(*, set_logs(*)))`) is a single round-trip; more efficient |

## Architecture Patterns

### Recommended Project Structure
```
src/
  features/
    history/
      components/
        SessionCard.tsx            # List item: date, exercises, volume, PR count
        SessionDetail.tsx          # Full session view with exercise cards
        SessionExerciseCard.tsx    # Card per exercise in detail view
        SetRow.tsx                 # Individual set display (weight, reps, 1RM)
        DeltaIndicator.tsx         # +/- weight/reps vs previous session
        HistoryEmptyState.tsx      # Empty state with CTA to start workout
        HistoryHeader.tsx          # Sub-tab indicators (Plans | History)
        PlanFilter.tsx             # Filter chips for plan/freestyle
      hooks/
        useHistory.ts             # Fetch sessions, delete session/set
        useSessionDetail.ts       # Fetch single session with full data
        useDeltaComparison.ts     # Compare session vs previous for same plan day
      utils/
        epley.ts                  # Epley 1RM calculation
        volumeCalc.ts             # Total volume calculation
      types.ts                    # HistorySession, SessionSummary types
  stores/
    historyStore.ts               # Session list cache with MMKV persistence
app/
  (app)/
    (tabs)/
      plans.tsx                   # Refactored: PagerView with Plans + History sub-tabs
    history/
      [sessionId].tsx             # Session detail screen
supabase/
  migrations/
    XXXXXXXXX_add_estimated_1rm_to_set_logs.sql
```

### Pattern 1: Swipeable Sub-Tab Navigation
**What:** Replace the current plans.tsx screen content with a PagerView that holds two pages: the existing Plans list and the new History list. Tab indicators at the top show which page is active.
**When to use:** The Plans bottom tab screen.
**Example:**
```typescript
// app/(app)/(tabs)/plans.tsx
import PagerView from 'react-native-pager-view';
import { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors } from '@/constants/theme';

function PlansTabScreen() {
  const pagerRef = useRef<PagerView>(null);
  const [activeTab, setActiveTab] = useState(0);
  const indicatorX = useSharedValue(0);

  const handlePageSelected = (position: number) => {
    setActiveTab(position);
    indicatorX.value = withTiming(position * tabWidth);
  };

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Tab indicators */}
      <View style={s.tabBar}>
        <Pressable onPress={() => handleTabPress(0)} style={s.tab}>
          <Text style={[s.tabText, activeTab === 0 && s.tabTextActive]}>Plans</Text>
        </Pressable>
        <Pressable onPress={() => handleTabPress(1)} style={s.tab}>
          <Text style={[s.tabText, activeTab === 1 && s.tabTextActive]}>History</Text>
        </Pressable>
        <Animated.View style={[s.indicator, indicatorAnimStyle]} />
      </View>

      {/* Swipeable pages */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => handlePageSelected(e.nativeEvent.position)}
      >
        <View key="plans">
          <PlansContent />
        </View>
        <View key="history">
          <HistoryContent />
        </View>
      </PagerView>
    </SafeAreaView>
  );
}
```

### Pattern 2: Supabase Nested Select for History
**What:** Fetch workout sessions with all nested data (exercises, sets) in a single query using Supabase's nested select syntax.
**When to use:** Loading the history list and session detail.
**Example:**
```typescript
// Session list (lightweight -- no individual sets)
const { data, error } = await (supabase.from('workout_sessions') as any)
  .select(`
    *,
    session_exercises(
      id,
      exercise_id,
      sort_order,
      exercises(name, muscle_groups)
    )
  `)
  .order('ended_at', { ascending: false })
  .limit(50);

// Session detail (full data with sets)
const { data, error } = await (supabase.from('workout_sessions') as any)
  .select(`
    *,
    session_exercises(
      *,
      exercises(name, muscle_groups, equipment, track_prs),
      set_logs(*)
    )
  `)
  .eq('id', sessionId)
  .single();
```

**Important:** Use the `as any` pattern for Supabase `.from()` calls, consistent with the existing codebase convention (see usePlans.ts, useExercises.ts).

### Pattern 3: Zustand History Store
**What:** Zustand store with MMKV persistence for caching session list data.
**When to use:** History list screen -- cache avoids re-fetching on tab switches.
**Example:**
```typescript
// src/stores/historyStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { HistorySession } from '@/features/history/types';

const storage = createMMKV({ id: 'history-storage' });
const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface HistoryState {
  sessions: HistorySession[];
  isLoading: boolean;
  lastFetched: number | null;
}

interface HistoryActions {
  setSessions: (sessions: HistorySession[]) => void;
  removeSession: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useHistoryStore = create<HistoryState & HistoryActions>()(
  persist(
    (set) => ({
      sessions: [],
      isLoading: false,
      lastFetched: null,
      setSessions: (sessions) => set({ sessions, lastFetched: Date.now() }),
      removeSession: (id) => set((s) => ({
        sessions: s.sessions.filter((sess) => sess.id !== id),
      })),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'history-storage',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

### Pattern 4: Delta Comparison
**What:** For plan-based sessions, compare current session values against the previous session for the same plan_day_id.
**When to use:** Session detail view, inline with each exercise card.
**Example:**
```typescript
// Fetch previous session for the same plan day
async function getPreviousSession(
  currentSessionId: string,
  planDayId: string,
  sessionDate: string
): Promise<HistorySession | null> {
  const { data } = await (supabase.from('workout_sessions') as any)
    .select(`
      *,
      session_exercises(*, set_logs(*))
    `)
    .eq('plan_day_id', planDayId)
    .neq('id', currentSessionId)
    .lt('ended_at', sessionDate)
    .order('ended_at', { ascending: false })
    .limit(1)
    .single();

  return data;
}

// Calculate delta for an exercise
function calculateDelta(
  currentSets: SetLog[],
  previousSets: SetLog[]
): { weightDelta: number; repsDelta: number } {
  const currentMaxWeight = Math.max(...currentSets.map(s => s.weight));
  const previousMaxWeight = Math.max(...previousSets.map(s => s.weight));
  const currentTotalReps = currentSets.reduce((sum, s) => sum + s.reps, 0);
  const previousTotalReps = previousSets.reduce((sum, s) => sum + s.reps, 0);

  return {
    weightDelta: currentMaxWeight - previousMaxWeight,
    repsDelta: currentTotalReps - previousTotalReps,
  };
}
```

### Anti-Patterns to Avoid
- **Fetching individual sets in separate queries:** Use Supabase nested selects to get sessions with exercises and sets in one query. Multiple round-trips cause visible loading delays.
- **Recalculating 1RM on every render:** Store estimated_1rm in the database at set log time. Phase 6 charts will query this column directly.
- **Using ScrollView instead of FlatList for session list:** FlatList virtualizes the list; ScrollView renders all items. History can grow unbounded.
- **Deleting sets without recalculating session aggregates:** When a set is deleted, total volume and best 1RM for that exercise may change. Update the UI to reflect this.
- **Navigating to session detail via modal:** Use expo-router push navigation to `/history/[sessionId]` for a full screen detail view with back navigation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Swipeable tab navigation | Custom ScrollView with snapping | react-native-pager-view | Already installed; native page controller handles edge cases |
| Tab indicator animation | Manual translateX math | Reanimated useSharedValue + withTiming | Runs on UI thread; smooth 60fps |
| Confirmation dialogs | Custom modal component | React Native Alert.alert | Established project pattern (see plans.tsx handleDeletePlan) |
| Date formatting | Manual date string parsing | Intl.DateTimeFormat or simple helper | Avoid date library overhead for simple formatting |
| Volume calculation | Complex aggregation logic | Simple reduce: `sets.reduce((sum, s) => sum + s.weight * s.reps, 0)` | Pure function, no library needed |
| Epley 1RM formula | N/A | Pure function: `weight * (1 + reps / 30)` | 1-line formula; no library needed |

**Key insight:** This phase is primarily UI and data display. There are no complex gesture interactions or real-time features. The main challenge is efficient data fetching (nested selects) and clean sub-tab navigation integration.

## Common Pitfalls

### Pitfall 1: PagerView Loses State on Tab Switch
**What goes wrong:** Switching between Plans and History pages causes the inactive page's scroll position or filter state to reset.
**Why it happens:** PagerView may unmount off-screen pages by default.
**How to avoid:** Set `offscreenPageLimit={1}` on PagerView to keep both pages mounted. Both pages should maintain their own state in stores/hooks that survive unmounts.
**Warning signs:** Scroll position resets when swiping back to a tab.

### Pitfall 2: N+1 Query for Exercise Names in Session List
**What goes wrong:** Session list loads slowly because exercise names are fetched individually for each session.
**Why it happens:** session_exercises stores exercise_id, not exercise_name. Without nested select, you'd need separate lookups.
**How to avoid:** Use Supabase nested select: `session_exercises(exercise_id, exercises(name))` joins exercise data in the same query.
**Warning signs:** Session list shows loading spinners for exercise names.

### Pitfall 3: Delta Comparison Fails for Freestyle Sessions
**What goes wrong:** Attempting to find "previous session for the same plan day" crashes when plan_day_id is null (freestyle sessions).
**Why it happens:** Freestyle sessions have null plan_day_id and plan_id.
**How to avoid:** Only show delta indicators for plan-based sessions where plan_day_id is not null. For freestyle sessions, skip the delta comparison entirely or compare by exercise_id across all sessions (simpler: just skip it).
**Warning signs:** Error or empty delta for freestyle sessions.

### Pitfall 4: Epley Formula Edge Cases
**What goes wrong:** 1RM calculation returns unexpected values for extreme rep ranges or zero/negative inputs.
**Why it happens:** Epley formula is most accurate for 1-10 reps. At 0 reps it produces the weight itself. At very high reps (30+) it may overestimate.
**How to avoid:** Guard against reps <= 0 (return 0 or weight). For 1-rep sets, return weight directly (actual 1RM). Consider capping at 10 reps for formula accuracy, but still calculate for higher reps (just note reduced accuracy). Always round to 1 decimal place.
**Warning signs:** 1RM values that seem unreasonably high for high-rep sets.

### Pitfall 5: Plans Tab Refactor Breaks Existing Functionality
**What goes wrong:** Wrapping the existing plans list in PagerView introduces layout bugs or breaks the FAB button positioning.
**Why it happens:** PagerView children need to be direct View children. The existing PlansScreen has SafeAreaView, FAB, FlatList etc.
**How to avoid:** Extract the existing plans.tsx content into a `PlansContent` component. Wrap it in a plain View inside PagerView. Move SafeAreaView to the outer PagerView container. Test that FAB still positions correctly within the PagerView page.
**Warning signs:** FAB floats in wrong position; plans list doesn't scroll properly.

### Pitfall 6: Large History Data Set Performance
**What goes wrong:** Users with many sessions experience slow initial load and laggy scrolling.
**Why it happens:** Fetching all sessions with nested data at once.
**How to avoid:** Paginate the history list -- fetch 20-30 sessions at a time using `.range(offset, offset + limit)`. Use FlatList's `onEndReached` for infinite scroll. For the list view, only fetch exercise names (not full set data) -- load full detail on tap.
**Warning signs:** Noticeable delay when opening the History tab.

## Code Examples

### Epley 1RM Calculation
```typescript
// src/features/history/utils/epley.ts

/**
 * Calculate estimated 1-rep max using the Epley formula.
 * Formula: 1RM = weight * (1 + reps / 30)
 *
 * For 1-rep sets, returns the weight directly (actual 1RM).
 * Returns 0 for invalid inputs (reps <= 0 or weight <= 0).
 */
export function calculateEpley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;

  const estimated = weight * (1 + reps / 30);
  return Math.round(estimated * 10) / 10; // Round to 1 decimal
}

/**
 * Find the best estimated 1RM across all sets for an exercise in a session.
 */
export function bestSessionE1RM(sets: Array<{ weight: number; reps: number }>): number {
  return Math.max(0, ...sets.map(s => calculateEpley1RM(s.weight, s.reps)));
}
```

### Database Migration: Add estimated_1rm to set_logs
```sql
-- Add estimated_1rm column to set_logs for chart use in Phase 6
ALTER TABLE public.set_logs
  ADD COLUMN estimated_1rm NUMERIC(6,2);

-- Backfill existing set_logs with Epley calculation
-- Epley formula: weight * (1 + reps / 30), or just weight for 1-rep sets
UPDATE public.set_logs
SET estimated_1rm = CASE
  WHEN reps = 1 THEN weight
  WHEN reps > 0 THEN ROUND(weight * (1 + reps::numeric / 30), 2)
  ELSE NULL
END
WHERE estimated_1rm IS NULL;

-- Index for Phase 6 chart queries (1RM over time per exercise)
CREATE INDEX idx_set_logs_exercise_1rm
  ON public.set_logs(session_exercise_id, estimated_1rm DESC);
```

### TypeScript Interfaces
```typescript
// src/features/history/types.ts

export interface HistorySetLog {
  id: string;
  set_number: number;
  weight: number;
  reps: number;
  unit: 'kg' | 'lbs';
  is_pr: boolean;
  estimated_1rm: number | null;
  logged_at: string;
}

export interface HistoryExercise {
  id: string;          // session_exercise id
  exercise_id: string;
  sort_order: number;
  exercise: {
    name: string;
    muscle_groups: string[];
    equipment: string;
    track_prs: boolean;
  };
  set_logs: HistorySetLog[];
}

export interface HistorySession {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_day_id: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  // Nested data
  session_exercises: HistoryExercise[];
  // Derived (computed client-side for list display)
  plan_name?: string;
  day_name?: string;
}

// For list display (computed from HistorySession)
export interface SessionListItem {
  id: string;
  date: string;                    // ended_at formatted
  exerciseNames: string[];         // First 2 + "+N more"
  totalVolume: number;             // sum of weight * reps
  prCount: number;                 // count of is_pr === true sets
  durationMinutes: number | null;  // ended_at - started_at
  planName: string | null;         // null = freestyle
  dayName: string | null;
}

// Delta comparison result
export interface ExerciseDelta {
  exerciseId: string;
  weightDelta: number;   // positive = improvement
  repsDelta: number;     // positive = improvement
  hasPrevious: boolean;  // false if no prior session for comparison
}
```

### Volume Calculation Helper
```typescript
// src/features/history/utils/volumeCalc.ts

export function calculateTotalVolume(
  exercises: Array<{ set_logs: Array<{ weight: number; reps: number }> }>
): number {
  return exercises.reduce((total, ex) =>
    total + ex.set_logs.reduce((exTotal, set) =>
      exTotal + set.weight * set.reps, 0
    ), 0
  );
}

export function calculateDurationMinutes(
  startedAt: string,
  endedAt: string | null
): number | null {
  if (!endedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  return Math.round((end - start) / 60000);
}
```

### Session Card Component Pattern
```typescript
// src/features/history/components/SessionCard.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { SessionListItem } from '../types';

interface SessionCardProps {
  session: SessionListItem;
  onPress: () => void;
}

export function SessionCard({ session, onPress }: SessionCardProps) {
  const exerciseLabel = session.exerciseNames.length > 2
    ? `${session.exerciseNames.slice(0, 2).join(', ')} +${session.exerciseNames.length - 2} more`
    : session.exerciseNames.join(', ');

  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={s.header}>
          <Text style={s.date}>{formatDate(session.date)}</Text>
          {session.planName && (
            <Text style={s.planBadge}>{session.planName}</Text>
          )}
        </View>
        <Text style={s.exercises} numberOfLines={1}>{exerciseLabel}</Text>
        <View style={s.stats}>
          <Text style={s.stat}>{formatVolume(session.totalVolume)} vol</Text>
          {session.durationMinutes && (
            <Text style={s.stat}>{session.durationMinutes}min</Text>
          )}
          {session.prCount > 0 && (
            <View style={s.prBadge}>
              <Ionicons name="trophy" size={12} color={colors.warning} />
              <Text style={s.prText}>{session.prCount} PR{session.prCount > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
```

### Delete Session with Confirmation
```typescript
// Follows established Alert.alert pattern from plans.tsx
import { Alert } from 'react-native';

function handleDeleteSession(sessionId: string, onDelete: (id: string) => Promise<void>) {
  Alert.alert(
    'Delete Workout?',
    'This will permanently remove this session and all its logged sets.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await onDelete(sessionId);
          } catch (err) {
            Alert.alert('Error', 'Failed to delete session.');
          }
        },
      },
    ]
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom tab switching with state | PagerView native pages | Current | Native feel, gesture-based tab switching |
| TanStack Query for data fetching | Zustand + MMKV + manual Supabase calls | Project convention | Consistent with all other features; no new dependency |
| Calculate 1RM on every display | Store 1RM in database at log time | Best practice for charts | One-time calculation; chart queries are simple column reads |
| Brzycki formula (older) | Epley formula | Modern standard | Epley: weight * (1 + reps/30) -- simpler, widely accepted |

**Deprecated/outdated:**
- Brzycki 1RM formula: Less commonly used; Epley is the standard in fitness apps
- On-the-fly 1RM recalculation: Wasteful for chart use; store once, query many times

## Open Questions

1. **Phase 4 table existence assumption**
   - What we know: Phase 4 research defines workout_sessions, session_exercises, and set_logs tables. Phase 5 depends on these existing.
   - What's unclear: Phase 4 is not yet implemented. If Phase 4 schema differs from research, Phase 5 migrations need adjustment.
   - Recommendation: Phase 5 migration only adds the `estimated_1rm` column. It does not create the base tables. The planner should note this dependency -- Phase 4 must be complete before Phase 5 migration runs.

2. **Backfill 1RM for existing Phase 4 data**
   - What we know: Phase 4 logs sets without estimated_1rm. Phase 5 adds the column.
   - What's unclear: Whether there will be significant data to backfill when Phase 5 starts.
   - Recommendation: Include a backfill UPDATE in the migration (shown in code examples). This handles any sets logged during Phase 4 before the column exists.

3. **Plan name display in session list**
   - What we know: Sessions reference plan_id. Session cards should show the plan name.
   - What's unclear: Whether to join through plan_id in the nested select or cache plan names.
   - Recommendation: Include `workout_plans(name)` in the nested select for plan-based sessions. For freestyle sessions (null plan_id), display "Freestyle" as the label.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest v29 + jest-expo v55 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest tests/history/ --bail` |
| Full suite command | `npx jest --bail` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HIST-01 | Session list data derivation (volume calc, exercise name truncation, PR count) | unit | `npx jest tests/history/history-list.test.ts -x` | No - Wave 0 |
| HIST-01 | History store CRUD (setSessions, removeSession) | unit | `npx jest tests/history/history-store.test.ts -x` | No - Wave 0 |
| HIST-06 | Epley 1RM calculation (normal, 1-rep, edge cases) | unit | `npx jest tests/history/epley.test.ts -x` | No - Wave 0 |
| HIST-06 | Best session 1RM across sets | unit | `npx jest tests/history/epley.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest tests/history/ --bail`
- **Per wave merge:** `npx jest --bail`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/history/epley.test.ts` -- covers HIST-06 (Epley formula: normal case, 1 rep, 0 reps, 0 weight, high reps, rounding)
- [ ] `tests/history/history-list.test.ts` -- covers HIST-01 (volume calculation, exercise name truncation, duration calculation, PR count)
- [ ] `tests/history/history-store.test.ts` -- covers HIST-01 (store CRUD: setSessions, removeSession, setLoading)

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/stores/planStore.ts` -- Zustand + MMKV persist pattern (template for historyStore)
- Project codebase: `app/(app)/(tabs)/plans.tsx` -- current Plans tab structure being refactored
- Project codebase: `src/features/plans/hooks/usePlans.ts` -- Supabase nested select and `as any` pattern
- Project codebase: `src/components/ui/Card.tsx` -- reusable Card component for session cards
- Phase 4 research: `.planning/phases/04-active-workout/04-RESEARCH.md` -- database schema for workout_sessions, session_exercises, set_logs
- Phase 5 CONTEXT.md: `.planning/phases/05-workout-history/05-CONTEXT.md` -- locked decisions and discretion areas

### Secondary (MEDIUM confidence)
- Epley formula: `1RM = weight * (1 + reps / 30)` -- standard exercise science formula, widely documented
- react-native-pager-view offscreenPageLimit: documented prop for keeping pages mounted

### Tertiary (LOW confidence)
- Delta comparison UX: exact visual treatment for +/- indicators is Claude's Discretion; research provides the data calculation pattern but not visual design specifics

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed; no new dependencies
- Architecture: HIGH -- follows exact patterns from planStore, usePlans, Card component
- Schema: HIGH -- simple ALTER TABLE on existing Phase 4 tables; Epley formula is deterministic
- Pitfalls: HIGH -- well-known issues with PagerView, nested queries, null plan_day_id
- Delta comparison: MEDIUM -- requires querying previous session; edge cases for freestyle and first-time sessions need handling

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain; no fast-moving dependencies)
