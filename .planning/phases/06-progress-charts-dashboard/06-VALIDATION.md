---
phase: 6
slug: progress-charts-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo 55 |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npx jest --bail --testPathPattern=tests/(progress\|dashboard)` |
| **Full suite command** | `npx jest --bail` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail --testPathPattern=tests/(progress|dashboard)`
- **After every plan wave:** Run `npx jest --bail`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | HIST-02 | unit | `npx jest tests/progress/chart-data.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | HIST-02 | unit | `npx jest tests/progress/chart-data.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | HIST-03 | unit | `npx jest tests/progress/bodyweight.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | DASH-01 | unit | `npx jest tests/dashboard/progress-summary.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-03-02 | 03 | 2 | DASH-02 | unit | `npx jest tests/dashboard/todays-workout.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/progress/chart-data.test.ts` — stubs for HIST-02 (chart data transformation, 1RM calculation, time range filtering)
- [ ] `tests/progress/bodyweight.test.ts` — stubs for HIST-03 (bodyweight store CRUD, unit conversion)
- [ ] `tests/dashboard/progress-summary.test.ts` — stubs for DASH-01 (streak calculation, PR aggregation, weekly stats)
- [ ] `tests/dashboard/todays-workout.test.ts` — stubs for DASH-02 (weekday matching, rest day detection, no-plan state)
- [ ] `tests/__mocks__/@shopify/react-native-skia.ts` — mock for Skia (needed for any component importing victory-native)
- [ ] `tests/__mocks__/victory-native.ts` — mock for chart components (not testable in JSDOM)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chart renders correctly with real data | HIST-02 | Visual rendering verification, Skia GPU rendering not testable in JSDOM | Open exercise detail, verify line chart renders with correct axes and data points |
| Sparkline renders in dashboard cards | DASH-01 | Visual rendering verification | Open dashboard, verify sparkline trends appear in progress summary card |
| Bodyweight card shows mini chart | HIST-03 | Visual rendering verification | Log bodyweight entries, verify sparkline updates in bodyweight card |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
