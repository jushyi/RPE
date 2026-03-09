# Phase 2: Exercise Library - Research

**Researched:** 2026-03-09
**Domain:** React Native exercise data layer, searchable list UI, bottom sheet modals, Supabase schema + RLS
**Confidence:** HIGH

## Summary

Phase 2 builds the exercise library -- the foundational data layer all future phases reference. It involves three distinct concerns: (1) a Supabase `exercises` table with seed data delivered via migration, RLS policies supporting both global (seed) and user-owned (custom) exercises, (2) a searchable/filterable list screen with filter chips for muscle groups and equipment, and (3) a bottom sheet modal for CRUD operations on custom exercises.

The project already uses Expo SDK 55, React Native 0.83, Supabase, Zustand with MMKV persistence, and react-native-reanimated. The existing codebase has clear patterns: StyleSheet.create for styling, feature-based folder structure (`src/features/`), Supabase migrations in `supabase/migrations/`, and manual Database types in `src/lib/supabase/types/database.ts`. The tab layout currently uses a Stack navigator and needs to be converted to an actual Tabs navigator to add the Exercise Library tab.

**Primary recommendation:** Use `@gorhom/bottom-sheet` v5 for the bottom sheet (requires adding `react-native-gesture-handler`), a Zustand store for exercise state, FlatList for the exercise list, and a Supabase migration with INSERT statements for seed data.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- ~30-40 core essential exercises covering major compound and common isolation lifts
- Organized by detailed muscle groups (Biceps, Triceps, Quads, Hamstrings, Lats, Delts, Chest, Glutes, Calves, Core, Traps, Forearms, etc.)
- Equipment type is a required field: Barbell, Dumbbell, Cable, Machine, Bodyweight, etc.
- Data model: global seed exercises (user_id = null) + user-owned custom exercises, merged in library view
- Delivered via Supabase migration (seed SQL)
- Search bar at top for text search by name
- Two rows of horizontal scrollable filter chips: muscle groups on top, equipment types below
- Filters are combinable (e.g., Chest + Dumbbell shows only chest dumbbell exercises)
- Search narrows results within active filters
- Custom exercises show a subtle "Custom" badge to distinguish from seed exercises
- Navigation: dedicated tab in bottom navigation for standalone browsing, plus component reuse as inline picker in Phase 3
- Bottom sheet modal for custom exercise creation (slides up from bottom)
- Fields: name (required), muscle group (required picker), equipment type (required picker), notes (optional freeform)
- Duplicate name validation: warn if name matches existing exercise, but allow saving anyway
- Full CRUD: edit reopens bottom sheet pre-filled, delete via swipe or long-press menu
- Custom exercises persist to Supabase with user_id and sync across devices
- List items show: exercise name (primary text), muscle group (subtitle), equipment badge (chip)
- No detail view in Phase 2
- Muscle group badges are color-coded
- Equipment badges use neutral/uniform style
- Empty/filter-no-results state: friendly illustration + message + prominent "Add Exercise" button

### Claude's Discretion
- Exact muscle group color assignments
- Filter chip styling and scroll behavior
- Bottom sheet animation and dismiss behavior
- Specific seed exercise selection within the ~30-40 target
- List item spacing, typography, and Card component adaptation
- Swipe vs long-press menu implementation for edit/delete

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXER-01 | App ships with pre-loaded library of common exercises (searchable by muscle group) | Supabase migration with seed INSERT, exercises table schema, FlatList with search/filter, Zustand store for state |
| EXER-02 | User can create custom exercises with name, muscle group, and equipment type | Bottom sheet modal via @gorhom/bottom-sheet, Supabase INSERT with user_id, RLS policies for ownership |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @gorhom/bottom-sheet | ^5 | Bottom sheet modal for exercise CRUD | De facto standard for RN bottom sheets; uses Reanimated v3 + Gesture Handler v2; works with Expo SDK 55 when expo-router is installed (this project has it) |
| react-native-gesture-handler | ^2 | Required peer dep for bottom-sheet | Not currently installed; needed for swipe/gesture interactions |
| zustand | 5.0.11 (installed) | Exercise store with MMKV persistence | Already used for authStore; same pattern |
| @supabase/supabase-js | 2.99.0 (installed) | Exercise table CRUD operations | Already configured with typed client |
| react-native-reanimated | 4.2.1 (installed) | Bottom sheet animations | Already installed |
| zod | 4.3.6 (installed) | Form validation for custom exercise | Already used in auth forms |
| react-hook-form | 7.71.2 (installed) | Form state management | Already used in auth forms |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-router | 55.0.4 (installed) | Tab navigation for exercise library screen | Convert existing Stack to Tabs layout |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @gorhom/bottom-sheet | React Native Modal | Modal lacks gesture-driven dismiss, snap points, keyboard handling; bottom-sheet is significantly better UX |
| @gorhom/bottom-sheet | Custom Reanimated bottom sheet | High effort to hand-roll keyboard avoidance, snap points, backdrop; library handles edge cases |
| FlatList | FlashList | FlashList (Shopify) is faster for large lists but adds dependency; 30-70 items is well within FlatList performance range |

