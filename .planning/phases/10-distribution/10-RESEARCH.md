# Phase 10: Distribution - Research

**Researched:** 2026-03-11
**Domain:** iOS distribution via EAS Build + TestFlight
**Confidence:** HIGH

## Summary

Phase 10 is a distribution and physical-device verification phase, not a feature implementation phase. The primary work involves configuring EAS Build for iOS production builds, setting up EAS Submit to auto-upload to TestFlight, creating the App Store Connect listing, and writing an interactive CLI verification script that the user runs while physically testing on their iPhone.

The Expo/EAS ecosystem provides a streamlined path from managed workflow to TestFlight. The `npx testflight` command or `eas build --auto-submit` handles the entire pipeline: build, sign, and upload. EAS-managed credentials mean no local Xcode is needed. The app already has most configuration in place (bundle ID, EAS project ID, owner, production build profile with auto-increment).

**Primary recommendation:** Use `eas build --platform ios --profile production --auto-submit` for the build-and-submit pipeline, with a Node.js CLI verification script using readline for interactive pass/fail test recording.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Apple Developer account already enrolled -- no signup steps needed
- TestFlight internal testing for 1-5 friends -- no App Review required
- Full walkthrough needed: App Store Connect listing setup, build upload, TestFlight invite process
- Physical iPhone available for testing
- EAS-managed credentials -- let EAS generate and store provisioning profiles and signing certificates
- Cloud builds on Expo servers -- no local Xcode required
- Production build profile for TestFlight submission (store-ready build)
- EAS Submit configured for automatic TestFlight upload after build completes (build -> auto-upload -> TestFlight)
- Auto-increment versioning already configured in eas.json production profile
- Interactive CLI script that prompts through each test with pass/fail recording
- Skip progress photo private bucket test (feature deferred in Phase 7)
- Include second Supabase test account creation as part of RLS isolation verification
- OS minimums: Claude's discretion based on Expo SDK 55 support matrix
- Android distribution deferred -- not included in this phase

### Claude's Discretion
- Minimum iOS version target (based on Expo SDK 55 compatibility)
- App Store Connect configuration details (categories, screenshots placeholder, age rating)
- Interactive script implementation (Node.js CLI vs shell script)
- TestFlight beta app review compliance details
- EAS Build environment variables and secrets configuration
- Whether to include a smoke test for EAS Update OTA delivery on the TestFlight build

### Deferred Ideas (OUT OF SCOPE)
- Android distribution (APK/AAB, Play Store internal track) -- separate phase or 10.1 insertion
- Automated E2E testing on device (Detox or Maestro) -- overkill for friend group, revisit if user base grows
</user_constraints>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| EAS CLI | >= 18.1.0 | Build and submit iOS apps | Already configured in eas.json cli section |
| EAS Build | cloud | Production iOS builds (.ipa) | Managed credentials, no local Xcode needed |
| EAS Submit | cloud | Auto-upload to App Store Connect | Integrates with --auto-submit flag |
| TestFlight | Apple | Internal beta distribution | Up to 100 internal testers, no review required |
| App Store Connect | Apple | App listing, build management | Required portal for TestFlight distribution |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Node.js readline | Interactive CLI verification script | Physical device test recording |
| Supabase CLI / Dashboard | Create second test account for RLS verification | During RLS isolation test step |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `eas build --auto-submit` | `npx testflight` | `npx testflight` is simpler one-command but less configurable; `--auto-submit` integrates with existing eas.json profiles |
| Node.js readline script | Shell script (bash) | Node.js is cross-platform (user is on Windows), has better formatting, and matches project stack |

**Commands:**
```bash
# Build + auto-submit to TestFlight
eas build --platform ios --profile production --auto-submit

# Or the simpler one-command approach
npx testflight

# Submit a specific existing build
eas submit --platform ios --latest
```

## Architecture Patterns

### Recommended Task Structure
```
Phase 10 tasks:
1. app.json + eas.json configuration tweaks
2. App Store Connect listing creation (manual, documented steps)
3. EAS Build + Submit execution
4. Interactive verification script
5. TestFlight invite process (manual, documented steps)
```

