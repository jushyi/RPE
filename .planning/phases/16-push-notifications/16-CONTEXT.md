# Phase 16: Push Notifications - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

In-app notification inbox showing notification history with deep linking from notification taps to relevant screens, and end-to-end testing of all existing notification types (alarms, nudges, coaching push, weekly summary). Push infrastructure already exists from Phase 8 (local alarms/nudges) and Phase 13 (push via Expo Push API + Edge Functions) — this phase adds the inbox UI, deep link routing, notification persistence, and a developer test screen.

</domain>

<decisions>
## Implementation Decisions

### Inbox location & layout
- Bell icon in Dashboard header-right with numeric unread badge count ("9+" for 10+)
- Tapping bell opens a full-screen notification list (stack route, not a tab)
- Flat reverse-chronological list — no grouping by type or day
- Each notification item shows: type-specific icon, title, body text, relative timestamp ("2h ago")
- Unread items indicated by accent-colored dot on left + bold title text; read items are dimmer

### Inbox interaction
- Tapping an inbox item deep links to the same destination as tapping the push notification
- Items without a meaningful destination (e.g., weekly summary) just mark as read on tap
- "Mark all read" button in inbox header — clears all unread indicators and resets badge count

### Deep link destinations
- Workout complete notification → session detail screen (that specific workout)
- PR achieved notification → exercise progress chart (that exercise)
- Plan update notification → plan detail screen (the updated plan)
- Weekly summary → notification inbox (no deeper target)
- Alarm notification → start today's planned workout (active workout screen)
- Missed workout nudge → start today's planned workout (active workout screen)
- Cold start from notification: app opens directly to target screen, back button returns to dashboard (no full stack restoration)
- Inbox item taps use the same deep link destinations as push notification taps

### Notification persistence
- Supabase `notifications` table with user_id, type, title, body, data (JSON), read (boolean), created_at
- RLS: users can only read/update their own notifications
- Edge Functions write notification records when dispatching push
- Local alarm/nudge notifications also write to the table for inbox consistency
- 30-day retention — older notifications auto-pruned (Supabase cron or on-fetch cleanup)

### Testing
- Interactive dev test screen hidden behind long-press on app version string in Settings
- Available in all builds (production included) — useful for friend-group debugging
- Trigger buttons for all 6 notification types: alarm, nudge, workout complete, PR, plan update, weekly summary
- Each button sends a real notification that can be tapped to verify deep link navigation
- Bottom section shows recent notification debug log (last 10 received) with type, timestamp, and payload

### Claude's Discretion
- Notification type icon choices (Ionicons or similar)
- Badge count polling/subscription strategy (real-time vs on-app-focus)
- Deep link URL/route format
- Notification table cleanup implementation (cron function vs client-side prune)
- How local notifications (alarms/nudges) write to Supabase notifications table
- Debug log storage mechanism (in-memory vs MMKV)
- Empty inbox state design

</decisions>

<specifics>
## Specific Ideas

- Bell icon approach mirrors standard mobile patterns — keeps dashboard clean while providing clear notification access
- Dev test screen inspired by Phase 10's interactive device verification script — practical for the friend group to self-debug
- Debug log in test screen eliminates need to check Supabase dashboard or system notification tray during testing

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/notifications/utils/pushTokenRegistration.ts`: Push token registration already handles permissions, token fetch, and Supabase upsert
- `supabase/functions/send-push/index.ts`: Generic push dispatch Edge Function — accepts recipient_ids, title, body, data payload
- `src/features/alarms/utils/notificationSetup.ts`: Permission request, Android channel setup, alarm category registration
- `supabase/functions/weekly-summary/index.ts`: Weekly summary Edge Function already sends push to coaches
- `src/features/notifications/hooks/usePushToken.ts`: Hook for push token registration on app launch

### Established Patterns
- Zustand + MMKV for local state with Supabase sync
- Supabase RLS for per-user data isolation
- Edge Functions with Deno.serve + CORS headers
- Stack routes for detail screens (push onto navigation stack, back returns to tab)
- Ionicons for all tab and header icons
- StyleSheet.create for all styling

### Integration Points
- Dashboard header: add bell icon with badge count (header-right, alongside existing elements)
- `send-push` Edge Function: extend to also write to notifications table when dispatching
- `weekly-summary` Edge Function: extend to write notification record
- Alarm scheduler: extend to write local alarm/nudge events to notifications table
- Expo Router: notification tap handler to parse data payload and navigate to correct route
- `app/_layout.tsx`: notification response listener for deep link routing on tap
- Settings screen: long-press handler on version text to open dev tools

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-push-notifications*
*Context gathered: 2026-03-12*
