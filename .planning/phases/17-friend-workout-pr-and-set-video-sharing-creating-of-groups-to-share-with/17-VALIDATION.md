---
phase: 17
slug: friend-workout-pr-and-set-video-sharing-creating-of-groups-to-share-with
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo 55 |
| **Config file** | jest.config.js (project root) |
| **Quick run command** | `npx jest --bail --testPathPattern=social` |
| **Full suite command** | `npx jest --bail` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail --testPathPattern=social`
- **After every plan wave:** Run `npx jest --bail`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | Handle validation | unit | `npx jest tests/social/handleValidation.test.ts -x` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | Friend invite codes | unit | `npx jest tests/social/friendInviteCode.test.ts -x` | ❌ W0 | ⬜ pending |
| 17-01-03 | 01 | 1 | Friendship ordering | unit | `npx jest tests/social/friendship.test.ts -x` | ❌ W0 | ⬜ pending |
| 17-02-01 | 02 | 2 | Share payload | unit | `npx jest tests/social/sharePayload.test.ts -x` | ❌ W0 | ⬜ pending |
| 17-02-02 | 02 | 2 | Reaction icons | unit | `npx jest tests/social/reactions.test.ts -x` | ❌ W0 | ⬜ pending |
| 17-02-03 | 02 | 2 | Feed pagination | unit | `npx jest tests/social/feedPagination.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/social/handleValidation.test.ts` — handle format validation stubs
- [ ] `tests/social/friendInviteCode.test.ts` — code generation stubs (reuse coaching test pattern)
- [ ] `tests/social/friendship.test.ts` — canonical ordering helper stubs
- [ ] `tests/social/sharePayload.test.ts` — payload construction for each content type
- [ ] `tests/social/reactions.test.ts` — reaction icon mapping, toggle logic stubs
- [ ] `tests/social/feedPagination.test.ts` — cursor-based pagination logic stubs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Share prompt appears after workout | Post-workout share flow | Requires full workout session UI flow | Complete a workout, verify share prompt appears on summary screen |
| Push notifications delivered to group | Group share notifications | Requires device + Supabase Edge Function | Share to group, verify other member receives push |
| Video inline playback in feed | Video card tap-to-play | Requires video player + real video | Share a set video, verify thumbnail + playback in group feed |
| Handle search returns results | Friend discovery | Requires Supabase RPC function | Search for existing user handle, verify result appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
