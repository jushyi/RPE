# Phase 4: Active Workout - Research

**Researched:** 2026-03-09
**Domain:** Live workout session with gesture-based set logging, PR detection, offline-first sync, crash recovery
**Confidence:** HIGH

## Summary

Phase 4 is the core daily interaction of the app: running a live workout session. Users start from a plan day or freestyle, see one exercise at a time in focus mode, log sets by swiping cards away, see previous performance inline, get instant PR flags, and have every set persisted to MMKV the moment it is logged. The session state survives crashes via Zustand + MMKV persistence, and background sync pushes completed data to Supabase when connectivity is available.

The architecture uses: (1) a `workoutStore` (Zustand + MMKV) for the active session state with crash recovery, (2) `react-native-pager-view` for horizontal exercise-to-exercise navigation, (3) `Gesture.Pan()` from react-native-gesture-handler + react-native-reanimated for swipe-to-log set cards, (4) new Supabase tables (`workout_sessions`, `session_exercises`, `set_logs`) to persist completed workouts, and (5) a sync queue in MMKV that buffers writes and flushes when online.

The database schema must keep plan templates and logged actuals strictly separate -- a workout session snapshots the plan data at start time, so subsequent plan edits never corrupt session history. PR detection compares each logged set against the `pr_baselines` table and updates it in-place when a new max weight is achieved.

**Primary recommendation:** Use PagerView for exercise navigation, Gesture.Pan + Reanimated for swipe-to-log cards, Zustand + MMKV for instant persistence with crash recovery, and a simple MMKV-backed sync queue (not TanStack Query) to keep the stack minimal and consistent with established project patterns.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Plan-based: tap a plan day in the Plans tab detail view to launch that workout directly
- Freestyle: start an empty session and add exercises one at a time using the exercise library picker as you go
- Freestyle entry available from both Dashboard ("Quick Workout" button) and Plans tab
- Mid-session flexibility: users can skip, reorder, and add exercises during any workout -- plan is a starting template, not a locked sequence
- Card-per-set design: exercise name at top, each set is a full-width card with oversized weight/reps inputs
- Swipe set card away to log it -- reveals next set card (satisfying gesture-based logging)
- Navigate between exercises by swiping left/right (horizontal page-style navigation with progress dots)
- Pre-fill behavior determined per-exercise by the plan's weight_progression setting:
  - 'manual' exercises pre-fill from plan target weight
  - 'carry_previous' exercises pre-fill from last session's actual values
  - Freestyle exercises have no pre-fill (blank inputs)
- PR tracking on Big 3 by default (baselines from Phase 1), plus user-opted exercises
- PR opt-in lives in the exercise library (Phase 2) -- global "Track PRs" toggle per exercise
- PR metric: max weight ever lifted for that exercise (any rep count)
- First time logging a PR-tracked exercise sets its baseline automatically
- Full-screen celebration overlay when a PR set is logged (brief, bold, unmissable)
- Stats card summary after finishing: duration, total volume (weight x reps), exercises completed, PRs hit
- Post-session weight target prompt: for exercises with weight_progression = 'manual', prompt "What weight next week?" per exercise after session ends
- Exercises with weight_progression = 'carry_previous' skip the prompt -- next session auto-fills from this session's actuals
- End early with confirmation: "You have X exercises remaining. End anyway?" -- saves all completed sets
- No discard option -- once sets are logged, they are saved
- Crash recovery: on relaunch, detect unfinished session and prompt "Resume or start fresh?"

### Claude's Discretion
- Swipe gesture thresholds and card animation details
- Progress dots design for exercise navigation
- Stats card visual layout
- PR celebration overlay design (confetti, bold text, animation style)
- Crash recovery prompt design
- Set card completed state visual treatment
- Keyboard behavior for weight/reps numeric inputs

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WORK-01 | User can start a workout session from a plan or as a freestyle session | workoutStore.startSession() snapshots plan data or creates empty session; route `app/(app)/workout/` with plan_day_id param or freestyle flag |
| WORK-02 | Active workout shows one exercise at a time in focus mode with large tap targets | PagerView for horizontal exercise navigation; oversized TextInput with 48dp+ height for weight/reps; card-per-set layout |
| WORK-03 | User can log weight and reps for each set | Gesture.Pan vertical swipe to log set card; writes to workoutStore immediately (MMKV persisted); set_logs table for Supabase sync |
| WORK-04 | Previous session's weight/reps shown inline while logging | Query last session's set_logs for same exercise_id; display as reference text above/beside current inputs |
| WORK-05 | App auto-detects and flags personal records during a session | Compare logged weight against pr_baselines table max; if exceeded, flag set and show celebration overlay; update pr_baselines |

