# Phase 7: Body Metrics - Research

**Researched:** 2026-03-10
**Domain:** Body measurement logging, Supabase schema design, dashboard card integration, tabbed detail screen
**Confidence:** HIGH

## Summary

Phase 7 adds body measurement tracking (chest, waist, hips, body fat %) to the existing app. Progress photos have been removed from scope per user decision. The phase creates a new `body_measurements` Supabase table, a combined "Body" dashboard card that merges with the Phase 6 bodyweight card, and a full detail screen with Charts and History tabs. The detail screen includes an entry form for logging measurements plus per-measurement trend charts using the same Victory Native XL charting stack from Phase 6.

The implementation is straightforward: a new Supabase table with RLS, a Zustand+MMKV store following the existing pattern (historyStore, planStore), a dashboard card component, and a stack screen for the detail view. The charting reuses Phase 6 infrastructure (Victory Native XL CartesianChart + Line). The sub-tab pattern (Charts | History) reuses the approach from Phase 5 history.

**Primary recommendation:** Build a single `body_measurements` table storing all 4 measurements per entry (sparse -- nulls for unfilled fields). Reuse Phase 6 charting patterns verbatim. Use PagerView for Charts/History tabs consistent with Phase 5.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Core 4 measurements: chest, waist, hips, body fat %
- Circumference measurements support inches or cm via per-input unit selector (consistent with Phase 6 bodyweight pattern)
- Body fat % is unitless (percentage)
- All-at-once form showing all 4 measurement fields plus bodyweight
- User fills in whichever fields they want, leaves others blank
- Date picker for entry date (defaults to today)
- Unit selector shown on every numeric input
- Merges with Phase 6 bodyweight card into a single "Body" card on dashboard
- Shows latest bodyweight + latest measurement values (compact) + sparkline for bodyweight trend
- Tap to open full body metrics detail screen
- Two tabs within the detail screen: Charts tab (entry form + per-measurement trend charts) and History tab (reverse-chronological list)
- Can edit/delete existing entries from history tab (with confirmation dialog, consistent with Phase 5 pattern)
- No new bottom tab -- body metrics accessed from the combined dashboard card
- Full detail screen is a stack screen (not a tab), navigated to from dashboard

### Claude's Discretion
- Chart library reuse from Phase 6 for measurement trend charts
- Measurement form field ordering and layout
- Combined card layout and sparkline implementation
- Empty state copy when no measurements logged
- How bodyweight quick-add integrates with the combined card (Phase 6 designed a quick-add button)
- Chart time range controls (reuse Phase 6 pattern or simplify)

### Deferred Ideas (OUT OF SCOPE)
- Progress photos (front/side/back with Supabase Storage) -- removed from Phase 7, could be a future phase if desired
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HIST-04 | User can log body measurements (circumference, body fat %) | New body_measurements table with RLS; all-at-once form with per-input unit selector; sparse storage (null for unfilled fields); Zustand+MMKV store for offline cache |
| HIST-05 | User can take and view progress photos (front/side/back with date) | DEFERRED per user decision in CONTEXT.md -- progress photos removed from Phase 7 scope. HIST-05 will NOT be addressed in this phase. |
</phase_requirements>

## Standard Stack

### Core (all already installed or from Phase 6)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| victory-native | ^41.19 | CartesianChart + Line for per-measurement trend charts | Phase 6 standard; Skia-powered, GPU-accelerated |
| @shopify/react-native-skia | (via expo install) | Rendering engine for charts | Phase 6 dependency, already configured |
| react-native-pager-view | 8.0.0 | Charts/History tab swiping | Already installed; used in Phase 4/5 for similar tab patterns |
| zustand | ^5.0.11 | Body measurements store | Project standard for all stores |
| react-native-mmkv | ^4.2.0 | Offline persistence for measurements cache | Project standard, paired with zustand |
| @gorhom/bottom-sheet | ^5.2.8 | Date picker or measurement entry sheet (if needed) | Already installed |

### Already Installed (no new dependencies needed)
| Library | Version | Purpose |
|---------|---------|---------|
| expo-haptics | ~55.0.8 | Delete confirmation feedback |
| @expo/vector-icons (Ionicons) | bundled | Icons for tabs, cards, buttons |
| react-hook-form + zod | 7.71 / 4.3 | Form validation for measurement entry |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sparse single-row storage | Separate table per measurement type | Sparse is simpler (one insert per entry), separate tables add joins for no benefit when there are only 4 fields |
| PagerView tabs | ScrollView with manual tab indicator | PagerView already used in project, gives swipeable behavior for free |