### Pattern 1: EAS Build Configuration
**What:** Configure eas.json submit profile with ascAppId for non-interactive submissions
**When to use:** After creating the App Store Connect listing (which generates the ascAppId)
**Example:**
```json
{
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "XXXXXXXXXX",
        "appleTeamId": "TEAM_ID_HERE"
      }
    }
  }
}
```
Source: https://docs.expo.dev/submit/ios/

### Pattern 2: Interactive Verification Script
**What:** Node.js CLI script that walks through each test case, prompts for pass/fail, and writes a results summary
**When to use:** After app is installed on physical device via TestFlight
**Example:**
```javascript
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const tests = [
  { id: 'TF-01', name: 'App installs from TestFlight', instructions: 'Accept TestFlight invite, install app, launch it' },
  { id: 'ALM-01', name: 'Alarm fires with sound/vibration', instructions: 'Set alarm for 1 min from now, lock phone, verify alarm fires' },
  { id: 'OFF-01', name: 'Offline workout logging', instructions: 'Enable airplane mode, log full workout, disable airplane mode, check history' },
  { id: 'RLS-01', name: 'RLS isolation', instructions: 'Log in as second account, verify cannot see first account data' },
  { id: 'HIST-01', name: 'Plan-history isolation', instructions: 'Edit a plan, verify old sessions unchanged' },
];

async function runTests() {
  const results = [];
  for (const test of tests) {
    console.log(`\n--- ${test.id}: ${test.name} ---`);
    console.log(`Instructions: ${test.instructions}`);
    const answer = await ask('Result (pass/fail/skip): ');
    const notes = await ask('Notes (optional): ');
    results.push({ ...test, result: answer.trim(), notes: notes.trim() });
  }
  // Write results to file
}
```

### Pattern 3: App Store Connect Listing Setup
**What:** Manual steps documented as a checklist (not automatable)
**Steps:**
1. Log in to App Store Connect (appstoreconnect.apple.com)
2. Go to "My Apps" > "+" > "New App"
3. Platform: iOS
4. Name: "RPE"
5. Primary Language: English
6. Bundle ID: select `com.spoods.gymapp` (registered via EAS credentials)
7. SKU: `rpe-v1` (any unique string)
8. Full Access (user access)
9. Note the generated Apple ID (this is the ascAppId for eas.json)

### Anti-Patterns to Avoid
- **Running EAS Build before App Store Connect listing exists:** The submit step will fail or require interactive prompts. Create the listing first, get the ascAppId, put it in eas.json.
- **Using external TestFlight testers for friend group:** External testers require Beta App Review (first build review). Internal testers get builds immediately with no review. Since the user has Apple Developer account access, add friends as App Store Connect users with "Customer Support" or "Marketing" role for internal testing access.
- **Hardcoding Supabase credentials in verification script:** The script should test behaviors interactively, not connect to Supabase programmatically. The user physically operates the app.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| iOS code signing | Manual cert management | EAS-managed credentials | Provisioning profiles and certs are complex; EAS handles it |
| Build pipeline | Local Xcode builds | EAS Build cloud | No Mac needed, reproducible builds |
| TestFlight upload | Manual Transporter app | EAS Submit / --auto-submit | One command instead of download-drag-upload |
| Version bumping | Manual version edits | `autoIncrement: true` in eas.json | Already configured, prevents version conflicts |

**Key insight:** The entire iOS distribution pipeline is handled by EAS CLI commands. The phase work is primarily configuration and documentation, not code.

## Common Pitfalls

### Pitfall 1: App Store Connect Listing Not Created Before Build
**What goes wrong:** `eas submit` fails because there is no app in App Store Connect matching the bundle ID
**Why it happens:** Developers assume EAS will create the listing automatically
**How to avoid:** Create the App Store Connect listing manually FIRST, then configure ascAppId in eas.json
**Warning signs:** Submit step prompts for app selection interactively instead of auto-matching

### Pitfall 2: Internal vs External TestFlight Testers Confusion
**What goes wrong:** Friends added as external testers triggers Beta App Review, delaying distribution by 24-48 hours
**Why it happens:** TestFlight has two tester categories with different requirements
**How to avoid:** Add friends as App Store Connect users (Admin/Developer/Marketing role) for INTERNAL testing. Internal testers get builds immediately with zero review.
**Warning signs:** Seeing "Waiting for Review" status on TestFlight build

