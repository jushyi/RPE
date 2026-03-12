# Phase 15: Barbell Calculator Tab - Research

**Researched:** 2026-03-12
**Domain:** React Native utility screens (pure math + visual rendering, no backend)
**Confidence:** HIGH

## Summary

Phase 15 adds a standalone calculator tab with three sub-tools: plate loader, RPE/1RM calculator, and next-set recommendations. This is a purely frontend feature with no database, no network calls, and no new dependencies. All calculations are deterministic math functions, the barbell diagram is a visual layout of colored View rectangles, and the RPE table is a static percentage lookup.

The implementation follows the exact same inner-tab pattern already established in the Plans tab (PagerView + segmented control + Reanimated indicator). The Epley 1RM function already exists and can be imported directly. The user's preferred unit (`kg`/`lbs`) is available from `useAuthStore`.

**Primary recommendation:** Build this as a self-contained `src/features/calculator/` module with pure utility functions (plate math, RPE lookup, next-set logic) that are easily unit-tested, plus three screen components rendered inside a PagerView on the new tab.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- New 4th bottom tab between Plans and Settings, icon: Ionicons `calculator-outline`, title: "Calc"
- Three sub-tools via segmented tabs at top: Plates, RPE/1RM, Next Set
- Swipe between sub-tools enabled (PagerView) -- consistent with Plans tab inner-tab pattern
- Plate calculator: numeric input for target weight, configurable bar weight dropdown (45lb Olympic, 35lb women's, 25lb EZ curl, etc.), visual barbell diagram with color-coded plates proportional to real sizes, standard fixed plate set (no customization)
- RPE/1RM combined tool: weight + reps input, estimated 1RM using Epley formula (reuse `calculateEpley1RM`), RPE output as table grid (RPE x Reps matrix)
- Always starts blank -- no auto-fill from workout history
- Epley formula only (no multi-formula selection)
- Next-set RPE: manual input (weight, reps, RPE felt), adjustable target RPE and target reps, single card recommendation with weight + percentage change + logic explanation
- Recommended weight auto-rounds to nearest 5 lb / 2.5 kg
- Unit handling follows user's preferred unit setting

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
| Ionicons (@expo/vector-icons) | Bundled with Expo 55 | Tab icon (calculator-outline) | Project standard for all icons |
| react-native-safe-area-context | ~5.6.2 | SafeAreaView for screen | Project standard |

### Supporting (already available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | 5.0.11 | Read `preferredUnit` from authStore | Unit toggle (kg/lbs) |
| react-native-mmkv | 4.2.0 | Backing store for authStore | Already wired |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| View-based barbell diagram | react-native-svg | SVG adds complexity for what is just colored rectangles; Views are simpler and consistent with project convention |
| Custom numeric input | TextInput with keyboardType="decimal-pad" | Standard RN approach; matches SetCard pattern |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/features/calculator/
  components/
    PlateCalculator.tsx      # Plate loading sub-tool
    BarbellDiagram.tsx       # Visual barbell with colored plates
    BarWeightPicker.tsx      # Dropdown for bar weight presets
    RpeCalculator.tsx        # RPE/1RM combined sub-tool
    RpeTable.tsx             # RPE x Reps percentage grid
    NextSetCalculator.tsx    # Next-set recommendation sub-tool
    NextSetCard.tsx          # Result card with recommendation
  utils/
    plateCalculator.ts       # Pure function: weight -> plate breakdown
    rpeTable.ts              # RPE percentage lookup table + helpers
    nextSetRecommendation.ts # Pure function: last set + targets -> recommended weight
  constants/
    plates.ts                # Plate sets (lb and kg), bar presets, plate colors
  types.ts                   # TypeScript types for calculator domain

app/(app)/(tabs)/
  calculator.tsx             # Tab screen with PagerView + segmented control
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

  // ... identical to plans.tsx structure
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
  remainder: number; // weight that can't be made with available plates
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
    const count = Math.floor(perSide / plate);
    if (count > 0) {
      plates.push({ weight: plate, count });
      perSide -= count * plate;
    }
  }
  return { plates, remainder: Math.round(perSide * 100) / 100 };
}
```

### Pattern 3: View-Based Barbell Diagram
**What:** Horizontal barbell rendered with React Native View components (colored rectangles)
**When to use:** Visual plate display -- no SVG needed
**Example:**
```typescript
// Plates rendered as View rectangles with proportional heights
// Heights based on real plate diameter ratios:
// 45lb/25kg = tallest (full height), scaled down proportionally
const PLATE_HEIGHTS: Record<number, number> = {
  45: 80, 35: 70, 25: 60, 10: 50, 5: 40, 2.5: 30,
};
```

### Anti-Patterns to Avoid
- **Coupling to workout state:** Calculator is standalone. Never import from workout stores or active session state.
- **Over-engineering the barbell SVG:** Plain View rectangles with border radius are sufficient. SVG adds unnecessary complexity.
- **Inline magic numbers:** All plate weights, bar presets, RPE percentages belong in constants files.
- **Mutating state during calculations:** All math functions must be pure (input -> output, no side effects).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 1RM estimation | Custom formula | `calculateEpley1RM` from `src/features/history/utils/epley.ts` | Already exists, tested, consistent with rest of app |
| Unit preference | Local state toggle | `useAuthStore(s => s.preferredUnit)` | User has already set their preference globally |
| Tab indicator animation | Manual translateX math | Copy Plans tab `indicatorStyle` pattern with Reanimated `useSharedValue` + `withTiming` | Proven pattern, pixel-perfect |
| Keyboard dismiss | Custom gesture handler | `ScrollView` with `keyboardShouldPersistTaps="handled"` + `Keyboard.dismiss()` on background tap | Standard RN pattern |

## Common Pitfalls

### Pitfall 1: Floating Point Plate Math
**What goes wrong:** `(225 - 45) / 2 = 90` works, but `(227.5 - 45) / 2 = 91.25` and plate subtraction can accumulate floating point errors (e.g., `91.25 - 45 - 45 = 1.2499999999999929`)
**Why it happens:** JavaScript floating point arithmetic
**How to avoid:** Round to 2 decimal places after each subtraction step, or work in smallest plate units (multiply by 4 to work in integers for 2.5lb plates)
**Warning signs:** Remainder shows as 0.0000000001 instead of 0

### Pitfall 2: Target Weight Below Bar Weight
**What goes wrong:** User enters 30 lbs with a 45 lb bar, calculation produces negative per-side weight
**Why it happens:** No input validation
**How to avoid:** Show "Weight must exceed bar weight" message when target <= barWeight. Do not attempt plate calculation.
**Warning signs:** Negative numbers or empty plate lists with no explanation

### Pitfall 3: RPE Table Boundary Values
**What goes wrong:** User enters RPE 10 at 12 reps, which maps to a very low percentage that may produce unusually small weights
**Why it happens:** RPE 10 at high reps is rarely used in practice
**How to avoid:** Include all standard values in the table (RPE 6-10 at reps 1-12). Display the full grid without hiding edge cases -- users understand the context.
**Warning signs:** Percentages below 50% that look wrong

### Pitfall 4: Rounding to Plate-Loadable Increments
**What goes wrong:** Next-set recommendation says "182.3 lbs" which is impossible to load
**Why it happens:** Raw math output not rounded to loadable weight
**How to avoid:** Round to nearest 5 lb (lbs mode) or 2.5 kg (kg mode) as specified in CONTEXT.md
**Warning signs:** Recommendations with decimal weights

### Pitfall 5: Keyboard Covering Inputs
**What goes wrong:** On smaller screens, the numeric keyboard covers the input fields or result areas
**Why it happens:** No scroll or keyboard avoidance
**How to avoid:** Wrap each sub-tool content in `KeyboardAvoidingView` + `ScrollView`. Use `keyboardShouldPersistTaps="handled"` so tapping results doesn't dismiss keyboard unexpectedly.
**Warning signs:** User can't see results while typing

## Code Examples

### Plate Calculation (Pure Function)
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
  { label: 'Olympic (45 lb / 20 kg)', weightLb: 45, weightKg: 20 },
  { label: "Women's (35 lb / 15 kg)", weightLb: 35, weightKg: 15 },
  { label: 'EZ Curl (25 lb / 10 kg)', weightLb: 25, weightKg: 10 },
  { label: 'Training (15 lb / 7 kg)', weightLb: 15, weightKg: 7 },
];

// Standard competition plate colors (IPF-style)
export const PLATE_COLORS: Record<number, string> = {
  // lb plates
  45: '#EF4444', // red
  35: '#3B82F6', // blue
  25: '#22C55E', // green
  10: '#FBBF24', // yellow
  5: '#F5F5F5',  // white
  2.5: '#A3A3A3', // gray
  // kg plates
  // 25: red, 20: blue, 15: yellow, 10: green, 5: white, 2.5: red/small, 1.25: gray
};
```