**Installation:**
```bash
# No new packages needed -- all dependencies come from Phase 6 or are already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── features/
│   ├── body-metrics/              # NEW: body measurements feature
│   │   ├── components/
│   │   │   ├── MeasurementForm.tsx        # All-at-once entry form (4 measurements + bodyweight)
│   │   │   ├── MeasurementChart.tsx       # Single measurement trend chart (reuse Phase 6 pattern)
│   │   │   ├── MeasurementHistoryList.tsx  # Reverse-chronological entry list
│   │   │   ├── MeasurementHistoryItem.tsx  # Single history row with edit/delete
│   │   │   └── BodyCard.tsx               # Combined dashboard card (bodyweight + measurements)
│   │   ├── hooks/
│   │   │   ├── useBodyMeasurements.ts     # CRUD operations against Supabase + store
│   │   │   └── useBodyMetricsChartData.ts # Transform measurement data for Victory charts
│   │   └── types.ts                       # BodyMeasurement type
├── stores/
│   └── bodyMeasurementStore.ts    # NEW: Zustand + MMKV for measurements cache
supabase/
└── migrations/
    └── 2026XXXXXXXXXX_create_body_measurements.sql  # NEW
app/
└── (app)/
    └── body-metrics.tsx           # NEW: full detail screen (stack screen)
```

### Pattern 1: Sparse Measurement Row
**What:** Store all measurements in one row per entry, with nullable columns for unfilled fields
**When to use:** The body_measurements table design
**Example:**
```typescript
// Types
interface BodyMeasurement {
  id: string;
  user_id: string;
  chest: number | null;
  chest_unit: 'in' | 'cm' | null;
  waist: number | null;
  waist_unit: 'in' | 'cm' | null;
  hips: number | null;
  hips_unit: 'in' | 'cm' | null;
  body_fat_pct: number | null;
  measured_at: string; // DATE
  created_at: string;
}
```

### Pattern 2: Per-Input Unit Selector (Phase 6 Bodyweight Pattern)
**What:** Each numeric input has its own unit toggle right beside it
**When to use:** Every circumference measurement field (chest, waist, hips)
**Example:**
```typescript
// Inline unit selector beside each measurement input
<View style={s.fieldRow}>
  <Text style={s.fieldLabel}>Chest</Text>
  <View style={s.inputGroup}>
    <TextInput
      style={s.numericInput}
      keyboardType="decimal-pad"
      value={chest}
      onChangeText={setChest}
      placeholder="--"
    />
    <Pressable
      onPress={() => setChestUnit(u => u === 'in' ? 'cm' : 'in')}
      style={s.unitToggle}
    >
      <Text style={s.unitText}>{chestUnit}</Text>
    </Pressable>
  </View>
</View>
```

### Pattern 3: Zustand + MMKV Store (Project Standard)
**What:** Measurement cache store following exact same pattern as historyStore
**When to use:** All body measurement state management
**Example:**
```typescript
// Follows historyStore.ts pattern exactly
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'body-measurement-storage' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface BodyMeasurementState {
  measurements: BodyMeasurement[];
  isLoading: boolean;
  lastFetched: number | null;
}

interface BodyMeasurementActions {
  setMeasurements: (m: BodyMeasurement[]) => void;
  addMeasurement: (m: BodyMeasurement) => void;
  updateMeasurement: (id: string, updates: Partial<BodyMeasurement>) => void;
  removeMeasurement: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useBodyMeasurementStore = create<BodyMeasurementState & BodyMeasurementActions>()(
  persist(
    (set) => ({
      measurements: [],
      isLoading: false,
      lastFetched: null,
      setMeasurements: (measurements) => set({ measurements, lastFetched: Date.now() }),
      addMeasurement: (m) => set((s) => ({ measurements: [m, ...s.measurements] })),
      updateMeasurement: (id, updates) => set((s) => ({
        measurements: s.measurements.map((m) => m.id === id ? { ...m, ...updates } : m),
      })),
      removeMeasurement: (id) => set((s) => ({
        measurements: s.measurements.filter((m) => m.id !== id),
      })),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'body-measurement-storage',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

### Pattern 4: PagerView Sub-Tabs (Phase 5 Pattern)
**What:** Swipeable Charts | History tabs within the detail screen
**When to use:** Body metrics detail screen tab navigation
**Example:**
```typescript
import PagerView from 'react-native-pager-view';

