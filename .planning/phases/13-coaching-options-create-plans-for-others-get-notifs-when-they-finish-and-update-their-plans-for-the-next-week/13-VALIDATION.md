---
phase: 13
slug: coaching-options
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-12
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + @testing-library/react-native 13 |
| **Config file** | jest.config.js (exists) |
| **Quick run command** | `npx jest --bail --testPathPattern coaching` |
| **Full suite command** | `npx jest --bail` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail --testPathPattern coaching`
- **After every plan wave:** Run `npx jest --bail`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-00-01 | 00 | 0 | COACH-01,02,03,05 | stub creation | `npx jest --testPathPattern coaching --passWithNoTests` | Created by W0 | pending |
| 13-01-01 | 01 | 1 | COACH-01 | unit | `npx jest tests/coaching/inviteCode.test.ts -x` | Created by W0 | pending |
| 13-01-02 | 01 | 1 | COACH-02 | unit | `npx jest tests/coaching/useCoaching.test.ts -x` | Created by W0 | pending |
| 13-03-01 | 03 | 2 | COACH-06 | unit | `npx jest tests/coaching/useCoaching.test.ts -x` | Created by W0 | pending |
| 13-04-01 | 04 | 3 | COACH-09 | unit | `npx jest tests/coaching/coachPlans.test.ts -x` | Created by W0 | pending |
| 13-01-05 | 01 | 1 | COACH-05 | unit | `npx jest tests/notifications/pushToken.test.ts -x` | Created by W0 | pending |
| 13-02-01 | 02 | 1 | COACH-05 | manual-only | Manual: deploy + test with curl | N/A | pending |
| 13-05-02 | 05 | 4 | COACH-16 | manual-only | Manual: verify cron job in Supabase dashboard | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `tests/coaching/inviteCode.test.ts` — stubs for COACH-01 (created in Plan 00)
- [x] `tests/coaching/useCoaching.test.ts` — stubs for COACH-02 (created in Plan 00)
- [x] `tests/coaching/coachPlans.test.ts` — stubs for COACH-03 (created in Plan 00)
- [x] `tests/notifications/pushToken.test.ts` — stubs for COACH-05 (created in Plan 00)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Push notification dispatch via Edge Function | COACH-06 | Requires deployed Supabase Edge Function + Expo Push Service | Deploy send-push function, curl with test token, verify device receipt |
| Weekly summary cron execution | COACH-07 | Requires pg_cron + pg_net in Supabase environment | Create cron job in dashboard, verify Edge Function invocation in logs |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
