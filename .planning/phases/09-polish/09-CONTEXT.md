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
- No major visual redesign — the dark theme is already in place, this is about making it intentional and uniform
- Keep current blue accent (#3b82f6) — just ensure it's applied consistently everywhere

### App icon & splash screen
- Dumbbell/barbell icon direction — classic gym symbol, stylized on dark background with accent color
- AI-generated icon — Claude provides the prompt, user generates the final asset
- Splash screen: app icon centered on #0a0a0a dark background — clean and standard
- App name stays "Gym App" — simple and descriptive for the friend group
- Android adaptive icon layers (foreground/background/monochrome) already configured in app.json

### Edge case handling
- General audit approach — Claude identifies the most impactful edge cases and handles them
- No specific known issues flagged — systematic screen-by-screen review needed

### OTA pipeline
- EAS Update configuration for the friend group's devices
- Test update must successfully reach a device without a new store submission (success criterion #3)

### Claude's Discretion
- OTA update behavior (auto-update on launch vs prompt — pick simplest for small group)
- Update channel strategy (single vs dual — pick what makes sense for friend group)
- Runtime version policy (appVersion vs nativeVersion — pick safest for Expo SDK 55)
- Rollback setup (configure if EAS provides it by default, skip if overkill)
- Typography refinement depth (fix obvious issues vs full type hierarchy audit)
- Color centralization scope (which hardcoded values are worth moving to theme.ts)
- Keyboard handling improvements (fix if obviously broken)
- Navigation transitions and animations (add where they make a noticeable difference)
- Edge case prioritization (crash prevention vs graceful degradation — balance as needed)
- Loading skeleton design and error state presentation

</decisions>

<specifics>
## Specific Ideas

- Dark & bold aesthetic inspired by Claude Code — consistent with Phases 1-8 decisions
- The polish pass should make the app feel like a finished tool, not a prototype with rough edges
- AI-generated icon prompt should emphasize: dark background, bold/clean style, dumbbell/barbell motif, accent blue highlight
- Friend group context means perfect pixel polish isn't needed — functional consistency is the goal

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/constants/theme.ts`: Central color constants (background, surface, surfaceElevated, accent, text colors, semantic colors)
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
- `app.json` for icon/splash/EAS Update configuration
- `eas.json` for update channel and runtime version policy
- All component files referencing hardcoded color values (#fff, #ffffff, etc.)
- Tab bar, navigation headers, status bar — system-level theming touchpoints

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-polish*
*Context gathered: 2026-03-10*