**Installation:**
```bash
npx expo install @gorhom/bottom-sheet react-native-gesture-handler
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── features/
│   └── exercises/
│       ├── components/
│       │   ├── ExerciseListItem.tsx      # Single exercise row
│       │   ├── ExerciseFilterBar.tsx      # Search + filter chips
│       │   ├── ExerciseBottomSheet.tsx    # Create/edit form bottom sheet
│       │   ├── MuscleGroupBadge.tsx       # Color-coded muscle group chip
│       │   ├── EquipmentBadge.tsx         # Neutral equipment chip
│       │   └── EmptyState.tsx             # No results illustration
│       ├── constants/
│       │   ├── muscleGroups.ts            # Muscle group enum + color map
│       │   ├── equipmentTypes.ts          # Equipment type enum
│       │   └── seedExercises.ts           # Seed data reference (for TS types)
│       ├── hooks/
│       │   └── useExercises.ts            # Data fetching + CRUD operations
│       └── types.ts                       # Exercise interfaces
├── stores/
│   └── exerciseStore.ts                   # Zustand store for exercises
├── lib/supabase/
│   └── types/
│       └── database.ts                    # Extended with exercises table
app/(app)/(tabs)/
├── _layout.tsx                            # Convert Stack to Tabs navigator
├── dashboard.tsx                          # Existing
└── exercises.tsx                          # Exercise library screen
supabase/migrations/
└── 20260310000000_create_exercises.sql    # Schema + seed data
```

### Pattern 1: Zustand Exercise Store (matches authStore pattern)
**What:** Centralized exercise state with MMKV persistence for offline access
**When to use:** All exercise data access flows through this store
**Example:**
```typescript
// Follow exact pattern from src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'exercise-storage' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface ExerciseState {
  exercises: Exercise[];
  isLoading: boolean;
  lastFetched: number | null;
}

interface ExerciseActions {
  setExercises: (exercises: Exercise[]) => void;
  addExercise: (exercise: Exercise) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  removeExercise: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useExerciseStore = create<ExerciseState & ExerciseActions>()(
  persist(
    (set) => ({
      exercises: [],
      isLoading: false,
      lastFetched: null,
      setExercises: (exercises) => set({ exercises, lastFetched: Date.now() }),
      addExercise: (exercise) => set((s) => ({ exercises: [...s.exercises, exercise] })),
      updateExercise: (id, updates) => set((s) => ({
        exercises: s.exercises.map((e) => e.id === id ? { ...e, ...updates } : e),
      })),
      removeExercise: (id) => set((s) => ({
        exercises: s.exercises.filter((e) => e.id !== id),
      })),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    { name: 'exercise-storage', storage: createJSONStorage(() => mmkvStorage) }
  )
);
```

### Pattern 2: Supabase Migration with Seed Data
**What:** Single migration creates table, RLS policies, indexes, and inserts seed exercises
**When to use:** Database schema for exercises
**Example:**
```sql
-- Follow pattern from existing migrations
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = global seed
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Everyone can read global exercises (user_id IS NULL)
CREATE POLICY "Anyone can read global exercises"
  ON public.exercises FOR SELECT
  USING (user_id IS NULL);

-- Users can read their own custom exercises
CREATE POLICY "Users can read own exercises"
  ON public.exercises FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own exercises
CREATE POLICY "Users can insert own exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own exercises
CREATE POLICY "Users can update own exercises"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own exercises
CREATE POLICY "Users can delete own exercises"
  ON public.exercises FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_exercises_user_id ON public.exercises(user_id);
CREATE INDEX idx_exercises_muscle_group ON public.exercises(muscle_group);

-- Seed data (user_id = NULL for global exercises)
INSERT INTO public.exercises (name, muscle_group, equipment, user_id) VALUES
  ('Bench Press', 'Chest', 'Barbell', NULL),
  ('Incline Bench Press', 'Chest', 'Barbell', NULL),
  -- ... etc
```

