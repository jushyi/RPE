# Phase 15: Barbell Calculator Tab - Research

**Researched:** 2026-03-12
**Domain:** React Native gym calculator utilities (plate loading, RPE/1RM, weight recommendations)
**Confidence:** HIGH

## Summary

Phase 15 adds a new bottom tab ("Calc") with three sub-tools: a plate loading visualizer, a combined RPE/1RM calculator, and a next-set RPE-based weight recommender. This is a purely client-side feature with no database changes, no new dependencies, and no network calls. All computation is local math. The primary technical work is UI: a barbell SVG diagram, an RPE percentage table grid, and the segmented tab + PagerView inner navigation pattern already established in the Plans tab.

The existing codebase provides strong foundations: `calculateEpley1RM` in `src/features/history/utils/epley.ts`, `react-native-pager-view` already installed, `react-native-svg` for the barbell diagram, `react-native-reanimated` for the animated tab indicator, and the full Plans tab (`app/(app)/(tabs)/plans.tsx`) as the exact template for the inner-tab pattern.

**Primary recommendation:** Follow the Plans tab pattern exactly for navigation structure, use react-native-svg for the barbell diagram, reuse `calculateEpley1RM`, and implement the standard Tuchscherer RPE percentage table as pure utility functions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- New 4th bottom tab between Plans and Settings, icon: Ionicons `calculator-outline`, title: "Calc"
- Three sub-tools via segmented tabs at top: Plates, RPE/1RM, Next Set
- Swipe between sub-tools enabled (PagerView) -- consistent with Plans tab inner-tab pattern
- Plate calculator: numeric keypad input for target weight (matches SetCard input pattern), configurable bar weight dropdown with presets (45lb Olympic, 35lb women's, 25lb EZ curl, etc.), visual barbell diagram with color-coded plates proportional to real sizes
- Standard fixed plate set -- no customization: 45, 35, 25, 10, 5, 2.5 lb (or kg equivalents: 25, 20, 15, 10, 5, 2.5, 1.25 kg)
- Unit handling follows user's preferred unit setting from authStore
- RPE/1RM combined into one tool: weight + reps input, estimated 1RM using Epley formula (reuse `calculateEpley1RM`), RPE output as table grid (RPE x Reps matrix)
- Always starts blank -- no auto-fill from workout history
- Epley formula only (no multi-formula selection)
- Next-set RPE: manual input (weight, reps, RPE felt), adjustable target RPE and target reps, single card recommendation with weight + percentage change + logic explanation
- Recommended weight auto-rounds to nearest 5 lb / 2.5 kg

### Claude's Discretion
- Exact plate color scheme for the barbell diagram
- RPE percentage table values (standard Tuchscherer RPE chart or similar)
- Keyboard dismiss behavior and scroll handling
- Loading/empty states
- Exact segmented control styling

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-pager-view | 8.0.0 | Swipeable sub-tool pages | Already used in Plans tab for inner tabs |
| react-native-reanimated | 4.2.1 | Animated tab indicator | Already used in Plans tab for segment indicator |
| react-native-svg | 15.15.3 | Barbell diagram rendering | Already installed, ideal for proportional plate shapes |
| Ionicons (@expo/vector-icons) | Bundled with Expo 55 | Tab icon (calculator-outline) | Project standard for all icons |
| react-native-safe-area-context | installed | SafeAreaView for screen | Project standard |

### Supporting (already available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | installed | Read `preferredUnit` from authStore | Unit toggle (kg/lbs) |
| react-native-mmkv | installed | Backing store for authStore | Already wired |

### No New Dependencies Required
This phase requires zero new npm installs. Everything needed is already in the project.

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/features/calculator/
  components/
    PlateCalculator.tsx        # Plate loading sub-tool
    BarbellDiagram.tsx         # SVG barbell visualization
    BarWeightPicker.tsx        # Dropdown for bar weight presets
    RpeCalculator.tsx          # RPE/1RM combined sub-tool
    RpeTable.tsx               # RPE x Reps percentage grid
    NextSetCalculator.tsx      # Next-set recommendation sub-tool
    RecommendationCard.tsx     # Result card for next-set recommendation
  utils/
    plateCalculator.ts         # Pure function: weight -> plate breakdown
    rpeTable.ts                # RPE percentage lookup table + helpers
    nextSetCalc.ts             # Pure function: last set + targets -> recommended weight
  constants/
    plates.ts                  # Plate sets (lb and kg), bar presets, plate colors
  types.ts                     # TypeScript types for calculator domain

app/(app)/(tabs)/
  calculator.tsx               # Tab screen with PagerView + segmented control
```

### Pattern 1: PagerView + Segmented Control (Plans Tab Pattern)
**What:** Three content pages wrapped in PagerView, controlled by a segmented tab bar at top with animated indicator
**When to use:** This exact pattern is already used in Plans tab (`plans.tsx`)
**Example:**
```typescript
// Direct replication of plans.tsx pattern
const TABS = ['Plates', 'RPE/1RM', 'Next Set'] as const;

export default function CalculatorScreen() {
  const pagerRef = useRef<PagerView>(null);
  const [activeTab, setActiveTab] = useState(0);
  const indicatorX = useSharedValue(0);
  const [tabWidth, setTabWidth] = useState(0);

  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  const onPageSelected = useCallback((e: any) => {
    const position = e.nativeEvent.position;
    setActiveTab(position);
    indicatorX.value = withTiming(position * tabWidth, { duration: 200 });
  }, [tabWidth, indicatorX]);

  const onTabBarLayout = useCallback((e: any) => {
    const width = e.nativeEvent.layout.width / TABS.length;
    setTabWidth(width);
    indicatorX.value = activeTab * width;
  }, [activeTab, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: tabWidth || 0,
  }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.tabBar} onLayout={onTabBarLayout}>
        {TABS.map((tab, index) => (
          <Pressable key={tab} style={s.tabItem} onPress={() => handleTabPress(index)}>
            <Text style={[s.tabText, activeTab === index ? s.tabTextActive : s.tabTextInactive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
        <Animated.View style={[s.tabIndicator, indicatorStyle]} />
      </View>

      <PagerView ref={pagerRef} style={s.pager} initialPage={0} onPageSelected={onPageSelected}>
        <View key="plates"><PlateCalculator /></View>
        <View key="rpe"><RpeCalculator /></View>
        <View key="nextset"><NextSetCalculator /></View>
      </PagerView>
    </SafeAreaView>
  );
}
```

### Pattern 2: Pure Utility Functions for All Math
**What:** All calculation logic extracted into pure functions (no React, no hooks) for testability
**When to use:** Every calculation in this phase
**Example:**
```typescript
// src/features/calculator/utils/plateCalculator.ts
export interface PlateBreakdown {
  plates: { weight: number; count: number }[];
  remainder: number;
}

export function calculatePlates(
  targetWeight: number,
  barWeight: number,
  availablePlates: number[] // descending order
): PlateBreakdown {
  let perSide = (targetWeight - barWeight) / 2;
  if (perSide <= 0) return { plates: [], remainder: 0 };

  const plates: { weight: number; count: number }[] = [];
  for (const plate of availablePlates) {
    const count = Math.floor((perSide + 0.001) / plate); // epsilon for float safety
    if (count > 0) {
      plates.push({ weight: plate, count });
      perSide = Math.round((perSide - count * plate) * 100) / 100;
    }
  }
  return { plates, remainder: Math.max(0, perSide) };
}
```

### Pattern 3: SVG Barbell Diagram
**What:** Horizontal barbell rendered with react-native-svg (Rect elements for plates, Line for bar)
**When to use:** Visual plate display
**Why SVG over View rectangles:** SVG provides precise proportional sizing, consistent rendering across platforms, and is already installed in the project (used for bodyweight charts). The barbell diagram benefits from SVG's coordinate system for precise proportional plate sizing.
**Example:**
```typescript
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

// Plate height proportional to real diameter
const PLATE_DIAMETERS: Record<number, number> = {
  // lb plates (relative to 45lb = 100%)
  45: 1.0, 35: 0.88, 25: 0.75, 10: 0.62, 5: 0.50, 2.5: 0.38,
  // kg plates
  25: 1.0, 20: 0.88, 15: 0.75, 10: 0.62, 5: 0.50, 2.5: 0.38, 1.25: 0.30,
};

// IPF-style plate colors
const PLATE_COLORS_LB: Record<number, string> = {
  45: '#EF4444',   // red
  35: '#3B82F6',   // blue
  25: '#22C55E',   // green
  10: '#FBBF24',   // yellow
  5: '#F5F5F5',    // white
  2.5: '#9CA3AF',  // gray
};

const PLATE_COLORS_KG: Record<number, string> = {
  25: '#EF4444',   // red
  20: '#3B82F6',   // blue
  15: '#FBBF24',   // yellow
  10: '#22C55E',   // green
  5: '#F5F5F5',    // white
  2.5: '#EF4444',  // red (small)
  1.25: '#9CA3AF', // gray
};
```

### Pattern 4: Accessing User's Preferred Unit
```typescript
import { useAuthStore } from '@/stores/authStore';

// Inside component:
const preferredUnit = useAuthStore((s) => s.preferredUnit); // 'lbs' | 'kg'
```

### Anti-Patterns to Avoid
- **Coupling to workout state:** Calculator is standalone. Never import from workout stores or active session state.
- **Database reads/writes:** This is a pure utility. No Supabase calls. No persistence of calculator inputs.
- **Custom tab implementation:** Do NOT build a custom tab switcher. Clone the exact PagerView pattern from `plans.tsx`.
- **Inline magic numbers:** All plate weights, bar presets, RPE percentages belong in constants files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 1RM estimation | Custom formula | `calculateEpley1RM` from `src/features/history/utils/epley.ts` | Already exists, tested, consistent with rest of app |
| Unit preference | Local state toggle | `useAuthStore(s => s.preferredUnit)` | User has already set their preference globally |
| Tab indicator animation | Manual translateX math | Copy Plans tab `indicatorStyle` pattern with Reanimated `useSharedValue` + `withTiming` | Proven pattern, pixel-perfect |
| Keyboard dismiss | Custom gesture handler | `ScrollView` with `keyboardShouldPersistTaps="handled"` + `Keyboard.dismiss()` on background tap | Standard RN pattern |
| RPE percentages | Custom calculation | Static Tuchscherer lookup table | Industry standard, deterministic |

**Key insight:** This phase is 90% UI and 10% math. The math is simple (greedy algorithm, table lookups, basic arithmetic). The complexity is in making the barbell diagram visually clear and the RPE table scrollable/readable.

## Common Pitfalls

### Pitfall 1: Floating Point Plate Math
**What goes wrong:** Plate subtraction accumulates floating point errors (e.g., `91.25 - 45 - 45 = 1.2499999999999929`)
**Why it happens:** JavaScript IEEE 754 floating point arithmetic
**How to avoid:** Round to 2 decimal places after each subtraction step. Use `Math.round(x * 100) / 100` after each operation.
**Warning signs:** Remainder shows as 0.0000001 instead of 0, or a plate not being added when it should fit.

### Pitfall 2: Target Weight Below Bar Weight
**What goes wrong:** User enters 30 lbs with a 45 lb bar, calculation produces negative per-side weight
**Why it happens:** No input validation
**How to avoid:** Show "Weight must exceed bar weight" message when target <= barWeight. Do not attempt plate calculation.
**Warning signs:** Negative numbers or empty plate lists with no explanation.

### Pitfall 3: Tab Ordering in expo-router
**What goes wrong:** New "calculator" tab appears in wrong position (after Settings instead of between Plans and Settings)
**Why it happens:** expo-router Tabs.Screen order determines tab bar order
**How to avoid:** Insert the new `<Tabs.Screen name="calculator" ...>` between the Plans and Settings entries in `_layout.tsx`.
**Warning signs:** Tab appears at the end of the tab bar.

### Pitfall 4: Keyboard Covering Inputs
**What goes wrong:** Numeric input fields get covered by the keyboard, especially on smaller screens
**Why it happens:** Calculator screens have inputs near the center/bottom of the screen
**How to avoid:** Wrap each sub-tool content in `ScrollView` with `keyboardShouldPersistTaps="handled"`. Keep inputs at the top of each sub-tool and results below.
**Warning signs:** User cannot see what they're typing on smaller devices.

### Pitfall 5: PagerView Gesture Conflicts
**What goes wrong:** Horizontal scroll inside the RPE table conflicts with PagerView swipe
**Why it happens:** Both PagerView and horizontal ScrollView capture horizontal pan gestures
**How to avoid:** Make the RPE table scroll vertically only. Size rep columns to fit screen width (1-10 reps is usually sufficient for mobile). If horizontal scrolling is needed, use `nestedScrollEnabled`.
**Warning signs:** Cannot swipe between tabs when finger starts on the table area.

### Pitfall 6: Rounding to Plate-Loadable Increments
**What goes wrong:** Next-set recommendation says "182.3 lbs" which is impossible to load
**Why it happens:** Raw math output not rounded to loadable weight
**How to avoid:** Always apply `roundToLoadable()`: round to nearest 5 lb (lbs mode) or 2.5 kg (kg mode).
**Warning signs:** Recommendations with decimal weights.

## Code Examples

### Constants: Plate Sets and Bar Presets
```typescript
// src/features/calculator/constants/plates.ts
export const LB_PLATES = [45, 35, 25, 10, 5, 2.5];
export const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export interface BarPreset {
  label: string;
  weightLb: number;
  weightKg: number;
}

export const BAR_PRESETS: BarPreset[] = [
  { label: 'Olympic Bar', weightLb: 45, weightKg: 20 },
  { label: "Women's Bar", weightLb: 35, weightKg: 15 },
  { label: 'EZ Curl Bar', weightLb: 25, weightKg: 10 },
  { label: 'Training Bar', weightLb: 15, weightKg: 7 },
];
```

### RPE Percentage Table (Tuchscherer Standard)
```typescript
// src/features/calculator/utils/rpeTable.ts
// Standard RPE-to-percentage table (Tuchscherer/RTS)
// Key: RPE, Value: array of percentages indexed by (reps - 1), reps 1-12
export const RPE_TABLE: Record<number, number[]> = {
  10:   [100, 95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.4],
  9.5:  [97.8, 93.9, 90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 70.7, 68.6],
  9:    [95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.4, 67.5],
  8.5:  [93.9, 90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 70.7, 68.6, 66.7],
  8:    [92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.4, 67.5, 65.8],
  7.5:  [90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 70.7, 68.6, 66.7, 64.9],
  7:    [89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.4, 67.5, 65.8, 64.0],
  6.5:  [87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 70.7, 68.6, 66.7, 64.9, 63.2],
  6:    [86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.4, 67.5, 65.8, 64.0, 62.3],
};

export function getWeightForRpeAndReps(e1rm: number, rpe: number, reps: number): number {
  const percentages = RPE_TABLE[rpe];
  if (!percentages || reps < 1 || reps > 12) return 0;
  return Math.round((e1rm * percentages[reps - 1]) / 100 * 10) / 10;
}
```

### Next-Set Recommendation Logic
```typescript
// src/features/calculator/utils/nextSetCalc.ts
import { RPE_TABLE } from './rpeTable';

export interface NextSetInput {
  lastWeight: number;
  lastReps: number;
  lastRpe: number;
  targetRpe: number;
  targetReps: number;
  unit: 'kg' | 'lbs';
}

export interface NextSetResult {
  recommendedWeight: number;
  percentChange: number;
  explanation: string;
}

export function calculateNextSet(input: NextSetInput): NextSetResult {
  const lastPct = RPE_TABLE[input.lastRpe]?.[input.lastReps - 1];
  if (!lastPct) {
    return { recommendedWeight: input.lastWeight, percentChange: 0, explanation: 'Invalid RPE/rep combination' };
  }
  const estimated1RM = (input.lastWeight / lastPct) * 100;

  const targetPct = RPE_TABLE[input.targetRpe]?.[input.targetReps - 1];
  if (!targetPct) {
    return { recommendedWeight: input.lastWeight, percentChange: 0, explanation: 'Invalid target combination' };
  }

  const rawWeight = (estimated1RM * targetPct) / 100;
  const increment = input.unit === 'lbs' ? 5 : 2.5;
  const recommendedWeight = Math.round(rawWeight / increment) * increment;
  const percentChange = Math.round(((recommendedWeight - input.lastWeight) / input.lastWeight) * 1000) / 10;

  const explanation = `Based on e1RM of ${Math.round(estimated1RM)} ${input.unit}, ` +
    `${input.targetReps} reps at RPE ${input.targetRpe} = ${targetPct}% of 1RM`;

  return { recommendedWeight, percentChange, explanation };
}

export function roundToLoadable(weight: number, unit: 'lbs' | 'kg'): number {
  const increment = unit === 'lbs' ? 5 : 2.5;
  return Math.round(weight / increment) * increment;
}
```

### Tab Layout Integration
```typescript
// In app/(app)/(tabs)/_layout.tsx -- insert between Plans and Settings:
<Tabs.Screen
  name="calculator"
  options={{
    title: 'Calc',
    tabBarIcon: ({ color }) => (
      <Ionicons name="calculator-outline" size={20} color={color} />
    ),
  }}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multiple formula options (Epley, Brzycki, Lombardi) | Single Epley formula | Project decision | Simpler UI, consistent with existing code |
| Separate RPE and 1RM screens | Combined single tool | User decision (CONTEXT.md) | Fewer taps, RPE table derived from 1RM input |
| Auto-populate from workout history | Manual input only | User decision (CONTEXT.md) | Standalone utility, no state coupling |

## Open Questions

1. **RPE half-step support in inputs**
   - What we know: Standard RPE charts include half steps (6.5, 7.5, 8.5, 9.5). The table data includes these.
   - What's unclear: Best input UX for selecting half-step values on mobile
   - Recommendation: Support half steps. Use a scrollable picker or stepper with 0.5 increments from 6 to 10. This matches powerlifting convention.

2. **Barbell diagram scaling for heavy loads**
   - What we know: With many plates (e.g., 405 lb = four 45s per side), the diagram could get wide.
   - What's unclear: Whether to scale down proportionally or cap and indicate overflow
   - Recommendation: Scale the entire diagram to fit screen width. Proportional sizing still communicates plate relationships even at smaller scale. Avoids horizontal scroll and PagerView gesture conflicts.

3. **KG plate color scheme**
   - What we know: IPF standard: 25kg=red, 20kg=blue, 15kg=yellow, 10kg=green, 5kg=white, 2.5kg=red(small), 1.25kg=gray
   - Recommendation: Use separate color maps for lb and kg modes (PLATE_COLORS_LB and PLATE_COLORS_KG)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 55 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --testPathPattern=calculator --bail` |
| Full suite command | `npx jest --bail` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CALC-01 | Plate calculation returns correct breakdown for given weight/bar | unit | `npx jest tests/calculator/plateCalculator.test.ts -x` | No - Wave 0 |
| CALC-02 | Handles weight below bar weight gracefully | unit | `npx jest tests/calculator/plateCalculator.test.ts -x` | No - Wave 0 |
| CALC-03 | RPE table returns correct percentages for all RPE x rep combos | unit | `npx jest tests/calculator/rpeTable.test.ts -x` | No - Wave 0 |
| CALC-04 | Next-set recommendation rounds to nearest loadable increment | unit | `npx jest tests/calculator/nextSetCalc.test.ts -x` | No - Wave 0 |
| CALC-05 | Next-set handles edge cases (same RPE/reps, invalid combos) | unit | `npx jest tests/calculator/nextSetCalc.test.ts -x` | No - Wave 0 |
| CALC-06 | Unit switching (lb/kg) uses correct plate sets and rounding | unit | `npx jest tests/calculator/plateCalculator.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=calculator --bail`
- **Per wave merge:** `npx jest --bail`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/calculator/plateCalculator.test.ts` -- covers CALC-01, CALC-02, CALC-06
- [ ] `tests/calculator/rpeTable.test.ts` -- covers CALC-03
- [ ] `tests/calculator/nextSetCalc.test.ts` -- covers CALC-04, CALC-05

## Sources

### Primary (HIGH confidence)
- Project codebase: `app/(app)/(tabs)/plans.tsx` -- PagerView + segmented control pattern (direct reuse)
- Project codebase: `src/features/history/utils/epley.ts` -- existing Epley 1RM function
- Project codebase: `src/stores/authStore.ts` -- preferredUnit access pattern (`'lbs' | 'kg'`)
- Project codebase: `src/constants/theme.ts` -- color constants for dark theme
- Project codebase: `package.json` -- all dependencies already installed (pager-view, reanimated, svg)

### Secondary (MEDIUM confidence)
- Tuchscherer RPE percentage chart -- well-established in powerlifting community, standard reference values
- IPF plate color standards -- widely documented competition plate color scheme

### Tertiary (LOW confidence)
- Exact RPE percentage values at extreme edges (RPE 6 at 12 reps) -- values vary slightly between sources. The table uses most commonly cited Tuchscherer values.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in active use
- Architecture: HIGH -- direct replication of existing Plans tab pattern
- Pitfalls: HIGH -- common React Native and floating point issues, well-understood
- RPE table values: MEDIUM -- standard Tuchscherer values, minor variations exist between sources

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable domain, no moving dependencies)
