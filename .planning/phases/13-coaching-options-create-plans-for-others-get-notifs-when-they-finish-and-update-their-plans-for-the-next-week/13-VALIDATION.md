---
phase: 13
slug: coaching-options
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 13-01-01 | 01 | 1 | COACH-01 | unit | `npx jest tests/inviteCode.test.ts -x` | No - W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | COACH-02 | unit | `npx jest tests/coaching.test.ts -x` | No - W0 | ⬜ pending |
| 13-01-03 | 01 | 1 | COACH-03 | unit | `npx jest tests/coachPlans.test.ts -x` | No - W0 | ⬜ pending |
| 13-01-04 | 01 | 1 | COACH-04 | unit | `npx jest tests/coachRLS.test.ts -x` | No - W0 | ⬜ pending |
| 13-01-05 | 01 | 1 | COACH-05 | unit | `npx jest tests/pushToken.test.ts -x` | No - W0 | ⬜ pending |
| 13-01-06 | 01 | 1 | COACH-06 | manual-only | Manual: deploy + test with curl | N/A | ⬜ pending |
| 13-01-07 | 01 | 1 | COACH-07 | manual-only | Manual: verify cron job in Supabase dashboard | N/A | ⬜ pending |
| 13-01-08 | 01 | 1 | COACH-08 | unit | `npx jest tests/traineePerformance.test.ts -x` | No - W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/coaching/__tests__/inviteCode.test.ts` — stubs for COACH-01
- [ ] `src/features/coaching/__tests__/useCoaching.test.ts` — stubs for COACH-02
- [ ] `src/features/coaching/__tests__/coachPlans.test.ts` — stubs for COACH-03
- [ ] `src/features/notifications/__tests__/pushToken.test.ts` — stubs for COACH-05

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Push notification dispatch via Edge Function | COACH-06 | Requires deployed Supabase Edge Function + Expo Push Service | Deploy send-push function, curl with test token, verify device receipt |
| Weekly summary cron execution | COACH-07 | Requires pg_cron + pg_net in Supabase environment | Create cron job in dashboard, verify Edge Function invocation in logs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
