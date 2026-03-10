---
phase: 8
slug: alarms-accountability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + jest-expo 55 |
| **Config file** | jest.config.js |
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
| 08-01-01 | 01 | 1 | ALRM-01 | unit | `npx jest tests/alarms/notificationIds.test.ts -x` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | ALRM-01 | unit | `npx jest tests/alarms/weekdayConversion.test.ts -x` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | ALRM-01 | unit | `npx jest tests/alarms/alarmScheduler.test.ts -x` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | ALRM-02 | unit | `npx jest tests/alarms/notificationSetup.test.ts -x` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | ALRM-02 | unit | `npx jest tests/alarms/snoozeHandler.test.ts -x` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 2 | ALRM-03 | unit | `npx jest tests/alarms/nudgeMessages.test.ts -x` | ❌ W0 | ⬜ pending |
| 08-03-02 | 03 | 2 | ALRM-03 | unit | `npx jest tests/alarms/nudgeCancel.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/alarms/notificationIds.test.ts` — stubs for ALRM-01 deterministic ID generation
- [ ] `tests/alarms/weekdayConversion.test.ts` — stubs for ALRM-01 weekday mapping
- [ ] `tests/alarms/alarmScheduler.test.ts` — stubs for ALRM-01 schedule/cancel logic
- [ ] `tests/alarms/notificationSetup.test.ts` — stubs for ALRM-02 notification category registration
- [ ] `tests/alarms/snoozeHandler.test.ts` — stubs for ALRM-02 snooze rescheduling
- [ ] `tests/alarms/nudgeMessages.test.ts` — stubs for ALRM-03 message pool selection
- [ ] `tests/alarms/nudgeCancel.test.ts` — stubs for ALRM-03 nudge cancellation flow
- [ ] `tests/__mocks__/expo-notifications.ts` — mock for expo-notifications module
- [ ] `tests/__mocks__/expo-device.ts` — mock for expo-device module
- [ ] Jest config update: add `expo-notifications` and `expo-device` to moduleNameMapper

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DaySlotEditor shows alarm row when weekday is mapped | ALRM-01 | UI rendering with native DateTimePicker | 1. Open plan builder 2. Add a day with weekday mapped 3. Verify alarm time picker row appears |
| Alarm fires on device with sound/vibration | ALRM-02 | Requires physical device | 1. Set alarm for 1 min from now 2. Lock device 3. Verify alarm notification arrives with sound |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
