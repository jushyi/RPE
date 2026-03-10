# Phase 8: Alarms + Accountability - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Plan-day-tied alarms that wake users up for training days, with real alarm delivery (sound + vibration + must-dismiss), and missed workout nudge notifications when a planned day passes without a logged session. Alarm setup is integrated into the plan builder — not a separate settings screen. Only the active plan's alarms are live.

</domain>

<decisions>
## Implementation Decisions

### Alarm setup UX
- Inline in plan builder: when a day slot has a weekday mapped, a "Wake-up alarm" time picker row appears in the day slot editor
- No alarm option shown for days without a weekday mapped (no weekday = no recurring schedule = no alarm)
- First day starts with blank time; subsequent days default to whatever the user set for the previous day
- Per-day toggle switch next to the time picker to enable/disable alarm without clearing the saved time
- Label: "Wake-up alarm" — framing is "get ready for the gym" not "be at the gym"

### Alarm delivery
- iOS-first development — standard high-priority notifications (no Critical Alerts for v1)
- System default alarm sound (no custom audio assets)
- Snooze + dismiss buttons on the notification
- Notification message: "Time to get ready — [Day Name] workout"
- Android full-screen intent deferred — will be addressed when Android development begins

### Missed workout nudge
- Fires 4 hours after the alarm time (alarm at 6 AM = nudge at 10 AM)
- Playfully guilt-trippy tone ("Skipping leg day?" style messages — fun for the friend group)
- Auto-cancels if the user logs a workout for that day before the nudge fires
- Nudge only fires for the active plan's scheduled days

### Alarm management
- Alarms managed exclusively inside plan detail (no separate alarm screen or dashboard summary)
- Only the active plan's alarms are live — switching active plan cancels old alarms and activates new plan's alarms
- Deleting a plan silently cancels all its alarms (no extra warning)
- Global "pause all alarms" toggle in the settings tab (Phase 11 expands settings, but Phase 8 adds this toggle)

### Claude's Discretion
- Snooze duration (5-10 min range)
- Specific playful nudge message variations
- Notification channel configuration details
- How alarm state persists across device reboots
- Time picker component choice and styling
- How nudge auto-cancel is implemented (cancel scheduled notification on workout log, or background check)

</decisions>

<specifics>
## Specific Ideas

- "Wake-up alarm" framing — the alarm is for when the user wants to start getting ready, not the gym session time itself
- Playfully guilt-trippy nudge messages for the friend group context ("Skipping leg day?", "Your gym buddy is waiting...")
- Remember-last-time pattern for alarm time entry reduces friction when setting up multiple days

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/plans/components/DaySlotEditor.tsx`: Day slot editor where alarm time picker will be added — has `DaySlot` interface with `weekday: number | null`
- `src/stores/planStore.ts`: Zustand store for plans — alarm scheduling hooks into plan save/update/delete
- `src/features/plans/constants.ts`: WEEKDAY_LABELS for mapping weekday numbers to display names
- Supabase migration pattern: `supabase/migrations/` for adding alarm_time and alarm_enabled columns to plan_days

### Established Patterns
- StyleSheet.create for all styling (no NativeWind)
- Zustand + MMKV for local state with Supabase sync
- Feature-based directory structure: `src/features/alarms/` for alarm hooks, components, types
- Bottom sheet modal pattern from Phase 2/3 (if needed for time picker)
- Expo Router file-based routing for settings screen

### Integration Points
- `plan_days` table: add `alarm_time TEXT` and `alarm_enabled BOOLEAN DEFAULT false` columns
- Plan save/update flow: trigger alarm schedule/cancel based on alarm_time + alarm_enabled + weekday
- Plan delete flow: cancel all alarms for deleted plan
- Active plan switch: cancel old plan alarms, schedule new plan alarms
- Workout completion (workoutStore): cancel pending nudge notification for that day
- Settings tab (Phase 11 prep): add global alarm pause toggle

</code_context>

<deferred>
## Deferred Ideas

- Critical Alerts on iOS (bypass DND/silent mode) — requires Apple entitlement approval, revisit if users report missing alarms
- Android full-screen intent alarm takeover — address when Android development begins
- Alarm summary/overview screen — could be added to settings in Phase 11 if users want it

</deferred>

---

*Phase: 08-alarms-accountability*
*Context gathered: 2026-03-10*