### RPE Percentage Table (Tuchscherer Standard)
```typescript
// src/features/calculator/utils/rpeTable.ts

// Standard RPE-to-percentage table (Tuchscherer/RTS)
// Key: RPE, Value: array of percentages indexed by (reps - 1)
// RPE 10 @ 1 rep = 100%, RPE 10 @ 2 reps = 95.5%, etc.
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

/**
 * Get the weight for a given 1RM, RPE, and rep count.
 */
export function getWeightForRpeAndReps(
  e1rm: number,
  rpe: number,
  reps: number
): number {
  const percentages = RPE_TABLE[rpe];
  if (!percentages || reps < 1 || reps > 12) return 0;
  return Math.round((e1rm * percentages[reps - 1]) / 100 * 10) / 10;
}
```

### Next-Set Recommendation Logic
```typescript
// src/features/calculator/utils/nextSetRecommendation.ts
import { calculateEpley1RM } from '@/features/history/utils/epley';
import { RPE_TABLE } from './rpeTable';

export interface NextSetInput {
  lastWeight: number;
  lastReps: number;
  lastRpe: number;   // RPE felt on last set
  targetRpe: number;  // desired RPE for next set
  targetReps: number; // desired reps for next set
  unit: 'kg' | 'lbs';
}

export interface NextSetResult {
  recommendedWeight: number;
  percentChange: number;  // e.g., -10.5 for 10.5% decrease
  explanation: string;
}

export function calculateNextSet(input: NextSetInput): NextSetResult {
  // Step 1: Estimate 1RM from last set using RPE table
  const lastPercentage = RPE_TABLE[input.lastRpe]?.[input.lastReps - 1];
  if (!lastPercentage) {
    return { recommendedWeight: input.lastWeight, percentChange: 0, explanation: 'Invalid RPE/rep combination' };
  }
  const estimated1RM = (input.lastWeight / lastPercentage) * 100;

  // Step 2: Find target percentage for desired RPE + reps
  const targetPercentage = RPE_TABLE[input.targetRpe]?.[input.targetReps - 1];
  if (!targetPercentage) {
    return { recommendedWeight: input.lastWeight, percentChange: 0, explanation: 'Invalid target RPE/rep combination' };
  }

  // Step 3: Calculate raw weight and round to loadable increment
  const rawWeight = (estimated1RM * targetPercentage) / 100;
  const increment = input.unit === 'lbs' ? 5 : 2.5;
  const recommendedWeight = Math.round(rawWeight / increment) * increment;

  // Step 4: Calculate percentage change
  const percentChange = ((recommendedWeight - input.lastWeight) / input.lastWeight) * 100;

  // Step 5: Build explanation
  const direction = percentChange > 0 ? 'increase' : percentChange < 0 ? 'decrease' : 'same';
  const explanation = `Based on e1RM of ${Math.round(estimated1RM)} ${input.unit}, ` +
    `${input.targetReps} reps at RPE ${input.targetRpe} = ${targetPercentage}% of 1RM`;

  return { recommendedWeight, percentChange: Math.round(percentChange * 10) / 10, explanation };
}
```

