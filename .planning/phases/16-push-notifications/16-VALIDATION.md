---
phase: 16
slug: push-notifications
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest v29 + jest-expo v55 |
| **Config file** | package.json (jest section) |
| **Quick run command** | `npx jest --bail` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | N/A-01 | unit | `npx jest tests/notifications/deepLinkRouter.test.ts -x` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | N/A-02 | unit | `npx jest tests/notifications/relativeTime.test.ts -x` | ❌ W0 | ⬜ pending |
| 16-01-03 | 01 | 1 | N/A-03 | unit | `npx jest tests/notifications/notificationStore.test.ts -x` | ❌ W0 | ⬜ pending |
| 16-01-04 | 01 | 1 | N/A-04 | unit | `npx jest tests/notifications/notificationTypes.test.ts -x` | ❌ W0 | ⬜ pending |
| 16-01-05 | 01 | 1 | N/A-05 | unit | `npx jest tests/notifications/bellBadge.test.ts -x` | ❌ W0 | ⬜ pending |
| 16-02-01 | 02 | 2 | N/A-06 | manual | N/A — requires device | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/notifications/deepLinkRouter.test.ts` — stubs for deep link route mapping
- [ ] `tests/notifications/relativeTime.test.ts` — stubs for relative timestamp formatting
- [ ] `tests/notifications/notificationStore.test.ts` — stubs for store mark-read logic
- [ ] `tests/notifications/notificationTypes.test.ts` — stubs for notification icon mapping
- [ ] `tests/notifications/bellBadge.test.ts` — stubs for badge count formatting

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dev test screen trigger sends real notification | N/A-06 | Requires physical device with push permissions | Long-press version in Settings, tap each trigger button, verify notification appears and deep link works |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
