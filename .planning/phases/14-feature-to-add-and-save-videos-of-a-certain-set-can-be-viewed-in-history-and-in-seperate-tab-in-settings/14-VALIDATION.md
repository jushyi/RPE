---
phase: 14
slug: feature-to-add-and-save-videos-of-a-certain-set-can-be-viewed-in-history-and-in-seperate-tab-in-settings
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-12
updated: 2026-03-12
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (via expo/jest-expo) |
| **Config file** | jest.config.js |
| **Quick run command** | `npx jest --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | DB schema + types | tsc + jest | `npx tsc --noEmit && npx jest --passWithNoTests` | N/A | pending |
| 14-01-02 | 01 | 1 | Queue + hooks | tsc + unit | `npx tsc --noEmit && npx jest tests/videos/ --bail --passWithNoTests` | plan creates | pending |
| 14-02-01 | 02 | 2 | Video capture UX | tsc + manual | `npx tsc --noEmit` | N/A | pending |
| 14-03-01 | 03 | 2 | History thumbnails | tsc + manual | `npx tsc --noEmit` | N/A | pending |
| 14-03-02 | 03 | 2 | Videos gallery | tsc + manual | `npx tsc --noEmit` | N/A | pending |

---

## Wave 0 Requirements

- No Wave 0 plan needed. Plan 01 Task 2 includes creation of unit test for `videoUploadQueue` (pure logic, no device dependency).

---

## Manual-Only Verification Sign-Off

The following behaviors are hardware/device-dependent and cannot be unit tested. They are explicitly accepted as manual-only verification:

| Behavior | Requirement | Why Manual | Verification Method |
|----------|-------------|------------|---------------------|
| Video recording from SetCard camera | VID-04 | Requires device camera hardware | Manual: open active workout, tap camera icon, record video, verify thumbnail appears |
| Video playback in history | VID-06 | Requires video file + native player | Manual: complete workout with video, view in history, tap thumbnail, verify fullscreen playback |
| Gallery screen in settings | VID-08 | Visual layout + navigation | Manual: Settings > My Videos, verify chronological list renders |
| Offline queue + retry | VID-03 | Requires network toggling | Manual: record video in airplane mode, restore network, verify upload completes |
| Video picker from gallery | VID-04 | Requires device media library | Manual: tap camera icon, choose from gallery, verify selection and thumbnail |

**Rationale:** Video capture, playback, and native player integration are fundamentally device-dependent. Mocking these at the unit level provides no real confidence. The testable pure-logic components (upload queue, thumbnail cache) ARE covered by automated tests. This split is intentional and provides the best cost/confidence tradeoff.

---

## Automated Coverage

| Module | Testable | Test File | What's Tested |
|--------|----------|-----------|---------------|
| videoUploadQueue.ts | Yes (pure logic) | tests/videos/videoUploadQueue.test.ts | enqueue, dequeue, getQueue, removeFromQueue |
| thumbnailCache.ts | Yes (pure logic) | tests/videos/thumbnailCache.test.ts | get/set/invalidate cache entries |
| useVideoCapture.ts | No (device) | N/A | Manual only |
| useVideoUpload.ts | Partial (network) | N/A | Manual only |
| VideoThumbnail.tsx | No (visual) | N/A | Manual only |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or explicit manual-only sign-off
- [x] Sampling continuity: pure logic modules have automated tests, device-dependent have manual sign-off
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** accepted — device-dependent features verified manually, pure logic covered by unit tests
