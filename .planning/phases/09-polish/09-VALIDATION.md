---
phase: 9
slug: polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo 55 |
| **Config file** | package.json (scripts.test) |
| **Quick run command** | `npx jest --bail` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail`
- **After every plan wave:** Run `npx jest` + visual audit
- **Before `/gsd:verify-work`:** Full suite must be green + manual screen walkthrough + OTA test delivery
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | Quality gate | grep | `grep -rn "#fff\|#ffffff\|#3b82f6\|#60a5fa" src/ app/ --include="*.tsx" --include="*.ts"` | N/A | ⬜ pending |
| 09-01-02 | 01 | 1 | Quality gate | unit | `npx jest --bail` | ✅ | ⬜ pending |
| 09-02-01 | 02 | 2 | Quality gate | manual | N/A | N/A | ⬜ pending |
| 09-02-02 | 02 | 2 | Quality gate | manual | `eas update --channel production --message "test" --environment production` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase's success criteria are primarily visual and behavioral (manual verification).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Accent color is magenta across all screens | Quality gate SC1 | Visual consistency check | Navigate every screen, confirm magenta accent (#ec4899) |
| App name displays as "RPE" | Quality gate SC2 | Device-level check | Verify app.json name, check home screen on device |
| App icon renders correctly | Quality gate SC2 | Platform-specific visual | Check iOS and Android builds for correct icon display |
| Splash screen on dark background | Quality gate SC2 | Requires build | Launch preview/release build, verify splash |
| EAS Update delivers OTA | Quality gate SC3 | Requires physical device | Push update, verify device receives without store submission |
| Navigation transitions consistent | Quality gate SC1 | Visual/interaction check | Navigate between all screens, verify smooth transitions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
