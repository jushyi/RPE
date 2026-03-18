---
phase: 20
slug: integration-gap-closure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7 + jest-expo 55.0.9 |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npx jest --bail --testPathPattern=<file>` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail --testPathPattern=<relevant-test-file>`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | AUTH-03 | unit | `npx jest tests/auth/clearUserData.test.ts -x` | ❌ W0 | ⬜ pending |
| 20-01-02 | 01 | 1 | NOTIF-02, NOTIF-04 | unit | `npx jest tests/notifications/deepLinkRouter.test.ts -x` | ✅ (extend) | ⬜ pending |
| 20-01-03 | 01 | 1 | ALRM-02 | unit | `npx jest tests/alarms/alarmScheduler.test.ts -x` | ✅ (extend) | ⬜ pending |
| 20-01-04 | 01 | 1 | VID-03 | unit | `npx jest tests/videos/videoUploadQueue.test.ts -x` | ✅ (extend) | ⬜ pending |
| 20-01-05 | 01 | 1 | — | unit | `npx jest tests/auth/clearUserData.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/auth/clearUserData.test.ts` — stubs for AUTH-03 (verify all 18 store IDs are cleared)
- [ ] Extend `tests/notifications/deepLinkRouter.test.ts` — add group_share and chat_message cases, update alarm/nudge cases for plan_id routing
- [ ] Extend `tests/videos/videoUploadQueue.test.ts` — add retryCount tests
- [ ] Extend `tests/alarms/alarmScheduler.test.ts` — verify data payload in scheduled notifications

*Existing infrastructure covers framework needs. Only test file stubs/extensions required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Alarm tap navigates to plan detail | ALRM-02 | E2E notification tap requires device | Schedule alarm, let it fire, tap notification, verify plan screen opens |
| Video retry on foreground | VID-03 | AppState lifecycle requires device | Upload video offline, restore connectivity, foreground app, verify upload resumes |
| Body metrics defaults from preferences | — | UI rendering verification | Set metric preferences, navigate to body metrics, verify correct unit shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