### Tab Layout (expo-router)
```typescript
// In app/(app)/(tabs)/_layout.tsx -- add between Plans and Settings:
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
| Multiple formula options (Epley, Brzycki, Lombardi) | Single Epley formula | Project decision | Simpler UI, consistent with existing `calculateEpley1RM` |
| Separate RPE and 1RM screens | Combined single tool | User decision | Fewer taps, RPE table derived from 1RM input |

**Not applicable to this phase:**
- No deprecated APIs or breaking changes relevant
- All dependencies already installed and compatible

## Open Questions

1. **KG plate color scheme**
   - What we know: lb plates follow IPF-standard colors (red 45, blue 35, green 25, yellow 10)
   - What's unclear: kg plates have overlapping weight values with different colors (25kg=red vs 25lb=green)
   - Recommendation: Use separate color maps for lb and kg modes. Standard IPF kg colors: 25kg=red, 20kg=blue, 15kg=yellow, 10kg=green, 5kg=white, 2.5kg=red(small), 1.25kg=silver/gray

2. **Bar weight presets in kg mode**
   - What we know: Olympic bar is 20kg, women's is 15kg, EZ curl is ~10kg
   - What's unclear: Whether to show lb labels alongside kg or only show unit-appropriate values
   - Recommendation: Show only the weight in the user's preferred unit. Bar preset objects contain both values, display the relevant one.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 55 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest tests/calculator/ --bail` |
