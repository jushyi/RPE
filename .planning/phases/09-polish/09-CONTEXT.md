# Phase 9: Polish - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

The app looks and feels like a deliberate, dark-and-bold tool — not a prototype — with consistent theming across all screens, a proper app icon and splash screen, and an EAS Update OTA pipeline for rapid iteration once the friend group is using it. No new features — this is about consistency, branding, and deployment infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Theme refinement scope
- Consistency audit across all screens — fix mismatched grays, hardcoded colors not using theme.ts, spacing/typography drift between phases
- Swap accent color from blue (#3b82f6) to hot pink/magenta (#ec4899) — user chose this as the new brand color
- Update accentBright to match (lighter magenta variant for hover/highlight states)
- Centralize ALL hardcoded color values into theme.ts — replace every #fff, #ffffff, and other hardcoded hex with theme constants
- No major layout redesign — this is about color consistency and intentionality

### App icon & splash screen
- Dumbbell/barbell icon direction — classic gym symbol, stylized on dark background with magenta accent
- SVG/vector designed by Claude programmatically — clean, simple, bold
- Splash screen: app icon centered on #0a0a0a dark background — clean and standard
- Rename app from "Gym App" to "RPE" — short, punchy, gym-relevant
- Android adaptive icon layers (foreground/background/monochrome) already configured in app.json

### Edge case handling
- Graceful degradation priority — loading skeletons, friendly error messages, retry buttons, empty state improvements
- General audit approach — Claude does systematic screen-by-screen review
- No specific known issues flagged by user
- Fix keyboard handling across all input screens — keyboard avoidance, auto-dismiss, focus flow
- Add smooth navigation transitions and micro-animations — consistent across all screen changes

### OTA pipeline
- EAS Update configuration for the friend group's devices
- Test update must successfully reach a device without a new store submission (success criterion #3)

### Claude's Discretion
- OTA update behavior (auto-update on launch vs prompt — pick simplest for small group)
- Update channel strategy (single vs dual — pick what makes sense for friend group)
- Runtime version policy (appVersion vs nativeVersion — pick safest for Expo SDK 55)
- Rollback setup (configure if EAS provides it by default, skip if overkill)
- Loading skeleton design and error state presentation
- Specific navigation transition styles (fade, slide, custom)
- Typography consistency (fix as encountered during audit)
- Exact magenta accent bright variant hex value

</decisions>

<specifics>
## Specific Ideas

- "RPE" as the app name — Rate of Perceived Exertion, a gym term that doubles as a brand name
- Hot pink/magenta (#ec4899) accent on dark backgrounds will make the app visually distinctive from typical blue/green gym apps
- The polish pass should make the app feel like a finished tool, not a prototype with rough edges
- Friend group context means perfect pixel polish isn't needed — functional consistency is the goal
- Keyboard handling is important for gym use (logging sets with gloves, quick input)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/constants/theme.ts`: Central color constants (background, surface, surfaceElevated, accent, text colors, semantic colors) — accent swap happens here first
- `assets/images/`: Existing icon and splash image slots already configured in app.json
- `eas.json`: Build profiles for development, preview, production already set up
- `app.json`: userInterfaceStyle already set to "dark", icon/splash paths configured

### Established Patterns
- StyleSheet.create for all styling (no NativeWind) — consistent across all phases
- Zustand + MMKV for state management
- Expo Router file-based routing with tab navigation
- Feature-based directory structure: `src/features/{feature}/`
- Card-based UI pattern used in dashboard, history, plans

### Integration Points
- Every screen file in `app/` needs theme consistency audit
- `app.json` for icon/splash/EAS Update configuration + app name rename
- `eas.json` for update channel and runtime version policy
- All component files referencing hardcoded color values (#fff, #ffffff, #3b82f6, etc.)
- Tab bar, navigation headers, status bar — system-level theming touchpoints
- `src/constants/theme.ts` — accent color swap propagates to all screens importing from here

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-polish*
*Context gathered: 2026-03-10*