const [activeTab, setActiveTab] = useState(0);
const pagerRef = useRef<PagerView>(null);

<View style={s.tabBar}>
  {['Charts', 'History'].map((label, i) => (
    <Pressable
      key={label}
      onPress={() => { setActiveTab(i); pagerRef.current?.setPage(i); }}
      style={[s.tab, activeTab === i && s.tabActive]}
    >
      <Text style={[s.tabText, activeTab === i && s.tabTextActive]}>{label}</Text>
    </Pressable>
  ))}
</View>
<PagerView
  ref={pagerRef}
  style={{ flex: 1 }}
  initialPage={0}
  onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}
>
  <View key="charts">{/* Charts tab content */}</View>
  <View key="history">{/* History tab content */}</View>
</PagerView>
```

### Pattern 5: Dashboard Card with Navigation
**What:** Combined Body card that displays summary and navigates to detail on tap
**When to use:** Dashboard body card
**Example:**
```typescript
import { useRouter } from 'expo-router';

function BodyCard({ latestWeight, latestMeasurements, chartData }) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push('/(app)/body-metrics')}>
      <Card title="Body">
        {/* Latest bodyweight */}
        <View style={s.row}>
          <Text style={s.label}>Weight</Text>
          <Text style={s.value}>{latestWeight?.weight} {latestWeight?.unit}</Text>
        </View>
        {/* Latest measurements (compact) */}
        {latestMeasurements?.chest && (
          <View style={s.row}>
            <Text style={s.label}>Chest</Text>
            <Text style={s.value}>{latestMeasurements.chest} {latestMeasurements.chest_unit}</Text>
          </View>
        )}
        {/* Sparkline for bodyweight trend */}
        {chartData.length > 1 && <Sparkline data={chartData} />}
      </Card>
    </Pressable>
  );
}
```

### Anti-Patterns to Avoid
- **Separate table per measurement type:** Over-normalized for 4 fields. One sparse row is simpler and faster to query.
- **Storing unit preference globally instead of per-entry:** Users may switch units between entries. Store unit alongside each value, same as bodyweight pattern.
- **Building a custom date picker:** Use `@react-native-community/datetimepicker` if a native picker is needed, or a simple text-based date selector. Do not hand-roll calendar UI.
- **Fetching all measurements for charts client-side then filtering:** Use SQL WHERE clause on date range. For Phase 7 with small datasets this is less critical than Phase 6 exercise charts, but follow the pattern anyway.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Trend line charts | Custom SVG/Canvas drawing | Victory Native CartesianChart + Line (Phase 6 pattern) | Axis scaling, ticks, animation all solved |
| Swipeable tabs | Custom gesture + animated view | PagerView (already installed) | Battle-tested, consistent with Phase 5 |
| Date picking | Custom calendar component | @react-native-community/datetimepicker or simple date input | Native pickers handle locale, accessibility |
| Unit conversion | Inline conversion math scattered everywhere | Centralized converter util | 1 in = 2.54 cm; keep in one place, test once |
| Confirmation dialogs | Custom modal for delete | Alert.alert (Phase 5 pattern) | Consistent with existing delete flows |

**Key insight:** Nearly every UI pattern needed for this phase already exists in the codebase. The main new work is the database table, the measurement form, and wiring chart data to existing chart components.

## Common Pitfalls

### Pitfall 1: Mixed Units in Chart Data
**What goes wrong:** Chart shows jagged/nonsensical trend because some entries are in inches and others in cm
**Why it happens:** User logs chest as 42 inches one day, then 107 cm another day
**How to avoid:** When fetching chart data, convert all values to a single display unit before plotting. Store the original unit per entry. Apply conversion: 1 in = 2.54 cm. Let user choose display unit via the unit toggle.
**Warning signs:** Sudden 2.5x jumps in measurement charts.

### Pitfall 2: Bodyweight Card Integration Timing
**What goes wrong:** Phase 7 builds the combined Body card but Phase 6 hasn't been implemented yet
**Why it happens:** Phase 7 depends on Phase 6's bodyweight_logs table and BodyweightCard
**How to avoid:** Plan 07-01 should assume Phase 6's bodyweight infrastructure exists. If building in sequence, Phase 6 must complete first. The combined card should import and extend Phase 6's existing bodyweight hook.
**Warning signs:** Import errors for bodyweight hooks/stores that don't exist yet.

### Pitfall 3: Sparse Form Validation
**What goes wrong:** User submits form with all fields blank (no measurements at all)
**Why it happens:** The form allows leaving fields blank, so there's no per-field required validation
**How to avoid:** Validate that at least one measurement field is filled before allowing save. Show inline error: "Enter at least one measurement."
**Warning signs:** Empty rows appearing in history with no useful data.

### Pitfall 4: Date Uniqueness Conflict
**What goes wrong:** User tries to log measurements for a date that already has an entry, gets a database error
**Why it happens:** UNIQUE constraint on (user_id, measured_at) prevents duplicate dates
**How to avoid:** Either use UPSERT (ON CONFLICT UPDATE) to merge with existing entry, or check for existing entry and offer to edit it instead. Recommendation: allow multiple entries per day (remove unique constraint) since a user might log chest in the morning and waist in the evening.
**Warning signs:** "duplicate key value violates unique constraint" errors.

### Pitfall 5: Body Fat % Treated as Circumference
**What goes wrong:** Body fat % gets a unit selector showing "in" or "cm"
**Why it happens:** Copy-paste from circumference field without adjusting for the unitless nature of body fat %
**How to avoid:** Body fat % field should have no unit selector -- it's always a percentage. The form should differentiate between circumference fields (with unit toggle) and percentage fields (no unit toggle).
**Warning signs:** "in" or "cm" appearing next to a body fat percentage.

### Pitfall 6: Chart with Single Data Point
**What goes wrong:** Victory Native renders oddly or crashes with a single data point (can't draw a line)
**Why it happens:** A line needs at least 2 points
**How to avoid:** Check `data.length >= 2` before rendering the chart. For single point, show the value as text with a message like "Log more entries to see trends." Same pattern as Phase 6 research.
**Warning signs:** Empty chart area or console errors about invalid domain.

## Code Examples

### Body Measurements Table Migration
```sql
-- Supabase migration: body_measurements table
CREATE TABLE public.body_measurements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chest       NUMERIC(5,1),          -- nullable, one decimal
  chest_unit  TEXT CHECK (chest_unit IN ('in', 'cm')),
  waist       NUMERIC(5,1),
  waist_unit  TEXT CHECK (waist_unit IN ('in', 'cm')),
  hips        NUMERIC(5,1),
  hips_unit   TEXT CHECK (hips_unit IN ('in', 'cm')),
  body_fat_pct NUMERIC(4,1),         -- e.g., 15.5 (%)
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure at least one measurement is provided
  CONSTRAINT at_least_one_measurement CHECK (
    chest IS NOT NULL OR waist IS NOT NULL OR
    hips IS NOT NULL OR body_fat_pct IS NOT NULL
  )
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own body measurements"
  ON public.body_measurements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_body_measurements_user_date
  ON public.body_measurements(user_id, measured_at DESC);
