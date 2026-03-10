# Phase 9: Polish - Research

**Researched:** 2026-03-10
**Domain:** React Native (Expo SDK 55) theming, app branding, OTA updates
**Confidence:** HIGH

## Summary

Phase 9 is a quality gate with three distinct workstreams: (1) theme consistency audit swapping accent from blue to magenta and centralizing all hardcoded colors, (2) app icon/splash screen creation with app rename to "RPE", and (3) EAS Update OTA pipeline configuration. The project already has a well-structured `theme.ts` with centralized color constants, making the accent swap straightforward -- the main work is finding and replacing ~23 files with hardcoded hex values. The app icon will be programmatically generated as SVG then exported to PNG. EAS Update requires installing `expo-updates`, running `eas update:configure`, and adding channel configuration to `eas.json`.

The project uses `StyleSheet.create` throughout (not NativeWind for styling despite it being installed), Expo Router 55.0.4 with file-based routing, and has existing dark mode infrastructure (`userInterfaceStyle: "dark"` in app.json, dark colors in theme.ts). The edge case handling (keyboard, transitions, loading states) is additive polish on existing screens.

**Primary recommendation:** Start with theme.ts accent swap (single source of truth), then systematically grep-and-replace all hardcoded colors across the 23 identified files, then handle app icon/splash/rename, and finally configure EAS Update as a separate independent workstream.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Consistency audit across all screens -- fix mismatched grays, hardcoded colors not using theme.ts, spacing/typography drift between phases
- Swap accent color from blue (#3b82f6) to hot pink/magenta (#ec4899) -- user chose this as the new brand color
- Update accentBright to match (lighter magenta variant for hover/highlight states)
- Centralize ALL hardcoded color values into theme.ts -- replace every #fff, #ffffff, and other hardcoded hex with theme constants
- No major layout redesign -- this is about color consistency and intentionality
- Dumbbell/barbell icon direction -- classic gym symbol, stylized on dark background with magenta accent
- SVG/vector designed by Claude programmatically -- clean, simple, bold
- Splash screen: app icon centered on #0a0a0a dark background -- clean and standard
- Rename app from "Gym App" to "RPE" -- short, punchy, gym-relevant
- Android adaptive icon layers (foreground/background/monochrome) already configured in app.json
- Graceful degradation priority -- loading skeletons, friendly error messages, retry buttons, empty state improvements
- General audit approach -- Claude does systematic screen-by-screen review
- Fix keyboard handling across all input screens -- keyboard avoidance, auto-dismiss, focus flow
- Add smooth navigation transitions and micro-animations -- consistent across all screen changes
- EAS Update configuration for the friend group's devices
- Test update must successfully reach a device without a new store submission (success criterion #3)

### Claude's Discretion
- OTA update behavior (auto-update on launch vs prompt -- pick simplest for small group)
- Update channel strategy (single vs dual -- pick what makes sense for friend group)
- Runtime version policy (appVersion vs nativeVersion -- pick safest for Expo SDK 55)
- Rollback setup (configure if EAS provides it by default, skip if overkill)
- Loading skeleton design and error state presentation
- Specific navigation transition styles (fade, slide, custom)
- Typography consistency (fix as encountered during audit)
- Exact magenta accent bright variant hex value

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | 55.0.5 | Framework | Already in use |
| expo-router | 55.0.4 | File-based routing | Navigation transitions configured here |
| expo-splash-screen | 55.0.10 | Splash screen | Already configured in app.json plugins |
| react-native-reanimated | 4.2.1 | Micro-animations | Already installed, used for transitions |
| expo-haptics | 55.0.8 | Tactile feedback | Already installed |
| react-native-svg | 15.15.3 | SVG rendering | Can render icon preview in-app |

### New (Must Install)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-updates | ~55.x | OTA update delivery | Required for EAS Update pipeline |

### Not Needed
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| NativeWind dark mode | StyleSheet.create + theme.ts | Project already uses StyleSheet.create everywhere -- do NOT switch |
| sharp / image processing | Programmatic SVG export | App icon SVGs can be created as code, exported via web tool or sharp CLI |

**Installation:**
```bash
npx expo install expo-updates
```

## Architecture Patterns

### Theme Centralization Pattern

**What:** All color values flow from `src/constants/theme.ts`. No component should contain raw hex values.

**Current state of theme.ts:**
```typescript
export const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceElevated: '#252525',
  accent: '#3b82f6',        // CHANGE to '#ec4899'
  accentBright: '#60a5fa',   // CHANGE to '#f472b6' (lighter magenta)
  textPrimary: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
} as const;
```

**New colors to add to theme.ts:**
```typescript
export const colors = {
  // ... existing
  white: '#ffffff',          // Replaces hardcoded #fff/#ffffff
  border: '#333333',         // For border colors (if used)
  // Add any other hardcoded values found during audit
} as const;
```

### Files with Hardcoded Colors (Audit Checklist)

**In `src/` (17 files):**
- `src/features/body-metrics/components/MeasurementForm.tsx`
- `src/features/dashboard/components/TappableAvatar.tsx`
- `src/features/workout/components/SetCard.tsx`
- `src/features/workout/components/ActiveWorkoutBar.tsx`
- `src/features/history/components/SessionExerciseCard.tsx`
- `src/features/workout/components/WeightTargetPrompt.tsx`
- `src/features/plans/components/PlanExerciseRow.tsx`
- `src/features/plans/components/DaySlotEditor.tsx`
- `src/features/plans/components/PlanDaySection.tsx`
- `src/features/exercises/components/ExerciseBottomSheet.tsx`
- `src/features/exercises/components/ExerciseFilterBar.tsx`
- `src/features/plans/components/PlanCard.tsx`
- `src/features/exercises/constants/muscleGroups.ts`
- `src/features/auth/components/PRBaselineForm.tsx`
- `src/components/layout/ConnectivityBanner.tsx`
- `src/components/ui/Button.tsx`

**In `app/` (6 files):**
- `app/(app)/workout/index.tsx`
- `app/(app)/plans/[id].tsx`
- `app/(app)/workout/summary.tsx`
- `app/(app)/(tabs)/plans.tsx`
- `app/(app)/plans/create.tsx`
- `app/(app)/(tabs)/exercises.tsx`

### Navigation Transition Pattern

**What:** Consistent screen transition animations across all Stack navigators.

**Current state:** Only `workout/_layout.tsx` has `animation: 'slide_from_bottom'`. All other stacks use defaults.

**Recommended approach:**
```typescript
// In app/(app)/_layout.tsx screenOptions
screenOptions={{
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.textPrimary,
  headerRight: () => <HeaderCloudIcon />,
  contentStyle: { backgroundColor: colors.background },
  animation: 'fade_from_bottom', // or 'slide_from_right' (iOS default feel)
}}
```

Available animations in expo-router Stack (react-native-screens):
- `default` -- platform default
- `fade` -- cross-fade
- `fade_from_bottom` -- fade + slide up (Material Design)
- `slide_from_right` -- iOS push style
- `slide_from_left` -- reverse push
- `slide_from_bottom` -- modal style (already used for workout)
- `none` -- no animation

**Recommendation:** Use `slide_from_right` as default (native iOS feel), keep `slide_from_bottom` for workout (modal behavior), use `fade` for tab switches if customizable.

### Keyboard Handling Pattern

**What:** Consistent keyboard behavior across all input screens.

**Current state:** 4 src files and 2 app files use KeyboardAvoidingView, but coverage is inconsistent.

**Standard pattern for input screens:**
```typescript
import { KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <ScrollView keyboardShouldPersistTaps="handled">
      {/* form content */}
    </ScrollView>
  </TouchableWithoutFeedback>
</KeyboardAvoidingView>
```

**Screens needing keyboard audit:**
- Workout logging (SetCard inputs)
- Plan creation/editing forms
- Exercise creation bottom sheet
- PR baseline form
- Auth forms (login/signup)
- Body metrics forms

### App Icon Generation Pattern

**What:** Programmatically create SVG icon, export to required PNG sizes.

**Requirements:**
- iOS: 1024x1024 PNG, exactly square, no transparency, no rounded corners (OS masks)
- Android adaptive icon: foreground (108x108dp safe zone in 72x72dp center), background, monochrome layers
- Splash icon: centered on #0a0a0a background

**Approach:**
1. Create SVG markup for dumbbell/barbell icon with magenta (#ec4899) accent on dark (#0a0a0a) background
2. Export to PNG at required sizes using a script or web tool
3. Place files in `assets/images/` (paths already configured in app.json)

**App rename:** Change `"name": "Gym App"` to `"name": "RPE"` in app.json.

### EAS Update Configuration Pattern

**What:** Configure OTA updates for the friend group's devices.

**Step-by-step:**

1. Install expo-updates:
```bash
npx expo install expo-updates
```

2. Configure EAS Update:
```bash
eas update:configure
```
This adds `runtimeVersion` and `updates.url` to app.json, plus updates `extra.eas.projectId`.

3. Add channels to eas.json:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "autoIncrement": true,
      "channel": "production"
    }
  }
}
```

4. Set runtime version policy in app.json:
```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

