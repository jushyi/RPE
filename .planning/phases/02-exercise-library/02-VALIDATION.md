---
phase: 2
slug: exercise-library
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo 55 + @testing-library/react-native 13 |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npx jest --bail` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | EXER-01 | unit | `npx jest tests/exercises/exercise-library.test.ts --bail` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | EXER-01 | manual | Run `supabase db reset` and verify via Supabase Studio | N/A | ⬜ pending |
| 02-02-01 | 02 | 1 | EXER-02 | unit | `npx jest tests/exercises/exercise-crud.test.ts --bail` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | EXER-02 | unit | `npx jest tests/exercises/exercise-store.test.ts --bail` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/exercises/exercise-library.test.ts` — stubs for EXER-01 (fetch, filter, search)
- [ ] `tests/exercises/exercise-crud.test.ts` — stubs for EXER-02 (create, update, delete)
- [ ] `tests/exercises/exercise-store.test.ts` — covers store state management
- [ ] `tests/__mocks__/supabase.ts` — mock Supabase client for exercise queries

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Seed exercises present after migration | EXER-01 | Requires running Supabase migration | Run `supabase db reset`, open Supabase Studio, verify exercises table has ~30-40 rows |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