| Full suite command | `npx jest --bail` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CALC-01 | Plate calculation returns correct breakdown for given weight/bar | unit | `npx jest tests/calculator/plateCalculator.test.ts -x` | No - Wave 0 |
| CALC-02 | Handles weight below bar weight gracefully | unit | `npx jest tests/calculator/plateCalculator.test.ts -x` | No - Wave 0 |
| CALC-03 | RPE table returns correct percentages for all RPE x rep combos | unit | `npx jest tests/calculator/rpeTable.test.ts -x` | No - Wave 0 |
| CALC-04 | 1RM estimation matches existing Epley function | unit | `npx jest tests/calculator/rpeCalculator.test.ts -x` | No - Wave 0 |
| CALC-05 | Next-set recommendation rounds to nearest loadable increment | unit | `npx jest tests/calculator/nextSet.test.ts -x` | No - Wave 0 |
| CALC-06 | Next-set handles same RPE/reps (no change scenario) | unit | `npx jest tests/calculator/nextSet.test.ts -x` | No - Wave 0 |
| CALC-07 | Unit switching (lb/kg) uses correct plate sets and rounding | unit | `npx jest tests/calculator/plateCalculator.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest tests/calculator/ --bail`
- **Per wave merge:** `npx jest --bail`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/calculator/plateCalculator.test.ts` -- covers CALC-01, CALC-02, CALC-07
- [ ] `tests/calculator/rpeTable.test.ts` -- covers CALC-03
- [ ] `tests/calculator/rpeCalculator.test.ts` -- covers CALC-04
- [ ] `tests/calculator/nextSet.test.ts` -- covers CALC-05, CALC-06

## Sources

### Primary (HIGH confidence)
- Project codebase: `app/(app)/(tabs)/plans.tsx` -- PagerView + segmented control pattern (direct reuse)
- Project codebase: `src/features/history/utils/epley.ts` -- existing Epley 1RM function
- Project codebase: `src/stores/authStore.ts` -- preferredUnit access pattern
- Project codebase: `src/constants/theme.ts` -- color constants
- Project codebase: `package.json` -- all dependencies already installed

### Secondary (MEDIUM confidence)
- [RPE Calculator](https://www.rpecalculator.com/) -- standard Tuchscherer RPE table reference
- [Exodus Strength](https://www.exodus-strength.com/forum/viewtopic.php?t=2967) -- RPE percentage table expansion discussion
- IPF plate color standards -- widely documented competition plate color scheme

### Tertiary (LOW confidence)
- Exact RPE percentage values at edge cases (RPE 6 at 12 reps) -- values vary slightly between sources. The table provided uses the most commonly cited Tuchscherer values and should be validated against a primary source if precision matters.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already installed, no new packages
- Architecture: HIGH -- direct replication of existing Plans tab pattern
- Pitfalls: HIGH -- common math/UX issues well-understood
- RPE table values: MEDIUM -- standard Tuchscherer values, slight variations exist between sources

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable domain, no moving dependencies)