```

### Unit Conversion Utility
```typescript
// src/features/body-metrics/utils/unitConversion.ts
export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10; // one decimal
}

export function cmToInches(cm: number): number {
  return Math.round(cm / 2.54 * 10) / 10;
}

export function convertMeasurement(
  value: number,
  fromUnit: 'in' | 'cm',
  toUnit: 'in' | 'cm'
): number {
  if (fromUnit === toUnit) return value;
  return fromUnit === 'in' ? inchesToCm(value) : cmToInches(value);
}
```

### Chart Data Hook for Measurements
```typescript
// Reuses Phase 6 Victory Native pattern
function useBodyMetricsChartData(
  metric: 'chest' | 'waist' | 'hips' | 'body_fat_pct',
  displayUnit: 'in' | 'cm' // ignored for body_fat_pct
) {
  const measurements = useBodyMeasurementStore(s => s.measurements);

  return useMemo(() => {
    return measurements
      .filter((m) => m[metric] !== null)
      .map((m) => {
        let value = m[metric]!;
        // Convert to display unit if circumference
        if (metric !== 'body_fat_pct') {
          const storedUnit = m[`${metric}_unit` as keyof BodyMeasurement] as 'in' | 'cm';
          value = convertMeasurement(value, storedUnit, displayUnit);
        }
        return {
          date: new Date(m.measured_at).getTime(),
          value,
        };
      })
      .sort((a, b) => a.date - b.date);
  }, [measurements, metric, displayUnit]);
}
```

### Delete with Confirmation (Phase 5 Pattern)
```typescript
const handleDelete = useCallback((id: string) => {
  Alert.alert(
    'Delete Entry?',
    'This will permanently remove this measurement entry.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const Haptics = require('expo-haptics');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch {}
          await deleteMeasurement(id);
        },
      },
    ]
  );
}, [deleteMeasurement]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate table per measurement type | Single sparse table | Standard practice | Simpler queries, single insert per entry |
| Global unit preference | Per-entry unit storage | Project convention (Phase 6) | Correct data even when user switches units |

