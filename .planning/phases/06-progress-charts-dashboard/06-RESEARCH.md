# Phase 6: Progress Charts + Dashboard - Research

**Researched:** 2026-03-09
**Domain:** React Native charting, data aggregation, dashboard UI
**Confidence:** MEDIUM-HIGH

## Summary

Phase 6 transforms the dashboard shell into a data-driven home screen with three major capabilities: per-exercise progress charts (estimated 1RM, max weight, volume), bodyweight logging with trend chart, and a real-time dashboard showing today's planned workout plus progress summary. The charting stack centers on Victory Native XL powered by @shopify/react-native-skia, which provides GPU-accelerated rendering ideal for smooth line charts on mobile. The project already has react-native-reanimated 4.2.1 and react-native-gesture-handler installed, so only victory-native and @shopify/react-native-skia need to be added.

The data layer queries existing set_logs, session_exercises, and workout_sessions tables. Chart data should be aggregated server-side via Supabase RPC functions to minimize data transfer. A new bodyweight_logs table is needed. The dashboard card ordering is locked: Today's Workout first, Progress Summary second, Bodyweight third, PR Baselines fourth.

**Primary recommendation:** Use Victory Native XL (CartesianChart + Line) with Skia for all charts. Aggregate chart data via Supabase SQL functions. Build sparklines as small CartesianChart instances with axes hidden.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Exercise chart access: Both paths -- from history detail view AND from a dedicated progress section
- Exercise chart metrics: Estimated 1RM is primary line; max weight and total volume available via tabs/toggles
- Exercise chart time range: Default to all time; switchable 1M/3M/6M/1Y/All; auto-scale axis
- Exercise chart interaction: View only -- no tappable data points, no tooltips
- Dashboard progress summary card: Combined card with streak + recent PRs top, weekly stats bottom, sparkline trends
- Dashboard card ordering: Today's Workout > Progress Summary > Bodyweight > PR Baselines
- Bodyweight logging: Dashboard card with latest weight + mini sparkline + quick-add button; unit selector on every input; one decimal precision; no separate full-screen page
- Today's workout card -- planned day: Plan name, day label, exercise count, estimated duration, "Start Workout" button
- Today's workout card -- rest day: "Rest day" message with next planned workout teaser, freestyle "Quick Workout" button
- Today's workout card -- no plan: "Create a plan" button + "Quick freestyle workout" button
- Today's workout card -- tap behavior: "Start Workout" launches active workout; tapping elsewhere goes to plan day detail

### Claude's Discretion
- Charting library selection (researcher will investigate options)
- Sparkline implementation approach
- Chart axis labeling, grid styling, and color scheme for lines
- Streak calculation logic (consecutive days? weekly adherence?)
- Progress summary card internal layout
- Bodyweight input UI (inline expand, bottom sheet, modal)
- How to determine "today's workout" from plan day assignments
- Estimated duration calculation method

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HIST-02 | User can view per-exercise progress charts (max weight, estimated 1RM, volume over time) | Victory Native XL CartesianChart + Line for charts; Supabase RPC for data aggregation; Epley formula for 1RM; tab/toggle UI for metric switching |
| HIST-03 | User can log bodyweight and view bodyweight chart over time | New bodyweight_logs table; bodyweight dashboard card with inline input + sparkline; same Victory Native charting |
| DASH-01 | Home screen shows progress summary (recent stats, streaks, PRs) | Progress summary card with streak logic, recent PRs from set_logs.is_pr, weekly volume/workout count stats, sparklines |
| DASH-02 | Home screen shows today's planned workout with quick-start button | Today's Workout card reading active plan + weekday matching from plan_days.weekday; route to active workout |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| victory-native | ^41.19 | CartesianChart, Line, Bar components for all charts | Only Skia-powered RN chart lib with active maintenance; GPU-accelerated rendering; clean declarative API |
| @shopify/react-native-skia | latest (via `npx expo install`) | Rendering engine for Victory Native + sparklines | Required peer dep for victory-native; Expo SDK 55 compatible via `npx expo install` |

