---
phase: 11
slug: add-settings-tab-move-sign-out-to-it-and-have-a-delete-account-option-with-data-export
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npm test -- --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | SETT-01 | manual-only | Manual: visual verification | N/A | ⬜ pending |
| 11-01-02 | 01 | 1 | SETT-07 | unit | `npm test -- tests/settings/preferences.test.ts --bail` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | SETT-02 | unit | `npm test -- tests/settings/csvExport.test.ts --bail` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 1 | SETT-04 | manual-only | Manual: tap Sign Out, verify alert | N/A | ⬜ pending |
| 11-03-01 | 03 | 2 | SETT-03 | unit | `npm test -- tests/settings/deleteAccount.test.ts --bail` | ❌ W0 | ⬜ pending |
| 11-03-02 | 03 | 2 | SETT-05 | unit | `npm test -- tests/settings/deleteAccount.test.ts --bail` | ❌ W0 | ⬜ pending |
| 11-03-03 | 03 | 2 | SETT-06 | unit | `npm test -- tests/settings/deletionBanner.test.ts --bail` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/settings/csvExport.test.ts` — stubs for CSV generation logic (pure function tests)
- [ ] `tests/settings/deleteAccount.test.ts` — stubs for password verification and Edge Function invocation mocking
- [ ] `tests/settings/deletionBanner.test.ts` — stubs for banner show/hide logic
- [ ] `tests/settings/preferences.test.ts` — stubs for unit toggle store integration
- [ ] `tests/__mocks__/expo-file-system.ts` — mock for expo-file-system
- [ ] `tests/__mocks__/expo-sharing.ts` — mock for expo-sharing

*Existing jest + jest-expo infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Settings tab appears as 4th tab | SETT-01 | Visual/navigation verification | Open app, verify 4th tab shows Settings icon, tap to navigate |
| Sign out confirmation alert | SETT-04 | Native Alert interaction | Tap Sign Out row, verify alert with Cancel/Sign Out buttons |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