</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0.11 | Workout session state + crash recovery | Same Zustand + MMKV persist pattern as authStore, exerciseStore |
| react-native-mmkv | ^4.2.0 | Instant set persistence + sync queue buffer | Synchronous writes; no async overhead; 30x faster than AsyncStorage |
| react-native-gesture-handler | ~2.30.0 | Gesture.Pan for swipe-to-log set cards | Already installed; native-thread gesture recognition at 60fps |
| react-native-reanimated | 4.2.1 | Swipe animations, PR celebration, card transitions | Already installed; workletized callbacks for smooth animations |
| @supabase/supabase-js | ^2.99.0 | Background sync for completed sessions | Already used; RLS policies for ownership |
| @react-native-community/netinfo | 11.5.2 | Connectivity detection for sync decisions | Already installed; used for connectivity banner |
| @gorhom/bottom-sheet | ^5.2.8 | Exercise picker for freestyle mode | Already installed; reuse Phase 2 exercise library picker |
| expo-router | ^55.0.4 | Workout screen routing | Already used; new route group `app/(app)/workout/` |
| zod | ^4.3.6 | Validate set log data shape | Already used; runtime validation for JSONB-like structures |

### New for Phase 4
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-pager-view | latest (Expo-compatible) | Horizontal exercise-to-exercise swipe navigation | Exercise navigation in focus mode; native ViewPager/UIPageViewController under the hood |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-pager-view | FlatList horizontal + pagingEnabled | PagerView uses native page controller (better performance, native feel); FlatList paging has edge-case scroll issues |
| MMKV sync queue | TanStack Query mutation queue | TanStack Query is not in the project; MMKV queue is simpler and consistent with existing patterns; avoids adding a major dependency |
| Gesture.Pan for swipe-to-log | Reanimated Swipeable component | Swipeable is designed for row actions (left/right reveals); our swipe-up-to-log is a custom gesture that needs full Gesture.Pan control |
| Separate set_logs table | JSONB array on session_exercises | Set logs need individual timestamps, PR flags, and will be queried independently for history (Phase 5); separate table is correct |

**Installation:**
```bash
npx expo install react-native-pager-view
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  features/
    workout/
      components/
        SetCard.tsx              # Swipeable set card with weight/reps inputs
        ExercisePage.tsx         # Single exercise focus view (set cards + prev performance)
        ExercisePager.tsx        # PagerView wrapper with progress dots
        PreviousPerformance.tsx  # Inline display of last session's values
        PRCelebration.tsx        # Full-screen PR overlay animation
        WorkoutHeader.tsx        # Exercise name, set counter, end workout button
        SessionSummary.tsx       # Post-workout stats card
        WeightTargetPrompt.tsx   # Post-session "what weight next week?" per exercise
        CrashRecoveryPrompt.tsx  # Resume or start fresh dialog
        FreestyleExercisePicker.tsx  # Bottom sheet for adding exercises mid-session
      hooks/
        useWorkoutSession.ts    # Session lifecycle (start, log set, finish, crash recovery)
        usePreviousPerformance.ts  # Fetch last session data for current exercise
        usePRDetection.ts       # Compare logged set against PR baselines
        useSyncQueue.ts         # MMKV write buffer + background Supabase sync
      types.ts                  # WorkoutSession, SessionExercise, SetLog interfaces
      constants.ts              # Swipe thresholds, animation durations
  stores/
    workoutStore.ts             # Active session state with MMKV crash recovery
app/
  (app)/
    workout/
      index.tsx                 # Active workout screen (focus mode)
      summary.tsx               # Post-workout summary + weight target prompts
```