### Already Installed (peer deps satisfied)
| Library | Version | Purpose |
|---------|---------|---------|
| react-native-reanimated | 4.2.1 | Animation engine (victory-native peer dep) |
| react-native-gesture-handler | ~2.30.0 | Gesture system (victory-native peer dep) |
| zustand | ^5.0.11 | State management for bodyweight store |
| react-native-mmkv | ^4.2.0 | Offline persistence for bodyweight store |
| @gorhom/bottom-sheet | ^5.2.8 | Bodyweight input bottom sheet |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| victory-native (Skia) | react-native-gifted-charts (SVG) | Gifted Charts uses SVG (no Skia dep), but Victory Native offers better performance for animated line charts and is the standard for Skia-based RN charting |
| Supabase RPC aggregation | Client-side aggregation | Client-side would transfer all raw set_logs to the device; RPC keeps aggregation on Postgres which is far more efficient for large histories |

**Installation:**
```bash
npx expo install @shopify/react-native-skia
npm install victory-native --legacy-peer-deps
```

Note: `--legacy-peer-deps` may be needed if victory-native's peer dep for Skia specifies `>=1.2.3` and expo installs Skia v2.x. The issue (#616) was closed as resolved in Aug 2025, so newer victory-native versions may have updated the peer dep range.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── features/
│   ├── progress/              # NEW: progress charts feature
│   │   ├── components/
│   │   │   ├── ExerciseChart.tsx        # Full per-exercise chart with metric tabs
│   │   │   ├── ChartTimeRangeSelector.tsx  # 1M/3M/6M/1Y/All toggle
│   │   │   └── Sparkline.tsx            # Reusable mini chart component
│   │   ├── hooks/
│   │   │   ├── useExerciseChartData.ts  # Fetch + transform chart data
│   │   │   └── useBodyweightData.ts     # Fetch bodyweight entries
│   │   ├── utils/
│   │   │   └── chartHelpers.ts          # 1RM calc, date formatting, data transforms
│   │   └── types.ts
│   ├── dashboard/             # NEW: dashboard feature (extract from monolithic dashboard.tsx)
│   │   ├── components/
│   │   │   ├── TodaysWorkoutCard.tsx    # Today's planned workout
│   │   │   ├── ProgressSummaryCard.tsx  # Streaks, PRs, weekly stats + sparklines
│   │   │   ├── BodyweightCard.tsx       # Latest weight + sparkline + quick-add
│   │   │   └── TappableAvatar.tsx       # Extract from current dashboard.tsx
│   │   └── hooks/
│   │       ├── useTodaysWorkout.ts      # Determine today's plan day
│   │       ├── useProgressSummary.ts    # Aggregate streak, PRs, stats
│   │       └── useBodyweightLog.ts      # CRUD for bodyweight entries
├── stores/
│   └── bodyweightStore.ts     # NEW: Zustand + MMKV for bodyweight cache
supabase/
└── migrations/
    ├── 20260312000003_create_bodyweight_logs.sql  # NEW
    └── 20260312000004_create_chart_aggregation_functions.sql  # NEW: RPC functions
app/
└── (app)/
    ├── (tabs)/
    │   └── dashboard.tsx      # REFACTOR: compose from feature components
    └── progress/
        └── [exerciseId].tsx   # NEW: full-screen exercise chart route
```

### Pattern 1: Victory Native CartesianChart for Line Charts
**What:** Render time-series data as line charts with formatted axes
**When to use:** All exercise progress charts and bodyweight trend chart
**Example:**
```typescript
// Source: Victory Native XL official docs (nearform.com)
import { CartesianChart, Line } from "victory-native";
import { useFont } from "@shopify/react-native-skia";