### Pattern 3: Tab Navigator Conversion
**What:** Convert the current Stack-based tabs layout to actual Expo Router Tabs
**When to use:** Adding the Exercise Library tab alongside Dashboard
**Example:**
```typescript
// app/(app)/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceElevated,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Home', tabBarIcon: /* unicode or simple view */ }}
      />
      <Tabs.Screen
        name="exercises"
        options={{ title: 'Exercises', tabBarIcon: /* unicode or simple view */ }}
      />
    </Tabs>
  );
}
```

### Pattern 4: Bottom Sheet with GestureHandlerRootView
**What:** @gorhom/bottom-sheet requires GestureHandlerRootView wrapping the app
**When to use:** Must wrap at root layout level
**Example:**
```typescript
// app/_layout.tsx — wrap existing layout
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        {/* existing Slot/Stack */}
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```

### Pattern 5: Searchable Filtered FlatList
**What:** FlatList with useMemo-based filtering for search + muscle group + equipment
**When to use:** Exercise library main screen
**Example:**
```typescript
const filteredExercises = useMemo(() => {
  let result = exercises;
  if (selectedMuscleGroup) {
    result = result.filter((e) => e.muscle_group === selectedMuscleGroup);
  }
  if (selectedEquipment) {
    result = result.filter((e) => e.equipment === selectedEquipment);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter((e) => e.name.toLowerCase().includes(q));
  }
  return result;
}, [exercises, selectedMuscleGroup, selectedEquipment, searchQuery]);
```

### Anti-Patterns to Avoid
- **Server-side filtering for small datasets:** With only 30-70 exercises total, client-side filtering via useMemo is faster and simpler than making Supabase queries per filter change. Fetch all once, filter in memory.
- **Separate MMKV instance IDs missing:** When creating a second MMKV store, use a unique `id` parameter in `createMMKV({ id: 'exercise-storage' })` to avoid colliding with the auth store's default instance.
- **Fetching on every screen focus:** Fetch on mount, cache in Zustand/MMKV. Re-fetch only on pull-to-refresh or after mutations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet modal | Custom animated modal with PanResponder | @gorhom/bottom-sheet v5 | Keyboard avoidance, snap points, gesture dismiss, backdrop, accessibility -- dozens of edge cases |
| Gesture-driven swipe-to-delete | Custom PanResponder swipe handler | react-native-gesture-handler Swipeable or long-press context menu | Native feel, performance on UI thread via Reanimated |
| Form validation | Manual validation logic | zod + react-hook-form (already installed) | Consistent with Phase 1 auth forms; handles edge cases |
| UUID generation (client) | Math.random-based ID | `gen_random_uuid()` in Postgres | Server-generated UUIDs via Supabase insert; no client UUID needed |

**Key insight:** The exercise library's complexity is in the UX polish (filter chips, bottom sheet, swipe actions) not the data model. Use libraries for gesture/animation work; hand-write the simple data layer.

## Common Pitfalls

### Pitfall 1: RLS Policies for Mixed-Ownership Data
**What goes wrong:** Queries return only global OR only custom exercises, not both merged
**Why it happens:** A single SELECT policy with `OR` logic can be tricky. Two separate policies (one for global, one for user-owned) is cleaner because Postgres ORs multiple SELECT policies together automatically.
**How to avoid:** Create two separate SELECT policies: one with `USING (user_id IS NULL)` for global exercises and one with `USING (auth.uid() = user_id)` for user-owned. Postgres evaluates them as OR.
**Warning signs:** User sees seed exercises but not custom ones, or vice versa.

### Pitfall 2: GestureHandlerRootView Missing
**What goes wrong:** @gorhom/bottom-sheet renders but gestures don't work (can't dismiss, can't scroll content inside sheet)
**Why it happens:** react-native-gesture-handler v2 requires GestureHandlerRootView at the root of the app
**How to avoid:** Wrap at app/_layout.tsx level, not at the screen level. Must be the outermost View.
**Warning signs:** Bottom sheet appears but is unresponsive to swipe/drag gestures.