### Pattern 1: Workout Session Store with Crash Recovery
**What:** Zustand store persisted to MMKV that survives app crashes. On app launch, check for `activeSession` in the store and prompt to resume.
**When to use:** Always -- this is the core state management pattern for the active workout.
**Example:**
```typescript
// src/stores/workoutStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { WorkoutSession, SessionExercise, SetLog } from '@/features/workout/types';

const storage = createMMKV({ id: 'workout-storage' });
const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface WorkoutState {
  activeSession: WorkoutSession | null;
  currentExerciseIndex: number;
}

interface WorkoutActions {
  startSession: (session: WorkoutSession) => void;
  logSet: (exerciseId: string, set: SetLog) => void;
  addExercise: (exercise: SessionExercise) => void;
  removeExercise: (exerciseId: string) => void;
  reorderExercises: (exercises: SessionExercise[]) => void;
  setCurrentExerciseIndex: (index: number) => void;
  finishSession: () => WorkoutSession | null;
  discardSession: () => void;
}

export const useWorkoutStore = create<WorkoutState & WorkoutActions>()(
  persist(
    (set, get) => ({
      activeSession: null,
      currentExerciseIndex: 0,

      startSession: (session) => set({
        activeSession: session,
        currentExerciseIndex: 0,
      }),

      logSet: (exerciseId, setLog) => set((s) => {
        if (!s.activeSession) return s;
        return {
          activeSession: {
            ...s.activeSession,
            exercises: s.activeSession.exercises.map((ex) =>
              ex.exercise_id === exerciseId
                ? { ...ex, logged_sets: [...ex.logged_sets, setLog] }
                : ex
            ),
          },
        };
      }),

      addExercise: (exercise) => set((s) => {
        if (!s.activeSession) return s;
        return {
          activeSession: {
            ...s.activeSession,
            exercises: [...s.activeSession.exercises, exercise],
          },
        };
      }),

      removeExercise: (exerciseId) => set((s) => {
        if (!s.activeSession) return s;
        return {
          activeSession: {
            ...s.activeSession,
            exercises: s.activeSession.exercises.filter(
              (ex) => ex.exercise_id !== exerciseId
            ),
          },
        };
      }),

      reorderExercises: (exercises) => set((s) => {
        if (!s.activeSession) return s;
        return {
          activeSession: { ...s.activeSession, exercises },
        };
      }),

      setCurrentExerciseIndex: (index) => set({ currentExerciseIndex: index }),

      finishSession: () => {
        const session = get().activeSession;
        if (session) {
          set({ activeSession: null, currentExerciseIndex: 0 });
          return { ...session, ended_at: new Date().toISOString() };
        }
        return null;
      },

      discardSession: () => set({ activeSession: null, currentExerciseIndex: 0 }),
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

### Pattern 2: Swipe-to-Log Set Card with Gesture.Pan
**What:** Vertical swipe gesture on a set card. Swiping up past a threshold logs the set and reveals the next card.
**When to use:** Every set logging interaction.
**Example:**
```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const SWIPE_THRESHOLD = -120; // negative = swipe up

function SetCard({ set, onLog }: { set: TargetSet; onLog: (weight: number, reps: number) => void }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handleLog = (weight: number, reps: number) => {
    onLog(weight, reps);
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      // Only allow upward swipe
      if (e.translationY < 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY < SWIPE_THRESHOLD) {
        // Swipe past threshold -- log the set
        translateY.value = withTiming(-400, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(handleLog)(weight, reps);
      } else {
        // Snap back
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.setCard, animatedStyle]}>
        {/* Weight and reps inputs */}
      </Animated.View>
    </GestureDetector>
  );
}
```

### Pattern 3: PagerView for Exercise Navigation
**What:** Native horizontal paging between exercises using react-native-pager-view.
**When to use:** Focus mode exercise-to-exercise navigation.
**Example:**
```typescript
import PagerView from 'react-native-pager-view';