function ExerciseChart({ data, metric }: { data: ChartPoint[]; metric: string }) {
  const font = useFont(require("@/assets/fonts/Inter-Regular.ttf"), 12);

  return (
    <CartesianChart
      data={data}
      xKey="date"
      yKeys={[metric]}
      padding={{ left: 10, right: 10, bottom: 5, top: 10 }}
      xAxis={{
        font,
        tickCount: 5,
        labelColor: "#a3a3a3",
        lineColor: "#252525",
        formatXLabel: (val) => {
          const d = new Date(val);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        },
      }}
      yAxis={[{
        font,
        tickCount: 4,
        labelColor: "#a3a3a3",
        lineColor: "#252525",
        formatYLabel: (val) => `${Math.round(val)}`,
      }]}
      frame={{ lineColor: "#252525", lineWidth: 1 }}
    >
      {({ points }) => (
        <Line
          points={points[metric]}
          color="#3b82f6"
          strokeWidth={2}
          curveType="natural"
          animate={{ type: "timing", duration: 300 }}
        />
      )}
    </CartesianChart>
  );
}
```

### Pattern 2: Sparkline as Minimal CartesianChart
**What:** Tiny trend indicators without axes or labels
**When to use:** Dashboard summary card sparklines, bodyweight card trend
**Example:**
```typescript
function Sparkline({ data, color, width, height }: SparklineProps) {
  return (
    <View style={{ width, height }}>
      <CartesianChart
        data={data}
        xKey="date"
        yKeys={["value"]}
        padding={0}
        // No axes, no frame -- pure line
      >
        {({ points }) => (
          <Line
            points={points.value}
            color={color}
            strokeWidth={1.5}
            curveType="natural"
          />
        )}
      </CartesianChart>
    </View>
  );
}
```

### Pattern 3: Supabase RPC for Chart Data Aggregation
**What:** Server-side aggregation of set_logs into per-session chart points
**When to use:** Fetching chart data for any exercise
**Example:**
```sql
-- Supabase migration: create RPC function
CREATE OR REPLACE FUNCTION get_exercise_chart_data(
  p_user_id UUID,
  p_exercise_id UUID,
  p_since TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  session_date TIMESTAMPTZ,
  max_weight NUMERIC,
  estimated_1rm NUMERIC,
  total_volume NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ws.ended_at AS session_date,
    MAX(sl.weight) AS max_weight,
    MAX(sl.weight * (1 + sl.reps::NUMERIC / 30)) AS estimated_1rm,  -- Epley formula
    SUM(sl.weight * sl.reps) AS total_volume
  FROM set_logs sl
  JOIN session_exercises se ON se.id = sl.session_exercise_id
  JOIN workout_sessions ws ON ws.id = se.session_id
  WHERE ws.user_id = p_user_id
    AND se.exercise_id = p_exercise_id
    AND ws.ended_at IS NOT NULL
    AND (p_since IS NULL OR ws.ended_at >= p_since)
  GROUP BY ws.ended_at
  ORDER BY ws.ended_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Pattern 4: Determining Today's Workout
**What:** Match current weekday to active plan's day assignments
**When to use:** TodaysWorkoutCard component
**Example:**
```typescript
function useTodaysWorkout() {
  // plan_days.weekday is stored as SMALLINT (0=Sunday, 1=Monday, ... 6=Saturday)
  // JavaScript Date.getDay() also uses 0=Sunday convention
  const today = new Date().getDay();
  const activePlan = usePlanStore(s => s.plans.find(p => p.is_active));

  if (!activePlan) return { state: 'no-plan' as const };

  const todayDay = activePlan.plan_days.find(d => d.weekday === today);
  if (!todayDay) {
    // Find next planned day
    const sortedDays = activePlan.plan_days
      .filter(d => d.weekday !== null)
      .sort((a, b) => a.weekday! - b.weekday!);
    const nextDay = sortedDays.find(d => d.weekday! > today)
      ?? sortedDays[0]; // wrap to next week
    return { state: 'rest-day' as const, nextDay, plan: activePlan };
  }

  return { state: 'planned' as const, todayDay, plan: activePlan };
}
```

### Anti-Patterns to Avoid
- **Fetching all set_logs client-side:** With months of workout data, this transfers megabytes unnecessarily. Use Supabase RPC to aggregate on Postgres.
- **Custom SVG path drawing for charts:** Victory Native handles path generation, animation, and scaling. Hand-rolling SVG paths leads to axis alignment bugs and missing edge cases.
- **Storing chart-ready data in Zustand:** Chart data is derived from session data; cache the raw query results briefly, not pre-formatted chart arrays.
- **Using the old Victory API (VictoryChart/VictoryLine):** The project should use the new CartesianChart/Line API (victory-native-xl). The old API uses react-native-svg and is deprecated.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Line chart rendering | Custom SVG/Canvas path drawing | Victory Native CartesianChart + Line | Axis scaling, tick calculation, curve interpolation, animation are all solved |
| 1RM estimation | Custom formula implementation | Epley formula in SQL function | `weight * (1 + reps / 30)` is the standard; compute server-side for efficiency |
| Date axis formatting | Manual date label positioning | Victory Native xAxis.formatXLabel | Auto-handles tick spacing, label collision, axis scaling |
| Sparkline charts | Custom tiny chart component from scratch | Same CartesianChart with padding=0 and no axes | Reuses same rendering pipeline, consistent look |
| Chart data aggregation | Client-side loops over raw sets | Supabase RPC function (Postgres aggregation) | SQL GROUP BY is orders of magnitude faster than JS array processing |

**Key insight:** Charts seem simple but have dozens of edge cases (empty data, single data point, axis scaling, label collision). Victory Native solves all of these. The only custom code needed is data fetching and transformation.

## Common Pitfalls

### Pitfall 1: Font Loading for Skia Chart Labels
**What goes wrong:** Chart renders without axis labels or crashes because Skia needs a font file loaded via `useFont`
**Why it happens:** Victory Native XL uses Skia for text rendering, not React Native's built-in text. Skia requires an explicit .ttf font file.
**How to avoid:** Bundle a .ttf font file (e.g., Inter-Regular.ttf) in `assets/fonts/` and load it with `useFont(require("@/assets/fonts/Inter-Regular.ttf"), 12)` from `@shopify/react-native-skia`. Check for null font before rendering chart.
**Warning signs:** Blank axis labels, "Cannot read property" errors related to font.

### Pitfall 2: Empty Chart Data
**What goes wrong:** Chart crashes or renders incorrectly when data array is empty (no workout history for an exercise)
**Why it happens:** CartesianChart may not gracefully handle zero data points
**How to avoid:** Always check `data.length > 0` before rendering CartesianChart. Show an empty state message ("Log workouts to see progress") when no data exists. Also handle single data point (can't draw a line with one point -- show a dot or message).
**Warning signs:** White/blank chart area, console errors about invalid domain.

### Pitfall 3: Skia Peer Dependency Conflicts
**What goes wrong:** npm install fails with ERESOLVE peer dependency error
**Why it happens:** victory-native may specify `@shopify/react-native-skia >=1.2.3` while Expo SDK 55 installs v2.x
**How to avoid:** Install Skia first via `npx expo install @shopify/react-native-skia` (gets correct version for SDK), then install victory-native with `--legacy-peer-deps` if needed. The underlying code works with Skia v2 -- the peer dep range was the only issue (resolved in issue #616).
**Warning signs:** ERESOLVE errors during npm install.

### Pitfall 4: Date Handling in Chart xKey
**What goes wrong:** Dates display as raw ISO strings or sort incorrectly on the x-axis
**Why it happens:** CartesianChart xKey must be a number for proper scaling. ISO date strings won't auto-sort correctly.
**How to avoid:** Convert dates to Unix timestamps (milliseconds) for the xKey, then format them back to human-readable strings in `formatXLabel`. Example: `{ date: new Date(session.ended_at).getTime(), value: 1rm }`.
**Warning signs:** Jumbled x-axis labels, non-chronological point ordering.

### Pitfall 5: Weekday Matching for Today's Workout
**What goes wrong:** Wrong workout shown for today, or rest day shown on a workout day
**Why it happens:** Weekday numbering mismatch between database and JavaScript
**How to avoid:** Use consistent convention: JS `Date.getDay()` returns 0=Sunday through 6=Saturday. Ensure `plan_days.weekday` uses the same convention. Document the convention in the migration.
**Warning signs:** Off-by-one day errors, workout showing on wrong day.

### Pitfall 6: Bodyweight Unit Confusion
**What goes wrong:** Chart mixes kg and lbs values, showing nonsensical trend
**Why it happens:** User logs some entries in kg and others in lbs
**How to avoid:** Store the unit per entry in the database. When displaying the chart, convert all values to a single display unit (user's preferred unit from profile). Apply conversion factor: 1 kg = 2.20462 lbs.
**Warning signs:** Sudden spikes/drops in bodyweight trend that don't match reality.

## Code Examples

### Epley 1RM Formula
```typescript
// Standard Epley formula for estimated 1RM
// Source: Exercise science standard (widely used in strength training apps)
function estimateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight; // Actual 1RM
  if (reps === 0 || weight === 0) return 0;
  return weight * (1 + reps / 30);
}
```

### Bodyweight Logs Table Migration
```sql
CREATE TABLE public.bodyweight_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight     NUMERIC(5,1) NOT NULL,  -- one decimal precision per user decision
  unit       TEXT NOT NULL CHECK (unit IN ('kg', 'lbs')),
  logged_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, logged_at)  -- one entry per day
);

ALTER TABLE public.bodyweight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bodyweight logs"
  ON public.bodyweight_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_bodyweight_logs_user_date
  ON public.bodyweight_logs(user_id, logged_at DESC);
```

### Streak Calculation (Recommended: Weekly Adherence)
```typescript
// Streak = consecutive weeks where user completed at least one workout
// More forgiving than daily streaks for a gym app (rest days are expected)
function calculateWeeklyStreak(sessions: { ended_at: string }[]): number {
  if (sessions.length === 0) return 0;

  const now = new Date();
  const getWeekNumber = (d: Date) => {
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = d.getTime() - start.getTime();
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
  };

  const sessionWeeks = new Set(
    sessions.map(s => {
      const d = new Date(s.ended_at);
      return `${d.getFullYear()}-${getWeekNumber(d)}`;
    })
  );

  let streak = 0;
  let weekOffset = 0;
  while (true) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - weekOffset * 7);
    const weekKey = `${checkDate.getFullYear()}-${getWeekNumber(checkDate)}`;
    if (sessionWeeks.has(weekKey)) {
      streak++;
      weekOffset++;
    } else if (weekOffset === 0) {
      // Current week hasn't had a workout yet -- check previous weeks
      weekOffset++;
    } else {
      break;
    }
  }
  return streak;
}
```

### Estimated Duration Calculation
```typescript
// Rough estimate: 3 minutes per set (includes rest) + 2 minutes per exercise (setup/transition)
function estimateWorkoutDuration(exercises: PlanDayExercise[]): number {
  const totalSets = exercises.reduce((sum, e) => sum + e.target_sets.length, 0);
  const totalExercises = exercises.length;
  return totalSets * 3 + totalExercises * 2; // minutes
}
```

### Chart Data Hook Pattern
```typescript
function useExerciseChartData(exerciseId: string, timeRange: TimeRange) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const since = timeRange === 'all' ? null : getTimeRangeStart(timeRange);

      const { data: rows, error } = await supabase.rpc('get_exercise_chart_data', {
        p_user_id: user.id,
        p_exercise_id: exerciseId,
        p_since: since,
      });

      if (!error && rows) {
        setData(rows.map(r => ({
          date: new Date(r.session_date).getTime(),
          estimated_1rm: Number(r.estimated_1rm),
          max_weight: Number(r.max_weight),
          total_volume: Number(r.total_volume),
        })));
      }
      setLoading(false);
    }
    fetch();
  }, [exerciseId, timeRange]);

  return { data, loading };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Victory Native (SVG-based, VictoryChart API) | Victory Native XL (Skia-based, CartesianChart API) | 2023 (v40+) | Better performance, GPU rendering, cleaner API |
| react-native-chart-kit | Victory Native XL or react-native-gifted-charts | 2023 | chart-kit is unmaintained (last update 3+ years ago) |
| Client-side chart data processing | Supabase RPC / Postgres aggregation | Standard practice | Scales with data growth, reduces bandwidth |

**Deprecated/outdated:**
- react-native-chart-kit: Unmaintained, last release 3+ years ago
- Old Victory API (VictoryChart, VictoryLine, VictoryAxis): Replaced by CartesianChart + Line in victory-native-xl

## Open Questions

1. **Font file for Skia axis labels**
   - What we know: Skia requires a .ttf font loaded via `useFont`. The project doesn't currently bundle custom fonts.
   - What's unclear: Which font to use (Inter matches modern app feel; system font may not be available to Skia)
   - Recommendation: Bundle Inter-Regular.ttf in `assets/fonts/`. Download from Google Fonts. Small file (~90KB).

2. **Skia v2 compatibility with victory-native**
   - What we know: GitHub issue #616 was closed as resolved (Aug 2025). Using `--legacy-peer-deps` is a workaround.
   - What's unclear: Whether the latest victory-native has officially updated its peer dep to include Skia v2
   - Recommendation: Install and test. If peer dep conflict occurs, use `--legacy-peer-deps`. The runtime is compatible.

3. **Chart performance with large datasets**
   - What we know: Skia rendering is GPU-accelerated. SQL aggregation reduces data points.
   - What's unclear: How many data points before performance degrades
   - Recommendation: SQL function already aggregates to one point per session per exercise. For users with 365+ sessions, consider downsampling (e.g., weekly averages for All Time view).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 55 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --bail --testPathPattern=tests/progress` |
| Full suite command | `npx jest --bail` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HIST-02 | Exercise chart data aggregation (1RM, max weight, volume) | unit | `npx jest tests/progress/chart-data.test.ts -x` | No - Wave 0 |
| HIST-02 | Time range filtering (1M/3M/6M/1Y/All) | unit | `npx jest tests/progress/chart-data.test.ts -x` | No - Wave 0 |
| HIST-03 | Bodyweight CRUD (log, list, latest) | unit | `npx jest tests/progress/bodyweight.test.ts -x` | No - Wave 0 |
| DASH-01 | Progress summary aggregation (streak, PRs, stats) | unit | `npx jest tests/dashboard/progress-summary.test.ts -x` | No - Wave 0 |
| DASH-02 | Today's workout determination (weekday matching) | unit | `npx jest tests/dashboard/todays-workout.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --bail --testPathPattern=tests/(progress|dashboard)`
- **Per wave merge:** `npx jest --bail`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/progress/chart-data.test.ts` -- covers HIST-02 (chart data transformation, 1RM calculation, time range filtering)
- [ ] `tests/progress/bodyweight.test.ts` -- covers HIST-03 (bodyweight store CRUD, unit conversion)
- [ ] `tests/dashboard/progress-summary.test.ts` -- covers DASH-01 (streak calculation, PR aggregation, weekly stats)
- [ ] `tests/dashboard/todays-workout.test.ts` -- covers DASH-02 (weekday matching, rest day detection, no-plan state)
- [ ] Mock for `@shopify/react-native-skia` in `tests/__mocks__/` -- needed for any component importing victory-native
- [ ] Mock for `victory-native` in `tests/__mocks__/` -- chart components are not testable in JSDOM

## Sources

### Primary (HIGH confidence)
- Victory Native XL official docs (nearform.com/open-source/victory-native/) -- CartesianChart API, Line API, xAxis/yAxis configuration, installation
- Expo SDK docs (docs.expo.dev/versions/latest/sdk/skia/) -- @shopify/react-native-skia installation via `npx expo install`
- Existing codebase -- database schema (workout_sessions, session_exercises, set_logs), Zustand+MMKV pattern, dashboard.tsx structure

### Secondary (MEDIUM confidence)
- GitHub issue #616 (FormidableLabs/victory-native-xl) -- Skia v2 peer dependency resolution status (closed as completed Aug 2025)
- Multiple web sources on React Native charting ecosystem -- Victory Native XL is the standard Skia-based option; react-native-gifted-charts is the SVG alternative

### Tertiary (LOW confidence)
- Exact latest victory-native version number -- npm was not directly accessible; version ~41.19+ based on search results
- Whether Expo SDK 55 auto-configures reanimated babel plugin -- likely yes given SDK 55 + reanimated 4.2.1 is already working in project

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH - Victory Native XL is well-documented and the clear choice for Skia charting in RN, but exact version compatibility with SDK 55 needs runtime verification
- Architecture: HIGH - Patterns follow existing project conventions (Zustand+MMKV stores, feature folders, Supabase migrations)
- Pitfalls: HIGH - Well-documented issues (font loading, peer deps, date handling) from official docs and community reports
- Data layer: HIGH - Schema extensions are straightforward; RPC aggregation is standard Postgres

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days -- stable domain, libraries mature)
