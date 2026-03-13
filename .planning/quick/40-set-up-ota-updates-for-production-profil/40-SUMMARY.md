---
phase: quick-40
plan: 40
subsystem: infrastructure
tags: [ota, eas-update, npm-scripts, production]
dependency_graph:
  requires: [expo-updates, eas.json production channel]
  provides: [update:production npm script, update:preview npm script]
  affects: [package.json]
tech_stack:
  added: []
  patterns: [eas update --channel for OTA publishing]
key_files:
  created: []
  modified:
    - path: package.json
      change: Added update:production and update:preview npm scripts
decisions:
  - "--message flag left at end so caller appends message string as arg (npm run update:production \"Fix bug\")"
  - "eas.json production build profile channel:production already matches OTA target — no changes needed there"
metrics:
  duration: 5min
  completed: 2026-03-13
---

# Phase quick-40: Set Up OTA Updates for Production Profile Summary

**One-liner:** Added `update:production` and `update:preview` npm scripts wrapping `eas update --channel` for convenient OTA publishing to TestFlight users.

## Tasks Completed

| # | Name | Status | Commit |
|---|------|--------|--------|
| 1 | Add OTA update npm scripts to package.json | Complete | dbf1cc4 |
| 2 | Publish initial OTA bundle to production channel | Awaiting human action | — |

## What Was Built

### Task 1: OTA npm scripts

Added two convenience scripts to `package.json`:

```json
"update:production": "eas update --channel production --message",
"update:preview": "eas update --channel preview --message"
```

Usage:
- `npm run update:production "Fix chat bug"` — publishes JS bundle to production channel (TestFlight users)
- `npm run update:preview "Test new feature"` — publishes to preview channel

The `eas.json` production build profile already has `"channel": "production"` matching the OTA target. The `app.json` already has `runtimeVersion: { policy: "appVersion" }` and the EAS updates URL configured. No changes were needed to either file.

### Task 2: First OTA bundle publish (awaiting human action)

The EAS CLI requires interactive authentication for the `eas update` command. This step requires running the command in a terminal.

## Verification

- [x] package.json has `update:production` and `update:preview` scripts with correct channel flags
- [x] `eas.json` production build profile channel is "production" (confirmed, no change needed)
- [x] `app.json` runtimeVersion policy is "appVersion" (confirmed, no change needed)
- [ ] EAS update published to production channel (awaiting human confirmation)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- package.json scripts verified: `eas update --channel production --message` and `eas update --channel preview --message`
- Commit dbf1cc4 exists and staged correct file
