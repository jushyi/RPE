---
phase: 19
slug: github-actions-ci-cd-pipline-builds-triggers-on-new-tags-ota-update-action-as-well-to-production-branch
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.7.0 + jest-expo 55.0.9 |
| **Config file** | package.json (`"test": "jest --bail"`) |
| **Quick run command** | `npm test -- --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | N/A-1 | manual-only | Push v* tag, verify GH Actions run | N/A | pending |
| 19-01-02 | 01 | 1 | N/A-2 | manual-only | Push ota/* tag, verify GH Actions run | N/A | pending |
| 19-01-03 | 01 | 1 | N/A-3 | manual-only | Open PR, verify checks appear | N/A | pending |
| 19-01-04 | 01 | 1 | N/A-4 | manual-only | After build, check Releases page | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Add `"typecheck": "tsc --noEmit"` to package.json scripts
- [ ] Verify `tsc --noEmit` passes in clean checkout (expo-env.d.ts concern)
- [ ] Ensure `.github/workflows/` directory is created

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| build-ios.yml triggers on v* tags | N/A-1 | Requires actual GitHub Actions runner and EAS account | Push v* tag, verify workflow runs in GitHub Actions tab |
| ota-update.yml triggers on ota/* tags | N/A-2 | Requires actual GitHub Actions runner and EAS account | Push ota/* tag, verify workflow runs and EAS update appears |
| ci-checks.yml runs on PRs | N/A-3 | Requires actual PR event | Open test PR, verify checks appear |
| GitHub Release created on v* build | N/A-4 | Requires successful EAS build + GH permissions | After build completes, check repository Releases page |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
