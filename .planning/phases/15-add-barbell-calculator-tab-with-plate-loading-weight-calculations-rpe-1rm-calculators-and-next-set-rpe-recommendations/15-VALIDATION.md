---
phase: 15
slug: add-barbell-calculator-tab-with-plate-loading-weight-calculations-rpe-1rm-calculators-and-next-set-rpe-recommendations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo 55 |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npx jest tests/calculator/ --bail` |
| **Full suite command** | `npx jest --bail` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest tests/calculator/ --bail`
- **After every plan wave:** Run `npx jest --bail`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-00-01 | 00 | 0 | CALC-01 | unit | `npx jest tests/calculator/plateCalculator.test.ts -x` | ❌ W0 | ⬜ pending |
| 15-00-02 | 00 | 0 | CALC-02 | unit | `npx jest tests/calculator/plateCalculator.test.ts -x` | ❌ W0 | ⬜ pending |
| 15-00-03 | 00 | 0 | CALC-03 | unit | `npx jest tests/calculator/rpeTable.test.ts -x` | ❌ W0 | ⬜ pending |
| 15-00-04 | 00 | 0 | CALC-04 | unit | `npx jest tests/calculator/rpeCalculator.test.ts -x` | ❌ W0 | ⬜ pending |
| 15-00-05 | 00 | 0 | CALC-05 | unit | `npx jest tests/calculator/nextSet.test.ts -x` | ❌ W0 | ⬜ pending |
| 15-00-06 | 00 | 0 | CALC-06 | unit | `npx jest tests/calculator/nextSet.test.ts -x` | ❌ W0 | ⬜ pending |
| 15-00-07 | 00 | 0 | CALC-07 | unit | `npx jest tests/calculator/plateCalculator.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/calculator/plateCalculator.test.ts` — stubs for CALC-01, CALC-02, CALC-07
- [ ] `tests/calculator/rpeTable.test.ts` — stubs for CALC-03
- [ ] `tests/calculator/rpeCalculator.test.ts` — stubs for CALC-04
- [ ] `tests/calculator/nextSet.test.ts` — stubs for CALC-05, CALC-06

*Existing jest infrastructure covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual barbell diagram renders correctly | CALC-VISUAL | Visual layout requires human inspection | Open Calc tab, enter 225lb, verify colored plates displayed proportionally |
| PagerView swipe between sub-tools | CALC-NAV | Gesture interaction | Swipe left/right on calculator tab, verify smooth transitions |
| Segmented control tap + indicator animation | CALC-NAV | Animation quality | Tap each segment, verify animated indicator moves |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