### Pitfall 3: Tab Navigator Icon Imports
**What goes wrong:** Using @expo/vector-icons causes build issues or bloat
**Why it happens:** Phase 1 decision was to use unicode text instead of @expo/vector-icons
**How to avoid:** Follow existing pattern -- use unicode characters or simple View-based icons for tab bar. Example: use text-based icons like the HeaderCloudIcon pattern.
**Warning signs:** New dependency added for icons when project specifically avoided it.

### Pitfall 4: MMKV Storage ID Collision
**What goes wrong:** Exercise store data corrupts auth store data or vice versa
**Why it happens:** Default MMKV instance is shared; authStore uses `createMMKV()` without an ID
**How to avoid:** Use `createMMKV({ id: 'exercise-storage' })` for the exercise store. Note: authStore uses the default instance -- this is fine as long as exercise store uses a different one.
**Warning signs:** Logging out clears exercise cache, or exercise writes corrupt auth state.

### Pitfall 5: Bottom Sheet + Keyboard on Android
**What goes wrong:** Bottom sheet content gets hidden behind keyboard when typing exercise name
**Why it happens:** Android keyboard behavior differs from iOS; bottom sheet needs explicit keyboard handling
**How to avoid:** @gorhom/bottom-sheet has built-in `keyboardBehavior="interactive"` and `android_keyboardInputMode="adjustResize"` props. Use `BottomSheetTextInput` instead of regular TextInput inside the sheet.
**Warning signs:** Form fields not visible when keyboard opens on Android.

### Pitfall 6: Duplicate Exercise Name UX
**What goes wrong:** User creates "Bench Press" (same as seed) and gets confused
**Why it happens:** Requirement says warn but allow -- need to implement a non-blocking warning
**How to avoid:** On name blur or submit, query existing exercises and show an inline warning text (not a blocking alert). Let form submit proceed.
**Warning signs:** Blocking alert disrupts flow, or no warning at all.

## Code Examples

### Exercise Type Definitions
```typescript
// src/features/exercises/types.ts
export type MuscleGroup =
  | 'Chest' | 'Back' | 'Shoulders'
  | 'Biceps' | 'Triceps' | 'Forearms'
  | 'Quads' | 'Hamstrings' | 'Glutes' | 'Calves'
  | 'Core' | 'Traps';

export type Equipment =
  | 'Barbell' | 'Dumbbell' | 'Cable'
  | 'Machine' | 'Bodyweight' | 'Kettlebell'
  | 'Band' | 'Other';

export interface Exercise {
  id: string;
  user_id: string | null;  // null = global seed exercise
  name: string;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Helper to check if exercise is custom (user-created)
export const isCustomExercise = (exercise: Exercise): boolean =>
  exercise.user_id !== null;
```

### Muscle Group Color Map
```typescript
// src/features/exercises/constants/muscleGroups.ts
import type { MuscleGroup } from '../types';

export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  Chest: '#ef4444',      // red
  Back: '#3b82f6',       // blue
  Shoulders: '#f59e0b',  // amber
  Biceps: '#8b5cf6',     // violet
  Triceps: '#ec4899',    // pink
  Forearms: '#f97316',   // orange
  Quads: '#22c55e',      // green
  Hamstrings: '#14b8a6', // teal
  Glutes: '#e11d48',     // rose
  Calves: '#06b6d4',     // cyan
  Core: '#eab308',       // yellow
  Traps: '#6366f1',      // indigo
};

export const MUSCLE_GROUPS: MuscleGroup[] = Object.keys(MUSCLE_GROUP_COLORS) as MuscleGroup[];
```

### Supabase Fetch Hook
```typescript
// src/features/exercises/hooks/useExercises.ts
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useAuthStore } from '@/stores/authStore';
import type { Exercise } from '../types';

export function useExercises() {
  const { exercises, setExercises, addExercise, updateExercise, removeExercise, setLoading } = useExerciseStore();
  const userId = useAuthStore((s) => s.userId);

  const fetchExercises = useCallback(async () => {
    if (!supabase || !userId) return;
    setLoading(true);
    try {
      // RLS policies handle returning global + user-owned exercises
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      if (error) throw error;
      setExercises(data as Exercise[]);
    } catch (err) {
      console.warn('Failed to fetch exercises:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createExercise = useCallback(async (exercise: Omit<Exercise, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!supabase || !userId) return;
    const { data, error } = await supabase
      .from('exercises')
      .insert({ ...exercise, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    addExercise(data as Exercise);
    return data;
  }, [userId]);

  // Similar patterns for update and delete...

  return { exercises, fetchExercises, createExercise };
}
```