**Deprecated/outdated:**
- None specific to this phase -- body measurement tracking is a well-understood domain

## Open Questions

1. **Date picker component**
   - What we know: The project doesn't currently use a date picker. The form needs a date selector defaulting to today.
   - What's unclear: Whether to use @react-native-community/datetimepicker (native picker) or a simple text-based date selector
   - Recommendation: Use a simple Pressable that shows the native date picker via @react-native-community/datetimepicker. Install it with `npx expo install @react-native-community/datetimepicker`. Lightweight, native feel, no custom UI.

2. **Multiple entries per day vs unique constraint**
   - What we know: User may want to log different measurements at different times of day
   - What's unclear: Whether to enforce one entry per day or allow multiple
   - Recommendation: Allow multiple entries per day (no unique constraint on date). The history list groups by date and shows all entries. This avoids upsert complexity.

3. **Bodyweight field integration in measurement form**
   - What we know: The form includes bodyweight alongside the 4 measurements
   - What's unclear: Whether this writes to Phase 6's bodyweight_logs table or to the body_measurements table
   - Recommendation: Write bodyweight to the existing bodyweight_logs table (Phase 6) so the bodyweight chart has a single data source. The measurement form is a convenience entry point that writes to both tables in one operation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 55 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --bail --testPathPattern=tests/body-metrics` |
| Full suite command | `npx jest --bail` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HIST-04 | Measurement store CRUD (add, update, remove, list) | unit | `npx jest tests/body-metrics/measurement-store.test.ts -x` | No - Wave 0 |
| HIST-04 | Unit conversion (in/cm) correctness | unit | `npx jest tests/body-metrics/unit-conversion.test.ts -x` | No - Wave 0 |
| HIST-04 | Chart data transformation (filter, convert, sort) | unit | `npx jest tests/body-metrics/chart-data.test.ts -x` | No - Wave 0 |
| HIST-04 | Form validation (at least one field required) | unit | `npx jest tests/body-metrics/form-validation.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --bail --testPathPattern=tests/body-metrics`
- **Per wave merge:** `npx jest --bail`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/body-metrics/measurement-store.test.ts` -- covers HIST-04 (store CRUD operations)
- [ ] `tests/body-metrics/unit-conversion.test.ts` -- covers HIST-04 (in/cm conversion accuracy)
- [ ] `tests/body-metrics/chart-data.test.ts` -- covers HIST-04 (chart data transformation with mixed units)
- [ ] `tests/body-metrics/form-validation.test.ts` -- covers HIST-04 (at least one measurement validation)

## Sources

### Primary (HIGH confidence)
- Existing codebase -- historyStore.ts (Zustand+MMKV pattern), dashboard.tsx (card layout), history/[sessionId].tsx (delete confirmation pattern), theme.ts (colors), Input.tsx (form input pattern)
- Phase 6 research (06-RESEARCH.md) -- Victory Native XL CartesianChart API, bodyweight_logs schema, Sparkline pattern, font loading for Skia
- CONTEXT.md user decisions -- all locked decisions verified and incorporated

### Secondary (MEDIUM confidence)
- Victory Native XL documentation (via Phase 6 research) -- CartesianChart + Line API
- @react-native-community/datetimepicker -- standard RN date picker, well-maintained

### Tertiary (LOW confidence)
- None -- this phase uses well-established patterns with no novel technology

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use or documented in Phase 6 research; no new dependencies beyond optional date picker
- Architecture: HIGH - Follows exact patterns from existing stores, components, and screens in the codebase
- Pitfalls: HIGH - Pitfalls are practical (unit mixing, sparse validation, single data point) and directly from codebase analysis
- Data layer: HIGH - Simple CRUD table with RLS following existing migration patterns

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (30 days -- stable domain, no novel technology)
