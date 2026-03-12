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
| **Quick run command** | `npx jest --testPathPattern=calculator --bail` |
| **Full suite command** | `npx jest --bail` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=calculator --bail`
- **After every plan wave:** Run `npx jest --bail`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 0 | CALC-01 | unit | `npx jest tests/calculator/plateCalculator.test.ts -x` | No - W0 | pending |
| 15-01-02 | 01 | 0 | CALC-02 | unit | `npx jest tests/calculator/plateCalculator.test.ts -x` | No - W0 | pending |
| 15-01-03 | 01 | 0 | CALC-03 | unit | `npx jest tests/calculator/rpeTable.test.ts -x` | No - W0 | pending |
| 15-01-04 | 01 | 0 | CALC-04 | unit | `npx jest tests/calculator/nextSetCalc.test.ts -x` | No - W0 | pending |
| 15-01-05 | 01 | 0 | CALC-05 | unit | `npx jest tests/calculator/nextSetCalc.test.ts -x` | No - W0 | pending |
| 15-01-06 | 01 | 0 | CALC-06 | unit | `npx jest tests/calculator/plateCalculator.test.ts -x` | No - W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/calculator/plateCalculator.test.ts` — stubs for CALC-01, CALC-02, CALC-06
- [ ] `tests/calculator/rpeTable.test.ts` — stubs for CALC-03
- [ ] `tests/calculator/nextSetCalc.test.ts` — stubs for CALC-04, CALC-05

*Existing infrastructure covers framework setup (jest-expo already configured).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Barbell SVG diagram renders correctly | CALC-VIS | SVG rendering is visual | Open Plates tab, enter 225 lb, verify proportional plate display |
| Tab appears between Plans and Settings | CALC-NAV | Tab bar order is layout | Open app, verify Calc tab position |
| PagerView swipe between sub-tools | CALC-NAV | Gesture interaction | Swipe left/right between Plates, RPE/1RM, Next Set |
| Keyboard dismiss on background tap | CALC-UX | Native keyboard behavior | Tap outside input field, verify keyboard dismisses |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