### Database Type Extension
```typescript
// Extend src/lib/supabase/types/database.ts
export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  muscle_group: string;
  equipment: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Add to Database interface:
exercises: {
  Row: Exercise;
  Insert: Omit<Exercise, 'id' | 'created_at' | 'updated_at'> & {
    id?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<Omit<Exercise, 'id' | 'user_id' | 'created_at'>> & {
    updated_at?: string;
  };
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @gorhom/bottom-sheet v4 | v5 (Reanimated v3 + GH v2) | 2024 | Breaking API changes; use v5 patterns |
| react-native-gesture-handler v1 | v2 with GestureHandlerRootView | 2023 | Must wrap root; v1 auto-installed on root view |
| NativeWind className | StyleSheet.create | Phase 1 decision | All components use StyleSheet; do NOT use NativeWind |
| createMMKV() no args | createMMKV({ id }) for multiple stores | MMKV v4 | Use named instances when multiple stores exist |

## Open Questions

1. **Icon library for tab bar**
   - What we know: Phase 1 used unicode text for HeaderCloudIcon, avoiding @expo/vector-icons
   - What's unclear: Whether unicode characters provide adequate tab bar icons (home, dumbbell/library icon)
   - Recommendation: Use simple unicode characters or basic View-based shapes; if inadequate, @expo/vector-icons is already bundled with Expo and zero-cost to import

2. **Swipe-to-delete vs long-press menu**
   - What we know: Both are viable; user left this to Claude's discretion
   - Recommendation: Use long-press context menu (Alert.alert with Edit/Delete options) -- simpler to implement, more discoverable, and avoids needing Swipeable from react-native-gesture-handler which adds complexity. Swipe can be added later.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 55 + @testing-library/react-native 13 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --bail` |
| Full suite command | `npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXER-01 | Exercises load from Supabase and are searchable/filterable | unit | `npx jest tests/exercises/exercise-library.test.ts --bail` | No - Wave 0 |
| EXER-01 | Seed exercises present after migration | manual | Run `supabase db reset` and verify via Supabase Studio | N/A manual |
| EXER-02 | Custom exercise CRUD operations via Supabase | unit | `npx jest tests/exercises/exercise-crud.test.ts --bail` | No - Wave 0 |
| EXER-02 | Exercise store persists and updates correctly | unit | `npx jest tests/exercises/exercise-store.test.ts --bail` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --bail`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/exercises/exercise-library.test.ts` -- covers EXER-01 (fetch, filter, search)
- [ ] `tests/exercises/exercise-crud.test.ts` -- covers EXER-02 (create, update, delete)
- [ ] `tests/exercises/exercise-store.test.ts` -- covers store state management
- [ ] `tests/__mocks__/supabase.ts` -- mock Supabase client for exercise queries (may already be partially covered by existing setup)

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `src/stores/authStore.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/types/database.ts`, `supabase/migrations/`, `app/(app)/(tabs)/_layout.tsx`
- Expo Router Tabs documentation -- file-based routing convention
- Supabase RLS documentation -- multiple SELECT policies are OR'd together

### Secondary (MEDIUM confidence)
- [@gorhom/bottom-sheet GitHub](https://github.com/gorhom/react-native-bottom-sheet) -- v5 API, Expo SDK 55 compatibility (confirmed by [SDK 55 issue](https://github.com/expo/expo/issues/42886) showing expo-router resolves crash)
- [@gorhom/bottom-sheet docs](https://gorhom.dev/react-native-bottom-sheet/) -- BottomSheetModal API, keyboard handling

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries either already installed or well-established in Expo ecosystem
- Architecture: HIGH -- follows exact patterns from existing Phase 1 codebase
- Pitfalls: HIGH -- RLS pitfall verified against Supabase docs; GestureHandlerRootView requirement confirmed by library docs; MMKV collision verified by inspecting authStore code

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable -- no fast-moving dependencies)
