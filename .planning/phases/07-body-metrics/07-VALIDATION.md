---
phase: 7
slug: body-metrics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo 55 |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npx jest --bail --testPathPattern=tests/body-metrics` |
| **Full suite command** | `npx jest --bail` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail --testPathPattern=tests/body-metrics`
- **After every plan wave:** Run `npx jest --bail`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | HIST-04 | unit | `npx jest tests/body-metrics/measurement-store.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | HIST-04 | unit | `npx jest tests/body-metrics/unit-conversion.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | HIST-04 | unit | `npx jest tests/body-metrics/chart-data.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | HIST-04 | unit | `npx jest tests/body-metrics/form-validation.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/body-metrics/measurement-store.test.ts` — stubs for HIST-04 (store CRUD)
- [ ] `tests/body-metrics/unit-conversion.test.ts` — stubs for HIST-04 (in/cm conversion)
- [ ] `tests/body-metrics/chart-data.test.ts` — stubs for HIST-04 (chart data transformation)
- [ ] `tests/body-metrics/form-validation.test.ts` — stubs for HIST-04 (at least one measurement validation)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard card renders correctly with merged bodyweight + measurements | HIST-04 | Visual layout verification | Open dashboard, verify combined Body card shows latest values and sparkline |
| Chart renders with 2+ data points, shows empty state with < 2 | HIST-04 | Visual chart rendering | Log 1 measurement, verify empty state message. Log 2nd, verify chart appears |
| Edit/delete flow with haptic feedback and confirmation dialog | HIST-04 | Haptic + native dialog | Open history, long-press/tap delete on entry, verify Alert dialog appears, confirm delete |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
