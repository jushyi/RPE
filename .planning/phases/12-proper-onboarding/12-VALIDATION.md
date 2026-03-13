---
phase: 12
slug: proper-onboarding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo 55 |
| **Config file** | package.json (jest config section) |
| **Quick run command** | `npx jest --bail --testPathPattern onboarding` |
| **Full suite command** | `npx jest --bail` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail --testPathPattern onboarding`
- **After every plan wave:** Run `npx jest --bail`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | OB-01 | unit | `npx jest --bail --testPathPattern onboarding` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | OB-02 | unit | `npx jest --bail --testPathPattern onboarding` | ❌ W0 | ⬜ pending |
| 12-01-03 | 01 | 1 | OB-03 | unit | `npx jest --bail --testPathPattern onboarding` | ❌ W0 | ⬜ pending |
| 12-01-04 | 01 | 1 | OB-04 | unit | `npx jest --bail --testPathPattern onboarding` | ❌ W0 | ⬜ pending |
| 12-01-05 | 01 | 1 | OB-05 | manual-only | N/A | N/A | ⬜ pending |
| 12-01-06 | 01 | 1 | OB-06 | manual-only | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for onboarding flow — unit preference saving, PR baseline saving, body stats saving, onboarding completion routing
- [ ] No new framework install needed — Jest + testing-library already configured

*Note: Project has zero existing test files. Wave 0 testing may need to establish baseline test patterns.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Existing users bypass new onboarding | OB-05 | Route guard logic in root layout — integration test | Sign in with existing user, verify no onboarding shown |
| PR edit mode from dashboard still works | OB-06 | Navigation flow requires device/emulator | Navigate to PR edit from dashboard, verify form loads and saves |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