5. Publish an update (SDK 55+ requires `--environment` flag):
```bash
eas update --channel production --message "description" --environment production
```

6. Test: Force close and reopen the app twice on a release build to verify the update is applied.

**Discretion decisions (recommendations):**

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Update behavior | Auto-update on launch (default) | Simplest for small friend group, no UI prompt needed |
| Channel strategy | Single `production` channel | Dual channels are overkill for friend group |
| Runtime version policy | `appVersion` | Simplest, predictable -- bumping `version` in app.json creates new runtime. `fingerprint` causes too-frequent rebuilds. `nativeVersion` requires managing buildNumber/versionCode. |
| Rollback | Skip explicit setup | EAS provides rollback via republishing previous update -- no extra config needed |
| AccentBright hex | `#f472b6` | Tailwind pink-400, lighter variant of #ec4899 (pink-500), consistent with Tailwind scale |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OTA updates | Custom update server | EAS Update + expo-updates | Handles versioning, channels, rollback, CDN delivery |
| App icon masking | Manual corner rounding | Let OS handle via adaptive icon config | Each platform has different mask shapes |
| Loading skeletons | Custom shimmer animation | Reanimated opacity pulse or simple ActivityIndicator | Shimmer requires careful performance tuning |
| Keyboard avoidance | Custom keyboard listeners | KeyboardAvoidingView + platform behavior prop | Handles safe area, tab bar offset, rotation |