### Pitfall 3: Missing ITSAppUsesNonExemptEncryption
**What goes wrong:** Every TestFlight user sees an export compliance prompt before they can install
**Why it happens:** Apple requires encryption declaration for all apps
**How to avoid:** Already handled -- app.json has `"ITSAppUsesNonExemptEncryption": false` in ios.infoPlist
**Warning signs:** TestFlight users report compliance questionnaire on first install

### Pitfall 4: expo-notifications Not in Plugins Array
**What goes wrong:** Push notifications may not work on physical device builds because native modules are not configured
**Why it happens:** expo-notifications works in Expo Go without explicit plugin config, but production builds need it
**How to avoid:** Add `"expo-notifications"` to the plugins array in app.json before the production build
**Warning signs:** Notifications silently fail on TestFlight build while working in Expo Go

### Pitfall 5: Supabase Environment Variables Not Available in Production Build
**What goes wrong:** App cannot connect to Supabase after installing from TestFlight
**Why it happens:** Environment variables from .env may not be embedded in the production build
**How to avoid:** Verify Supabase URL and anon key are either hardcoded in the client file or configured via EAS secrets / app.config.js
**Warning signs:** Network errors on first launch of TestFlight build

### Pitfall 6: App Name Mismatch
**What goes wrong:** App shows wrong name on device home screen
**Why it happens:** Different name sources (app.json name, App Store Connect name, bundle display name)
**How to avoid:** app.json already has `"name": "RPE"` -- just ensure App Store Connect listing also uses "RPE"
**Warning signs:** Home screen icon shows "Gym App" instead of "RPE"

## Code Examples

### eas.json with Submit Configuration
```json
{
  "cli": {
    "version": ">= 18.1.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "REPLACE_WITH_ACTUAL_ID"
      }
    }
  }
}
```
Source: https://docs.expo.dev/submit/ios/

### app.json Plugin Addition for Notifications
```json
{
  "plugins": [
    "expo-router",
    ["expo-splash-screen", { "..." : "..." }],
    "@react-native-community/datetimepicker",
    "expo-notifications"
  ]
}
```
Source: https://docs.expo.dev/versions/latest/sdk/notifications/

### Build and Submit Command
```bash
# Full pipeline: build iOS production + auto-submit to TestFlight
eas build --platform ios --profile production --auto-submit

# Check build status
eas build:list --platform ios --limit 5

# If auto-submit fails, manual submit of latest build
eas submit --platform ios --latest
```
Source: https://docs.expo.dev/build/automate-submissions/

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `expo build:ios` (classic) | `eas build` | 2022 | Classic builds deprecated, EAS is the only path |
| Manual Transporter upload | `eas submit` / `--auto-submit` | 2023 | One-command pipeline |
| Manual cert management | EAS-managed credentials | 2022 | No Keychain/Xcode needed |
| `npx testflight` (new) | Available since 2024 | 2024 | Simplest one-command build+submit, but less configurable |

## Recommendations for Claude's Discretion Items

### Minimum iOS Version
**Recommendation: iOS 16.0**
- Expo SDK 55 supports iOS 15.1+ as minimum deployment target
- iOS 16 is reasonable floor -- covers iPhone 8 and newer (2017+)
- No need to explicitly set this; Expo SDK 55 default of 15.1 is fine since the friend group likely has modern phones
- If desired, can set via expo-build-properties plugin, but unnecessary for a friend-group app
- **Confidence:** HIGH (verified via Expo SDK 55 changelog)

### App Store Connect Configuration
**Recommendation:** Keep minimal -- this is for TestFlight only, not App Store publication
- Category: Health & Fitness
- Age Rating: 4+ (no objectionable content)
- Screenshots: Not required for TestFlight internal testing
- Description: Brief one-liner sufficient ("Workout logging for friends")
- Privacy Policy URL: Not required for internal TestFlight (required for external/App Store)

### Interactive Script Implementation
**Recommendation: Node.js CLI using readline**
- User is on Windows -- Node.js is cross-platform, bash scripts may have issues
- Project already uses Node.js ecosystem
- Can output structured JSON results file for record-keeping
- Place in `scripts/verify-device.js`

