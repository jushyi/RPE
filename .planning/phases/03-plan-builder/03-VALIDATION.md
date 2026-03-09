---
phase: 3
slug: plan-builder
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest v29 + jest-expo v55 |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npx jest tests/plans/ --bail` |
| **Full suite command** | `npx jest --bail` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest tests/plans/ --bail`
- **After every plan wave:** Run `npx jest --bail`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | PLAN-01 | unit | `npx jest tests/plans/plan-store.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | PLAN-02 | unit | `npx jest tests/plans/plan-days.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | PLAN-03 | unit | `npx jest tests/plans/plan-exercises.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | PLAN-04 | unit | `npx jest tests/plans/plan-exercises.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | PLAN-05 | unit | `npx jest tests/plans/plan-crud.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/plans/plan-store.test.ts` — stubs for PLAN-01, PLAN-05 (store CRUD operations)
- [ ] `tests/plans/plan-days.test.ts` — stubs for PLAN-02 (day slot management, weekday mapping)
- [ ] `tests/plans/plan-exercises.test.ts` — stubs for PLAN-03, PLAN-04 (exercise assignment, target sets)
- [ ] `tests/plans/plan-crud.test.ts` — stubs for PLAN-05 (edit/delete with active plan enforcement)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-to-reorder exercises within day | PLAN-03 | Gesture interaction | Open plan editor, long-press exercise row, drag to new position, verify order persists |
| Bottom sheet exercise picker | PLAN-03 | Visual interaction | Tap "Add Exercise", verify bottom sheet opens with library, search/filter, select exercise |
| Active plan badge display | PLAN-01 | Visual UI | Create two plans, set one active, verify badge shows on correct card |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
