# Phase 13: Coaching Options - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

One user (coach) can create and manage workout plans for another user (trainee), receive push notifications when trainees complete workouts or hit PRs, get a weekly adherence summary, and update trainee plans with inline performance data. This is the app's first multi-user interaction feature.

</domain>

<decisions>
## Implementation Decisions

### Coach-trainee connection
- Invite code system: coach generates a short code, trainee enters it to connect
- Users can be both coach AND trainee simultaneously (e.g., coach Friend A while Friend B coaches you)
- No limit on number of trainees per coach (friend group, natural social limit)
- Either side can disconnect the relationship unilaterally

### Plan ownership & editing
- Coach-created plans are read-only for the trainee (coach has full edit control)
- Trainee keeps their own personal plans alongside coach-assigned plans (both coexist in Plans tab)
- Coach plans visually distinguished from personal plans in trainee's view
- Coach UI lives in the Plans tab with a toggle/section: "My Plans" vs "Trainees"
- Coach builds trainee plans using the same plan builder UI, targeting a different user
- Coach can see trainee's workout logs (sets/reps/weight) but NOT body metrics or photos

### Completion notifications
- Push notifications via Supabase Edge Function + Expo push service
- Notification triggers:
  - Workout completed: "Alex finished Push Day" (name + workout title, concise)
  - PR achieved: coach notified when trainee hits a personal record
  - Weekly adherence summary: sent Sunday evening before new training week
- Requires new infrastructure: Expo Push Token storage, Edge Function, DB triggers
- Trainee also gets push notification when coach updates their plan

### Weekly plan updates
- Coach edits trainee's plan directly in-place (no versioning/duplication)
- Inline performance view: each exercise shows what trainee actually lifted last week next to plan targets
- Coach can attach an optional text note when saving plan changes (e.g., "Great week, bumping your bench target")
- Note shows to trainee alongside the plan update notification

### Claude's Discretion
- Invite code format and expiry duration
- Push notification Edge Function architecture details
- DB trigger vs application-level notification dispatch
- Weekly summary format and content
- How coach-created plans interact with alarm scheduling (trainee sets own alarms, or coach sets them)
- RLS policy design for cross-user plan access

</decisions>

<specifics>
## Specific Ideas

- Coach view in Plans tab uses same plan builder UI but targeting a different user's data
- Inline performance when editing: show last week's actual sets/reps next to plan targets so coach can make informed adjustments
- Sunday evening weekly summary gives coach time to update plans before Monday training week starts
- Coach notes on plan updates add a lightweight communication channel without building a full messaging system

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `planStore` (Zustand + MMKV): Plan CRUD with `user_id` scoping — needs extension for coach-owned plans targeting other users
- `usePlans` hook: fetches/manages plans — will need coach-mode variant
- Plan builder UI (PlanCreateScreen, DaySlotEditor, ExercisePicker): reusable for coach flow with target user param
- `alarmStore` + alarm scheduler: local alarm infrastructure, trainee alarm scheduling for coach plans TBD
- Supabase Edge Function pattern: exists for account deletion — reusable for push notification dispatch
- `workoutStore` / `historyStore`: workout session data the coach needs read access to
- expo-notifications: already installed for alarms, can handle push notification receipt

### Established Patterns
- Zustand + MMKV persist for all stores
- Supabase RLS for per-user data isolation — needs new policies for coach read/write access
- Edge Functions with Deno.serve + CORS headers
- Plan/session separation (plan edits never corrupt session history)

### Integration Points
- Plans tab: needs toggle/section for "My Plans" vs "Trainees"
- Plan detail screen: needs inline performance overlay for coach view
- Workout finish flow: needs to trigger push notification to coach
- PR detection flow: needs to trigger push notification to coach
- New Supabase tables: coaching_relationships, push_tokens, notifications
- New Edge Functions: send-push-notification, weekly-summary (cron)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-coaching-options*
*Context gathered: 2026-03-12*