### EAS Update OTA Smoke Test
**Recommendation: Skip for this phase**
- EAS Update (OTA) is valuable but adds complexity to verification
- TestFlight build is the distribution gate; OTA updates can be validated post-distribution
- Can be added as a Phase 10.1 item if desired

### EAS Build Environment Variables
**Recommendation: Verify Supabase credentials are embedded, not env-dependent**
- Check if `src/lib/supabase.ts` uses hardcoded values or process.env
- If process.env, configure EAS secrets: `eas secret:create --name SUPABASE_URL --value ...`
- For a friend-group app, hardcoded values in source are acceptable (no secrets concern for anon key)

## Open Questions

1. **App Store Connect Apple ID (ascAppId)**
   - What we know: Must be obtained by creating the listing manually in App Store Connect
   - What's unclear: User may need to do this themselves since it requires Apple Developer account login
   - Recommendation: Document the manual steps clearly, the user performs them and provides the ID

2. **TestFlight Internal Tester Roles**
   - What we know: Internal testers must be App Store Connect users (not just email invites)
   - What's unclear: Whether friends already have Apple Developer account roles or need to be added
   - Recommendation: Document how to add users to App Store Connect with appropriate roles, or use the simpler "Add Internal Testers" flow which allows adding by Apple ID email

3. **Supabase Credentials in Production Build**
   - What we know: Supabase client is in `src/lib/supabase.ts`
   - What's unclear: Whether URL/anon key are hardcoded or from env vars
   - Recommendation: Verify during implementation; if env-based, configure EAS secrets

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 55 |
| Config file | package.json (`"test": "jest --bail"`) |
| Quick run command | `npx jest --bail` |
| Full suite command | `npx jest` |

### Phase Requirements -> Test Map
This phase has no unassigned v1 requirements -- it is a distribution gate. Verification is physical-device manual testing, not automated tests.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIST-01 | App builds and installs via TestFlight | manual-only | N/A -- requires physical device + Apple account | N/A |
| DIST-02 | Alarm fires on physical iOS device | manual-only | N/A -- requires physical device observation | N/A |
| DIST-03 | Offline workout log + sync | manual-only | N/A -- requires airplane mode toggle on device | N/A |
| DIST-04 | RLS isolation with second account | manual-only | N/A -- requires two Supabase accounts on device | N/A |
| DIST-05 | Plan-history isolation | manual-only | N/A -- requires editing plan and checking old sessions | N/A |

**Justification for manual-only:** All verification criteria require physical device interaction (TestFlight install, airplane mode, alarm observation, multi-account login). These cannot be automated without Detox/Maestro (explicitly deferred). The interactive CLI script serves as the verification recording mechanism.

### Sampling Rate
- **Per task commit:** `npx jest --bail` (ensure no regressions from config changes)
- **Per wave merge:** `npx jest` (full suite)
- **Phase gate:** Interactive verification script produces all-pass results file

### Wave 0 Gaps
- [ ] `scripts/verify-device.js` -- interactive CLI verification script (core deliverable of this phase)
- [ ] `expo-notifications` plugin in app.json -- required for production build notification support

## Sources

### Primary (HIGH confidence)
- [Expo Submit iOS docs](https://docs.expo.dev/submit/ios/) - ascAppId configuration, submission process
- [Expo auto-submit docs](https://docs.expo.dev/build/automate-submissions/) - --auto-submit flag, eas.json config
- [npx testflight docs](https://docs.expo.dev/build-reference/npx-testflight/) - one-command build+submit workflow
- [Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55) - iOS 15.1 minimum, SDK details
- [Apple TestFlight docs](https://developer.apple.com/testflight/) - internal vs external testers, no review for internal

### Secondary (MEDIUM confidence)
- [Apple Add Internal Testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/) - role requirements for internal testing
- [EAS Build setup](https://docs.expo.dev/build/setup/) - credential management, first-time setup flow

### Tertiary (LOW confidence)
- None -- all findings verified against official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - EAS Build/Submit is the only official Expo distribution path, well-documented
- Architecture: HIGH - configuration-driven phase, patterns are straightforward
- Pitfalls: HIGH - common issues well-documented in Expo community and official docs
- Verification: MEDIUM - interactive script pattern is a recommendation, not a proven template

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable -- EAS tooling changes slowly)