**Key insight:** This phase is about consistency and configuration, not building new features. Every problem here has a platform-standard solution.

## Common Pitfalls

### Pitfall 1: Forgetting Platform-Specific Icon Requirements
**What goes wrong:** Icon renders correctly on one platform but is cropped/distorted on another.
**Why it happens:** iOS uses rounded rect mask, Android uses various shapes (circle, squircle). Android adaptive icon has safe zone rules.
**How to avoid:** iOS icon must be exactly 1024x1024 with NO transparency. Android foreground must keep important content within the center 72x72dp of the 108x108dp canvas. Always test on both platforms.
**Warning signs:** Icon looks correct in simulator but wrong on physical device.

### Pitfall 2: Hardcoded Colors Missed During Audit
**What goes wrong:** A screen still shows blue accent or white text on white background after the theme pass.
**Why it happens:** Grep misses template literals, inline styles in JSX, or colors defined in constants files (like muscleGroups.ts).
**How to avoid:** After grep-based replacement, do a visual screen-by-screen walkthrough. Check: tab bar, headers, buttons, chips, cards, modals, bottom sheets, status indicators.
**Warning signs:** Any screen that looks different from others after the theme pass.

### Pitfall 3: EAS Update Not Working in Expo Go
**What goes wrong:** Testing OTA updates in Expo Go fails silently.
**Why it happens:** Expo Go doesn't support expo-updates API methods. Updates must be tested in a release build or development build.
**How to avoid:** Create a preview build (`eas build --profile preview`) and test OTA updates against that build. Expo Go is fine for testing content changes but not update behavior.
**Warning signs:** `Updates.checkForUpdateAsync()` returns undefined or throws in development.

### Pitfall 4: Runtime Version Mismatch After SDK Update
**What goes wrong:** Published update fails to load on device, app shows stale content.
**Why it happens:** Runtime version of the update doesn't match the build's runtime version.
**How to avoid:** After changing `version` in app.json, create a new build before publishing updates. With `appVersion` policy, the version string must match exactly.
**Warning signs:** EAS dashboard shows update published but 0 devices received it.

### Pitfall 5: KeyboardAvoidingView + Bottom Tab Bar Offset
**What goes wrong:** Content pushed up by keyboard is hidden behind the tab bar or pushed too high.
**Why it happens:** KeyboardAvoidingView doesn't account for tab bar height by default.
**How to avoid:** Use `keyboardVerticalOffset` prop to account for header/tab bar heights. On screens without tab bar (stack screens), this isn't needed.
**Warning signs:** Form inputs are unreachable or overlap with navigation elements when keyboard is open.

### Pitfall 6: Splash Screen Duration on Cold Start
**What goes wrong:** Splash screen shows default Expo icon briefly before custom splash.
**Why it happens:** expo-splash-screen plugin generates native splash screen resources at build time, but Expo Go uses its own splash.
**How to avoid:** Test splash screen in a development build or preview build, not Expo Go. The splash screen configuration in app.json plugins is applied during prebuild.
**Warning signs:** Splash looks correct in build but shows Expo logo in Expo Go.

## Code Examples

