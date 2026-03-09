---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (Expo default) + React Native Testing Library |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx jest --testPathPattern=test_name --bail` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=<relevant_test> --bail`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | AUTH-01 | integration | `npx jest tests/auth/signup.test.ts --bail` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | AUTH-02 | unit | `npx jest tests/auth/session-persistence.test.ts --bail` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 1 | AUTH-03 | unit | `npx jest tests/auth/signout.test.ts --bail` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 1 | AUTH-04 | integration | `npx jest tests/sync/auto-sync.test.ts --bail` | ❌ W0 | ⬜ pending |
| 1-05-01 | 05 | 1 | AUTH-05 | manual | Manual: airplane mode + open app | N/A | ⬜ pending |
| 1-06-01 | 06 | 1 | AUTH-06 | integration | `npx jest tests/auth/pr-baseline.test.ts --bail` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jest.config.js` — Jest configuration for Expo + TypeScript
- [ ] `tests/setup.ts` — Test setup file (mock MMKV, mock Supabase, mock NetInfo)
- [ ] `tests/auth/signup.test.ts` — AUTH-01 coverage
- [ ] `tests/auth/session-persistence.test.ts` — AUTH-02 coverage
- [ ] `tests/auth/signout.test.ts` — AUTH-03 coverage
- [ ] `tests/sync/auto-sync.test.ts` — AUTH-04 coverage
- [ ] `tests/auth/pr-baseline.test.ts` — AUTH-06 coverage
- [ ] Framework install: `npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo`

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App usable offline (no crash, no forced logout) | AUTH-05 | Requires physical device airplane mode toggle and app restart | 1. Sign in on device 2. Enable airplane mode 3. Force-close app 4. Reopen app 5. Verify no crash, no forced logout, screens load |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
