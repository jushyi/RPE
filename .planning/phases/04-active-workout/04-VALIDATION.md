---
phase: 4
slug: active-workout
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest v29 + jest-expo v55 |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npx jest tests/workout/ --bail` |
| **Full suite command** | `npx jest --bail` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest tests/workout/ --bail`
- **After every plan wave:** Run `npx jest --bail`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | WORK-01 | unit | `npx jest tests/workout/workout-store.test.ts -x` | No - W0 | pending |
| 04-01-02 | 01 | 1 | WORK-02 | unit | `npx jest tests/workout/workout-store.test.ts -x` | No - W0 | pending |
| 04-02-01 | 02 | 2 | WORK-02 | unit | `npx jest tests/workout/workout-store.test.ts -x` | No - W0 | pending |
| 04-03-01 | 03 | 2 | WORK-04 | unit | `npx jest tests/workout/previous-performance.test.ts -x` | No - W0 | pending |
| 04-03-02 | 03 | 2 | WORK-05 | unit | `npx jest tests/workout/pr-detection.test.ts -x` | No - W0 | pending |
| 04-04-01 | 04 | 1 | WORK-03 | unit | `npx jest tests/workout/set-logging.test.ts -x` | No - W0 | pending |
| 04-04-02 | 04 | 1 | WORK-01 | unit | `npx jest tests/workout/sync-queue.test.ts -x` | No - W0 | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [ ] `tests/workout/workout-store.test.ts` — stubs for WORK-01, WORK-02 (session start, exercise index, finish, crash recovery state)
- [ ] `tests/workout/set-logging.test.ts` — stubs for WORK-03 (logSet action, validation, set numbering)
- [ ] `tests/workout/previous-performance.test.ts` — stubs for WORK-04 (previous performance lookup, caching)
- [ ] `tests/workout/pr-detection.test.ts` — stubs for WORK-05 (PR comparison, baseline updates, first-time baseline)
- [ ] `tests/workout/sync-queue.test.ts` — stubs for offline sync (enqueue, flush, retry on failure)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Focus mode UI renders one exercise full-screen with oversized tap targets | WORK-02 | Visual layout verification | Start workout, verify exercise fills screen, weight/reps inputs are large |
| Gesture navigation between exercises | WORK-02 | Touch interaction | Swipe left/right between exercises, verify smooth transitions |
| PR flag visual indicator appears immediately | WORK-05 | Visual + timing | Log a set exceeding stored PR, verify instant flag display |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