function ExercisePager({ exercises, onPageSelected }: Props) {
  const pagerRef = useRef<PagerView>(null);

  return (
    <View style={{ flex: 1 }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => onPageSelected(e.nativeEvent.position)}
      >
        {exercises.map((exercise, index) => (
          <View key={exercise.exercise_id}>
            <ExercisePage exercise={exercise} />
          </View>
        ))}
      </PagerView>
      {/* Progress dots */}
      <ProgressDots total={exercises.length} current={currentIndex} />
    </View>
  );
}
```

**Important:** PagerView children must be direct View children (not fragments). Each child becomes a page. Use `setPage(index)` on the ref to programmatically navigate (e.g., when adding a new exercise in freestyle mode).

### Pattern 4: MMKV Sync Queue
**What:** A simple write buffer that stores pending Supabase operations in MMKV and flushes them when online.
**When to use:** After session completion; individual sets are buffered during the session and batch-synced.
**Example:**
```typescript
// src/features/workout/hooks/useSyncQueue.ts
import { createMMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';

const syncStorage = createMMKV({ id: 'sync-queue' });

interface SyncItem {
  id: string;
  table: string;
  operation: 'insert' | 'upsert';
  data: Record<string, unknown>;
  created_at: string;
}

export function enqueueSyncItem(item: SyncItem) {
  const queue = JSON.parse(syncStorage.getString('pending') ?? '[]');
  queue.push(item);
  syncStorage.set('pending', JSON.stringify(queue));
}

export async function flushSyncQueue(supabase: SupabaseClient) {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  const queue: SyncItem[] = JSON.parse(syncStorage.getString('pending') ?? '[]');
  if (queue.length === 0) return;

  const failed: SyncItem[] = [];
  for (const item of queue) {
    const { error } = await supabase
      .from(item.table)
      [item.operation](item.data as any);
    if (error) {
      failed.push(item);
    }
  }
  syncStorage.set('pending', JSON.stringify(failed));
}
```

### Pattern 5: PR Detection
**What:** After each set is logged, check if the weight exceeds the stored PR baseline for that exercise.
**When to use:** On every set log for PR-tracked exercises.
**Example:**
```typescript
// src/features/workout/hooks/usePRDetection.ts
export function checkForPR(
  exerciseId: string,
  loggedWeight: number,
  prBaselines: PRBaseline[],
  exerciseTracksPR: boolean,
): { isPR: boolean; previousBest: number | null } {
  if (!exerciseTracksPR) return { isPR: false, previousBest: null };

  const baseline = prBaselines.find((pr) => pr.exercise_id === exerciseId);

  if (!baseline) {
    // First time logging -- this IS the baseline
    return { isPR: true, previousBest: null };
  }

  return {
    isPR: loggedWeight > baseline.weight,
    previousBest: baseline.weight,
  };
}
```

**Note:** The pr_baselines table currently uses `exercise_name` (string) as the key. Phase 4 should migrate this to use `exercise_id` (UUID FK to exercises table) for proper relational integrity and to support user-created exercises.

### Pattern 6: Session Snapshot from Plan
**What:** When starting a plan-based workout, snapshot the plan day's exercises into the session. The session is a separate entity -- plan edits after this point do not affect the session.
**When to use:** Every plan-based session start.
**Example:**
```typescript
function startPlanWorkout(planDay: PlanDay, userId: string): WorkoutSession {
  return {
    id: generateUUID(),
    user_id: userId,
    plan_id: planDay.plan_id,
    plan_day_id: planDay.id,
    started_at: new Date().toISOString(),
    ended_at: null,
    exercises: planDay.plan_day_exercises.map((pde, index) => ({
      id: generateUUID(),
      exercise_id: pde.exercise_id,
      exercise_name: pde.exercise?.name ?? 'Unknown',
      sort_order: index,
      target_sets: pde.target_sets,   // Snapshot of plan targets
      weight_progression: pde.weight_progression,
      unit: pde.unit_override ?? userPreferredUnit,
      logged_sets: [],
    })),
  };
}
```

### Anti-Patterns to Avoid
- **Mutating plan tables during workout logging:** Plans and sessions are separate entities. A session snapshots plan data at start time. Never write back to plan_day_exercises from the workout screen (except the post-session weight target prompt for manual progression exercises).
- **Waiting for Supabase response before confirming set log:** Logging must feel instant. Write to MMKV/Zustand first, sync to Supabase in background. Never show a loading spinner for set logging.
- **Using AsyncStorage instead of MMKV for session state:** AsyncStorage is async and slow. MMKV writes are synchronous -- critical for crash recovery where state must be on disk before the next frame.
- **Storing workout session state in React component state:** Session state must survive component unmounts and app crashes. Always use Zustand + MMKV, never useState/useReducer for the session itself.
- **Single MMKV instance for all stores:** Use named instances (`createMMKV({ id: 'workout-storage' })`) to avoid key collisions and keep concerns separated. This is the established project pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal exercise paging | Custom ScrollView with paging math | react-native-pager-view | Native ViewPager (Android) and UIPageViewController (iOS); handles edge gestures, velocity, and deceleration correctly |
| Swipe gesture detection | Custom touch event math | Gesture.Pan from react-native-gesture-handler | Native-thread gesture recognition; handles competing gestures (vertical swipe vs PagerView horizontal swipe) correctly |
| Swipe card animation | Custom Animated.timing | react-native-reanimated useSharedValue + withSpring/withTiming | Runs on UI thread; no bridge delays; 60fps guaranteed |
| Offline sync queue | Custom fetch retry logic | MMKV-backed queue + NetInfo listener | Survives app restarts; NetInfo detects connectivity changes reliably |
| UUID generation | Custom random string | `crypto.randomUUID()` or Supabase `gen_random_uuid()` | Cryptographically random; no collision risk |
| Exercise picker in freestyle mode | New picker component | Reuse Phase 2 exercise library in BottomSheetModal | Already built and tested; consistent UX |

**Key insight:** The swipe-to-log card interaction is the most important UX in the app. It must feel smooth and satisfying. Using Gesture.Pan + Reanimated guarantees native-thread animation performance. Do not attempt this with React Native's JS-thread Animated API.

## Common Pitfalls

### Pitfall 1: PagerView + Gesture.Pan Conflict
**What goes wrong:** Vertical swipe on set card and horizontal swipe between exercises compete for the same touch.
**Why it happens:** Both gesture systems try to claim the touch event.
**How to avoid:** Use `activeOffsetY` on the Pan gesture to require a minimum vertical movement before activating, and `failOffsetX` to release the touch if horizontal movement is detected first. This lets PagerView handle horizontal swipes and Gesture.Pan handle vertical swipes.
```typescript
const pan = Gesture.Pan()
  .activeOffsetY([-15, 15])   // Must move 15px vertically to activate
  .failOffsetX([-10, 10]);    // Release if 10px horizontal detected
```
**Warning signs:** Set card swipe conflicts with exercise navigation; one gesture "steals" from the other.

### Pitfall 2: Keyboard Covers Weight/Reps Inputs
**What goes wrong:** Numeric keyboard opens and hides the input fields the user is trying to type into.
**Why it happens:** Large set cards push inputs below the keyboard fold.
**How to avoid:** Use `KeyboardAvoidingView` with `behavior="padding"` (iOS) or `behavior="height"` (Android). Also consider `keyboardType="decimal-pad"` for weight and `keyboardType="number-pad"` for reps. Use `returnKeyType="done"` to provide a dismiss button.
**Warning signs:** Users can't see what they're typing.

### Pitfall 3: Session Data Loss on Background Kill
**What goes wrong:** iOS or Android kills the app in the background; active session state is lost.
**Why it happens:** React state and in-memory data disappear on process death.
**How to avoid:** Zustand + MMKV persist middleware writes to disk on every state change. Because MMKV writes are synchronous, the data is on disk before the next frame. On app relaunch, the persisted state is automatically rehydrated. Check for `activeSession !== null` on app startup.
**Warning signs:** Users report losing workout progress after switching apps.

### Pitfall 4: PR Detection Race Condition
**What goes wrong:** Multiple sets logged quickly cause duplicate PR celebrations or missed PR updates.
**Why it happens:** PR check reads baseline, but baseline hasn't been updated from the previous set yet.
**How to avoid:** Update PR baseline in Zustand store immediately after detection (optimistic). The Supabase sync happens later. Keep an in-memory "session PR cache" so subsequent sets in the same session compare against the updated value, not the stale Supabase value.
**Warning signs:** Two PR celebrations for the same exercise in one session, or PR not detected when it should be.

### Pitfall 5: Plan Snapshot Stale Data
**What goes wrong:** User starts a workout, but plan data in the local store is outdated.
**Why it happens:** Plan was edited on another device or the store hasn't synced recently.
**How to avoid:** When starting a plan-based workout, read plan data from Supabase if online. Fall back to cached store data if offline. The snapshot is created once at session start and is immutable after that.
**Warning signs:** Session shows wrong exercise order or outdated target weights.

### Pitfall 6: Previous Performance Query is Slow
**What goes wrong:** Loading previous session data for inline display causes visible delay.
**Why it happens:** Querying Supabase for the most recent session with matching exercise_id is a round-trip.
**How to avoid:** Cache last session data locally. When a session completes, store a "last_performance" snapshot per exercise in MMKV. Read from MMKV first; fall back to Supabase query if cache miss.
**Warning signs:** Previous performance shows a loading spinner instead of data.

### Pitfall 7: PagerView Dynamic Children
**What goes wrong:** Adding an exercise mid-session in freestyle mode causes PagerView to lose its position or crash.
**Why it happens:** PagerView may not handle dynamic child additions gracefully on all platforms.
**How to avoid:** After adding an exercise, use `pagerRef.current?.setPage(newIndex)` to navigate to the new exercise. Ensure the PagerView key includes the exercise count to force a re-render when exercises are added or removed.
**Warning signs:** Adding exercise in freestyle mode causes blank page or position jump.

## Code Examples

### Database Schema for Workout Sessions
```sql
-- workout_sessions: one per workout session
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  plan_day_id UUID REFERENCES public.plan_days(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- session_exercises: exercises logged in a session (snapshot from plan or freestyle)
CREATE TABLE public.session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- set_logs: individual sets logged during a session
CREATE TABLE public.set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id UUID NOT NULL REFERENCES public.session_exercises(id) ON DELETE CASCADE,
  set_number SMALLINT NOT NULL,
  weight NUMERIC(6,2) NOT NULL,
  reps SMALLINT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'lbs',  -- 'kg' | 'lbs'
  is_pr BOOLEAN NOT NULL DEFAULT false,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies (same ownership pattern as plans)
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions"
  ON public.workout_sessions FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own session exercises"
  ON public.session_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE id = session_exercises.session_id AND user_id = auth.uid()
    )
  );

ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own set logs"
  ON public.set_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions ws ON ws.id = se.session_id
      WHERE se.id = set_logs.session_exercise_id AND ws.user_id = auth.uid()
    )
  );

