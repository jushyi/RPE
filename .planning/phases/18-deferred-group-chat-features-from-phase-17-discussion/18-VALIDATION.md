---
phase: 18
slug: deferred-group-chat-features-from-phase-17-discussion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo 55 |
| **Config file** | jest.config.js (project root) |
| **Quick run command** | `npx jest --bail --testPathPattern=chat` |
| **Full suite command** | `npx jest --bail` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail --testPathPattern=chat`
- **After every plan wave:** Run `npx jest --bail`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 0 | Wave 0 test stubs | unit | `npx jest tests/chat/editWindow.test.ts -x` | ❌ W0 | ⬜ pending |
| 18-01-02 | 01 | 0 | Wave 0 test stubs | unit | `npx jest tests/chat/readReceipts.test.ts -x` | ❌ W0 | ⬜ pending |
| 18-01-03 | 01 | 0 | Wave 0 test stubs | unit | `npx jest tests/chat/shareContentSelection.test.ts -x` | ❌ W0 | ⬜ pending |
| 18-01-04 | 01 | 0 | Wave 0 test stubs | unit | `npx jest tests/chat/retroactiveShare.test.ts -x` | ❌ W0 | ⬜ pending |
| 18-01-05 | 04 | 3 | Typing indicator debounce | unit | `npx jest tests/chat/typingDebounce.test.ts -x` | ❌ created in Plan 04 Task 1 | ⬜ pending |
| 18-01-06 | 01 | 0 | Wave 0 test stubs | unit | `npx jest tests/chat/chatMediaUpload.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/chat/editWindow.test.ts` — 15-minute edit window logic tests
- [ ] `tests/chat/readReceipts.test.ts` — read status computation from last_read_message_id
- [ ] `tests/chat/shareContentSelection.test.ts` — content type checkbox selection logic
- [ ] `tests/chat/retroactiveShare.test.ts` — retroactive share payload with both dates
- [ ] `tests/chat/chatMediaUpload.test.ts` — chat media upload path construction

> Note: `tests/chat/typingDebounce.test.ts` is created in Plan 04 Task 1 (Wave 3), not Wave 0.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time message delivery | Chat messages appear instantly | Requires two connected clients | Open group chat on two devices, send message from one, verify instant appearance on other |
| Typing indicators | "[Name] is typing..." shows | Requires real Supabase Presence | Open chat on two devices, type in one, verify indicator on other |
| Push notifications for chat | Notification received for new message | Requires physical device + push | Send message to group, verify push on muted=false member's device |
| Chat media upload/display | Images and videos display in chat | Visual verification needed | Send image and video in chat, verify they render correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
