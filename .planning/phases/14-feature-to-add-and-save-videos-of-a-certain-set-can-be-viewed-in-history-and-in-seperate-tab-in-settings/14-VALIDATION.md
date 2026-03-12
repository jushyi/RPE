---
phase: 14
slug: feature-to-add-and-save-videos-of-a-certain-set-can-be-viewed-in-history-and-in-seperate-tab-in-settings
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
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
| 14-01-01 | 01 | 1 | DB schema | migration | `npx jest --passWithNoTests` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | Video capture | manual | N/A (device-only) | N/A | ⬜ pending |
| 14-03-01 | 03 | 2 | History thumbnails | manual | N/A (visual) | N/A | ⬜ pending |
| 14-04-01 | 04 | 2 | Videos gallery | manual | N/A (visual) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements.
- Video capture, playback, and upload are device-dependent and primarily verified via manual testing.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Video recording from SetCard | Video capture | Requires device camera | Open active workout, tap camera icon on set, record video, verify upload |
| Video playback in history | History thumbnails | Requires video file + native player | Complete workout with video, view in history, tap thumbnail |
| Gallery screen in settings | Videos gallery | Visual + navigation | Navigate Settings > My Videos, verify chronological list |
| Offline queue + retry | Upload reliability | Requires network toggling | Record video in airplane mode, restore network, verify upload completes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