-- Index for previous performance lookup
CREATE INDEX idx_session_exercises_exercise_id
  ON public.session_exercises(exercise_id);

CREATE INDEX idx_workout_sessions_user_ended
  ON public.workout_sessions(user_id, ended_at DESC);
```

### TypeScript Interfaces
```typescript
// src/features/workout/types.ts

export interface SetLog {
  id: string;
  set_number: number;
  weight: number;
  reps: number;
  unit: 'kg' | 'lbs';
  is_pr: boolean;
  logged_at: string;
}

export interface SessionExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;     // Snapshot for display
  sort_order: number;
  target_sets: TargetSet[];  // Snapshot from plan (empty for freestyle)
  weight_progression: 'manual' | 'carry_previous' | null; // null for freestyle
  unit: 'kg' | 'lbs';
  logged_sets: SetLog[];
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_day_id: string | null;
  started_at: string;
  ended_at: string | null;
  exercises: SessionExercise[];
}

// For previous performance display
export interface PreviousPerformance {
  exercise_id: string;
  sets: Array<{
    set_number: number;
    weight: number;
    reps: number;
    unit: string;
  }>;
  session_date: string;
}

// For post-session summary
export interface SessionSummary {
  duration_minutes: number;
  total_volume: number;       // sum of weight * reps across all sets
  exercises_completed: number;
  prs_hit: number;
  exercises_with_manual_progression: Array<{
    exercise_id: string;
    exercise_name: string;
    last_weight: number;
    unit: string;
  }>;
}
```

### Crash Recovery Check on App Launch
```typescript
// In app/(app)/_layout.tsx or a top-level provider
import { useWorkoutStore } from '@/stores/workoutStore';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

