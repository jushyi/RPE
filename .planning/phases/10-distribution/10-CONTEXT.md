# Phase 10: Distribution - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

The app is installable by the friend group on real iOS devices via TestFlight and all critical behaviors (offline logging, alarm delivery, RLS isolation, plan-history separation) are verified on physical hardware before distribution. Android distribution deferred — iOS only for this phase.

</domain>

<decisions>
## Implementation Decisions

### iOS distribution
- Apple Developer account already enrolled — no signup steps needed
- TestFlight internal testing for 1-5 friends — no App Review required
- Full walkthrough needed: App Store Connect listing setup, build upload, TestFlight invite process
- Physical iPhone available for testing

### Build & signing
- EAS-managed credentials — let EAS generate and store provisioning profiles and signing certificates
- Cloud builds on Expo servers — no local Xcode required
- Production build profile for TestFlight submission (store-ready build)
- EAS Submit configured for automatic TestFlight upload after build completes (build → auto-upload → TestFlight)
- Auto-increment versioning already configured in eas.json production profile

### Verification approach
- Interactive CLI script that prompts through each test with pass/fail recording
- Skip progress photo private bucket test (feature deferred in Phase 7)
- Include second Supabase test account creation as part of RLS isolation verification
- OS minimums: Claude's discretion based on Expo SDK 55 support matrix

### Verification tests (from success criteria)
1. App builds via EAS Build and installs on physical iOS via TestFlight
2. Alarm fires with sound and vibration and requires dismissal (iOS)
3. Offline workout logging: airplane mode → log full session → reconnect → appears in history
4. RLS isolation: second account cannot read or modify first account's data
5. Plan-edit history isolation: editing a plan doesn't alter previously logged sessions

### Android distribution
- Deferred — not included in this phase
- Can be added as Phase 10.1 or folded into a future milestone

### Claude's Discretion
- Minimum iOS version target (based on Expo SDK 55 compatibility)
- App Store Connect configuration details (categories, screenshots placeholder, age rating)
- Interactive script implementation (Node.js CLI vs shell script)
- TestFlight beta app review compliance details
- EAS Build environment variables and secrets configuration
- Whether to include a smoke test for EAS Update OTA delivery on the TestFlight build

</decisions>

<specifics>
## Specific Ideas

- App has been renamed to "RPE" in Phase 9 — TestFlight listing should reflect this
- Bundle ID is `com.spoods.gymapp` — already configured in app.json
- EAS project already linked (projectId in app.json, owner: spoodsjs)
- Friend group is small (1-5 iOS testers) — keep the process simple and manual-friendly
- The interactive verification script should be something the user runs on their machine while physically testing on the device

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `eas.json`: Build profiles (development, preview, production) with autoIncrement and remote appVersionSource
- `app.json`: Full Expo config with iOS bundleIdentifier, EAS projectId, plugins list
- `src/lib/supabase.ts`: Supabase client — needed for RLS isolation test
- `src/stores/`: All Zustand + MMKV stores — offline sync verification depends on these

### Established Patterns
- Expo managed workflow — no bare workflow ejection needed for EAS Build
- MMKV for local-first data persistence — key to offline verification test
- Supabase RLS policies on all tables — basis for cross-user isolation test
- expo-notifications (Phase 8) — alarm delivery verification on physical device

### Integration Points
- `eas.json` needs submit configuration for auto-upload to App Store Connect
- `app.json` may need iOS-specific config tweaks for TestFlight (e.g., NSAppTransportSecurity if needed)
- EAS credentials setup (first-time run will prompt for Apple ID login)
- Verification script reads from app config to know what to test

</code_context>

<deferred>
## Deferred Ideas

- Android distribution (APK/AAB, Play Store internal track) — separate phase or 10.1 insertion
- Automated E2E testing on device (Detox or Maestro) — overkill for friend group, revisit if user base grows

</deferred>

---

*Phase: 10-distribution*
*Context gathered: 2026-03-10*