### Accent Color Swap (theme.ts)
```typescript
// Source: Project file src/constants/theme.ts
export const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceElevated: '#252525',
  accent: '#ec4899',          // Was #3b82f6 (blue) -> now magenta
  accentBright: '#f472b6',    // Was #60a5fa (blue) -> now light magenta
  textPrimary: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  white: '#ffffff',            // NEW: replaces hardcoded #fff/#ffffff
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
} as const;
```

### App Rename in app.json
```json
{
  "expo": {
    "name": "RPE",
    "slug": "gym-app"
  }
}
```
Note: Keep `slug` as `gym-app` to maintain EAS project identity. Only `name` changes (display name).

### EAS Update app.json Additions
```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/8ea209dd-0ed7-4d73-9aee-3a6fe3993657"
    }
  }
}
```

### Simple Loading Skeleton Pattern
```typescript
// Reusable skeleton component using Reanimated
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';

export function Skeleton({ width, height }: { width: number; height: number }) {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    width,
    height,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
  }));

  return <Animated.View style={style} />;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual runtime version strings | Policy-based (`appVersion`, `fingerprint`) | Expo SDK 49+ | Automatic version management |
| expo-app-loading | expo-splash-screen plugin | Expo SDK 50 | Config plugin replaces imperative API |
| `eas update` without `--environment` | `eas update --environment` required | SDK 55 | Must specify environment for EAS environment variables |

## Open Questions

1. **App icon PNG generation workflow**
   - What we know: SVG will be designed programmatically, needs export to 1024x1024 PNG + adaptive icon layers
   - What's unclear: Whether to use a Node script with sharp, a web tool, or manual export
   - Recommendation: Use a web-based tool (Expo Assets Generator or similar) or install sharp as a dev dependency for scripted export. Given this is a one-time task, a web tool is simplest.

2. **Exact scope of edge case improvements**
   - What we know: Loading skeletons, error messages, retry buttons, empty states, keyboard handling
   - What's unclear: How many screens actually need loading skeletons vs already have adequate states
   - Recommendation: During the theme audit, inventory each screen's loading/error/empty states and fix as encountered rather than pre-planning every fix.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 55 |
| Config file | package.json (scripts.test) |
| Quick run command | `npx jest --bail` |
| Full suite command | `npx jest` |

### Phase Requirements -> Test Map

This phase has no formal requirement IDs (delivery quality gate). Validation is primarily visual/manual.

| Behavior | Test Type | Automated Command | Notes |
|----------|-----------|-------------------|-------|
| Theme colors centralized (no hardcoded hex) | lint/grep | `grep -rn "#fff\|#ffffff\|#3b82f6\|#60a5fa" src/ app/ --include="*.tsx" --include="*.ts"` | Should return 0 matches (except theme.ts) |
| Accent color is magenta | manual | N/A | Visual inspection across all screens |
| App name displays as "RPE" | manual | N/A | Check app.json name field, verify on device |
| App icon renders correctly | manual | N/A | Check iOS and Android builds |
| Splash screen shows on dark bg | manual | N/A | Requires preview/release build |
| EAS Update delivers OTA | manual | `eas update --channel production --message "test" --environment production` | Must verify on physical device |
| Existing tests still pass | unit | `npx jest --bail` | Regression check |

### Sampling Rate
- **Per task commit:** `npx jest --bail`
- **Per wave merge:** `npx jest` + visual audit
- **Phase gate:** Full suite green + manual screen walkthrough + OTA test delivery

### Wave 0 Gaps
None -- existing test infrastructure covers regression checks. This phase's success criteria are primarily visual and behavioral (manual verification).

## Sources

### Primary (HIGH confidence)
- [Expo EAS Update Getting Started](https://docs.expo.dev/eas-update/getting-started/) - Setup steps, channel config, SDK 55 --environment flag
- [Expo Updates SDK Reference](https://docs.expo.dev/versions/latest/sdk/updates/) - Runtime version policies, API methods, Expo Go limitations
- [Expo Runtime Versions](https://docs.expo.dev/eas-update/runtime-versions/) - Policy options (appVersion, nativeVersion, fingerprint)
- [Expo Splash Screen and App Icon](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/) - Icon sizes, splash config, adaptive icon setup
- Project codebase analysis - theme.ts, app.json, eas.json, all screen files

### Secondary (MEDIUM confidence)
- [Expo Stack Navigation](https://docs.expo.dev/router/advanced/stack/) - Animation options for transitions

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed or well-documented Expo packages
- Architecture: HIGH - theme centralization pattern is straightforward, existing code is well-structured
- Pitfalls: HIGH - well-known issues with icon sizing, OTA testing, Expo Go limitations
- EAS Update config: HIGH - verified against official docs, SDK 55 specific notes confirmed

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable domain, Expo SDK 55 is current)