function useCrashRecovery() {
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const discardSession = useWorkoutStore((s) => s.discardSession);
  const router = useRouter();

  useEffect(() => {
    if (activeSession && activeSession.ended_at === null) {
      Alert.alert(
        'Unfinished Workout',
        'You have a workout in progress. Would you like to resume?',
        [
          {
            text: 'Start Fresh',
            style: 'destructive',
            onPress: () => discardSession(),
          },
          {
            text: 'Resume',
            onPress: () => router.push('/workout'),
          },
        ],
      );
    }
  }, []);
}
```

### Post-Session Weight Target Prompt
```typescript
// After session ends, for 'manual' progression exercises only
function WeightTargetPrompt({ exercises, onSubmit }: Props) {
  // Filter to exercises with weight_progression === 'manual'
  const manualExercises = exercises.filter(
    (ex) => ex.weight_progression === 'manual' && ex.logged_sets.length > 0
  );

  if (manualExercises.length === 0) return null;

  return (
    <View>
      <Text style={s.heading}>Set Your Targets for Next Week</Text>
      {manualExercises.map((ex) => (
        <View key={ex.exercise_id} style={s.row}>
          <Text style={s.exerciseName}>{ex.exercise_name}</Text>
          <Text style={s.lastUsed}>
            Last: {ex.logged_sets[ex.logged_sets.length - 1].weight} {ex.unit}
          </Text>
          <TextInput
            keyboardType="decimal-pad"
            placeholder="Target weight"
            // Save to plan_day_exercises.target_sets for next session
          />
        </View>
      ))}
    </View>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useAnimatedGestureHandler | Gesture.Pan() with worklet callbacks | react-native-gesture-handler v2.x | useAnimatedGestureHandler is deprecated; use Gesture object API |
| Animated.event for gesture tracking | useSharedValue + Gesture callbacks | Reanimated v3+ | All animation runs on UI thread; no bridge |
| AsyncStorage for session state | MMKV synchronous writes | 2023+ standard | Critical for crash recovery; async writes can lose data |
| ViewPagerAndroid (deprecated) | react-native-pager-view | 2021 | Cross-platform native pager; Expo-compatible |
| Custom FlatList paging | PagerView | Current best practice | Native page control behavior; better edge cases |

**Deprecated/outdated:**
- `useAnimatedGestureHandler`: Use `Gesture.Pan()` callbacks directly
- `ViewPagerAndroid`: Removed from React Native core; use react-native-pager-view
- `PanResponder`: Low-level API; prefer react-native-gesture-handler for all gesture work

## Open Questions

1. **PR baselines table schema update**
   - What we know: Current pr_baselines uses `exercise_name` (string). Phase 4 needs `exercise_id` (UUID) to support any exercise, not just Big 3.
   - What's unclear: Whether to migrate the existing table or add a new column alongside exercise_name.
   - Recommendation: Add `exercise_id UUID REFERENCES exercises(id)` column to pr_baselines. Backfill Big 3 exercise_ids from seed data. Keep exercise_name for display. This is a migration in Phase 4.

2. **PR tracking toggle on exercises**
   - What we know: CONTEXT says "PR opt-in lives in the exercise library (Phase 2) -- global Track PRs toggle per exercise."
   - What's unclear: Whether this column exists on the exercises table yet. It was not in the Phase 2 schema.
   - Recommendation: Add `track_prs BOOLEAN DEFAULT false` to exercises table. Set to `true` for the Big 3 exercises in seed data. Users can toggle it from the exercise library. This is a migration in Phase 4.

3. **Post-session weight target storage**
   - What we know: For 'manual' progression exercises, the user sets "what weight next week?" after a session.
   - What's unclear: Where to store this value. It modifies plan_day_exercises.target_sets, which belongs to Phase 3's schema.
   - Recommendation: Update plan_day_exercises.target_sets JSONB with the new target weight. This is a write-back to the plan template, which is acceptable because the user is explicitly choosing their next target. It does not alter historical session data.

4. **Gesture conflict resolution specifics**
   - What we know: PagerView horizontal swipe and Gesture.Pan vertical swipe need to coexist.
   - What's unclear: Exact activeOffsetY/failOffsetX values that feel natural.
   - Recommendation: Start with activeOffsetY=[-15, 15] and failOffsetX=[-10, 10]. Tune through manual testing. These are Claude's Discretion items per CONTEXT.md.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest v29 + jest-expo v55 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest tests/workout/ --bail` |
| Full suite command | `npx jest --bail` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WORK-01 | Start session from plan or freestyle; workoutStore state management | unit | `npx jest tests/workout/workout-store.test.ts -x` | No - Wave 0 |
| WORK-02 | Focus mode exercise paging (store-level: currentExerciseIndex management) | unit | `npx jest tests/workout/workout-store.test.ts -x` | No - Wave 0 |
| WORK-03 | Log set: store updates, set data validation | unit | `npx jest tests/workout/set-logging.test.ts -x` | No - Wave 0 |
| WORK-04 | Previous performance lookup and caching | unit | `npx jest tests/workout/previous-performance.test.ts -x` | No - Wave 0 |
| WORK-05 | PR detection against baselines; baseline update on new PR | unit | `npx jest tests/workout/pr-detection.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest tests/workout/ --bail`
- **Per wave merge:** `npx jest --bail`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/workout/workout-store.test.ts` -- covers WORK-01, WORK-02 (session start, exercise index, finish, crash recovery state)
- [ ] `tests/workout/set-logging.test.ts` -- covers WORK-03 (logSet action, validation, set numbering)
- [ ] `tests/workout/previous-performance.test.ts` -- covers WORK-04 (previous performance lookup, caching)
- [ ] `tests/workout/pr-detection.test.ts` -- covers WORK-05 (PR comparison, baseline updates, first-time baseline)
- [ ] `tests/workout/sync-queue.test.ts` -- covers offline sync (enqueue, flush, retry on failure)

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/stores/authStore.ts`, `src/stores/exerciseStore.ts` -- established Zustand + MMKV persist pattern
- Phase 3 research: `.planning/phases/03-plan-builder/03-RESEARCH.md` -- plan schema (workout_plans, plan_days, plan_day_exercises), weight_progression field
- Phase 4 CONTEXT.md -- locked decisions and Claude's Discretion areas
- [Expo docs - react-native-pager-view](https://docs.expo.dev/versions/latest/sdk/view-pager/) -- installation, basic usage, Expo compatibility
- [react-native-gesture-handler Pan gesture docs](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/pan-gesture/) -- Gesture.Pan API, event properties (translationX/Y, velocityX/Y), activeOffsetY/failOffsetX
- [react-native-reanimated gesture handling](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/handling-gestures/) -- GestureDetector, useSharedValue, workletized callbacks

### Secondary (MEDIUM confidence)
- [MMKV Zustand persist middleware docs](https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_ZUSTAND_PERSIST_MIDDLEWARE.md) -- official MMKV Zustand integration pattern
- [Expo SDK react-native-gesture-handler](https://docs.expo.dev/versions/latest/sdk/gesture-handler/) -- Expo managed workflow compatibility confirmed
- WebSearch for offline-first MMKV sync queue patterns -- multiple sources confirm MMKV-backed queue approach

### Tertiary (LOW confidence)
- Gesture conflict resolution values (activeOffsetY/failOffsetX thresholds) -- need manual testing to tune; initial values are educated estimates
- PagerView dynamic children behavior -- documented to work but edge cases vary by platform; needs testing with freestyle exercise addition

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries either already installed or Expo-compatible with clear docs
- Architecture: HIGH -- follows established project patterns (Zustand + MMKV stores, feature folders, Supabase migrations + RLS)
- Schema design: HIGH -- normalized session/exercise/set_logs structure is standard for workout tracking
- Gesture implementation: MEDIUM -- Gesture.Pan + PagerView coexistence is well-documented but conflict resolution thresholds need tuning
- Offline sync: MEDIUM -- MMKV sync queue pattern is proven but project-specific implementation needs testing
- PR detection: HIGH -- simple max-weight comparison with baseline update; well-defined requirements

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain; no fast-moving dependencies)
