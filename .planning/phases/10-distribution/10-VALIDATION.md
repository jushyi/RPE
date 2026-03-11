---
phase: 10
slug: distribution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo 55 |
| **Config file** | package.json (`"test": "jest --bail"`) |
| **Quick run command** | `npx jest --bail` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green + interactive verification script all-pass
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | DIST-01 | config | `npx jest --bail` | N/A | ⬜ pending |
| 10-01-02 | 01 | 1 | DIST-01 | manual-only | N/A -- TestFlight install | N/A | ⬜ pending |
| 10-02-01 | 02 | 2 | DIST-02 | manual-only | N/A -- physical device alarm | N/A | ⬜ pending |
| 10-02-02 | 02 | 2 | DIST-03 | manual-only | N/A -- airplane mode test | N/A | ⬜ pending |
| 10-02-03 | 02 | 2 | DIST-04 | manual-only | N/A -- multi-account RLS | N/A | ⬜ pending |
| 10-02-04 | 02 | 2 | DIST-05 | manual-only | N/A -- plan-history check | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/verify-device.js` — interactive CLI verification script (core deliverable)
- [ ] Verify `expo-notifications` plugin in app.json — required for production notification support

*Existing test infrastructure (Jest + jest-expo) covers regression checking. No new test framework needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App installs via TestFlight | DIST-01 | Requires Apple account, physical device, TestFlight app | Build via EAS, upload, install from TestFlight app |
| Alarm fires on iOS device | DIST-02 | Requires physical device observation of sound + vibration | Set alarm, wait for trigger, confirm dismissal required |
| Offline workout log + sync | DIST-03 | Requires airplane mode toggle on physical device | Enable airplane mode, log session, reconnect, check history |
| RLS cross-user isolation | DIST-04 | Requires two Supabase accounts on device | Log in as user A, create data, log in as user B, verify no access |
| Plan-history isolation | DIST-05 | Requires editing plan and checking old sessions | Log session, edit plan, verify old session unchanged |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
