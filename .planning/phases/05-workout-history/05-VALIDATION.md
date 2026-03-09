---
phase: 5
slug: workout-history
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest v29 + jest-expo v55 |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npx jest tests/history/ --bail` |
| **Full suite command** | `npx jest --bail` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest tests/history/ --bail`
- **After every plan wave:** Run `npx jest --bail`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | HIST-01 | unit | `npx jest tests/history/history-store.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | HIST-01 | unit | `npx jest tests/history/history-list.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | HIST-06 | unit | `npx jest tests/history/epley.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | HIST-06 | unit | `npx jest tests/history/epley.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/history/epley.test.ts` — stubs for HIST-06 (Epley formula: normal case, 1 rep, 0 reps, 0 weight, high reps, rounding)
- [ ] `tests/history/history-list.test.ts` — stubs for HIST-01 (volume calculation, exercise name truncation, duration calculation, PR count)
- [ ] `tests/history/history-store.test.ts` — stubs for HIST-01 (store CRUD: setSessions, removeSession, setLoading)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swipeable PagerView sub-tabs | HIST-01 | Gesture interaction requires device | Swipe between Plans and History tabs, verify smooth animation |
| Session detail scroll | HIST-01 | Visual layout verification | Tap a session, verify all sets display correctly with scrolling |
| 1RM display in session detail | HIST-06 | Visual rendering | Verify 1RM badge appears next to each set in detail view |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
