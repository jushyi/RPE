# Phase 17: Friend Workout, PR and Set Video Sharing - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can connect as friends (invite codes or username/handle search), create groups of friends, and share workout summaries, PR achievements, and set videos to those groups. Each group has a card-based timeline feed. Emoji reactions on shared items. Group chat/messaging is deferred to a future phase.

</domain>

<decisions>
## Implementation Decisions

### Friend connections
- Two connection methods: invite codes (reuse Phase 13 pattern) AND username/handle search
- Mutual friendships: friend request must be accepted by both parties
- Friendships are separate from coaching relationships (independent connection types)
- New `handle` field on user profiles: unique, searchable username
- Handle setup in Settings profile section AND added to onboarding flow
- Either side can unfriend unilaterally

### Groups & sharing scope
- Anyone can create a group and manage its membership (add/remove friends)
- All sharing goes through groups only (no direct friend-to-friend shares)
- To share with one person, create a 2-person group
- Group has a shared feed: all members see each other's shared content
- User picks which group(s) to share to each time (per-share targeting)

### Share content & feed
- Three shareable content types: workout summaries, PR achievements, set videos
- Share prompt appears after finishing a workout (on completion screen)
- User picks content to share (summary, PRs from session, videos) and target group(s)
- Card-based reverse-chronological timeline feed per group
- Workout cards show summary only: exercise names, total sets, total volume, duration
- Tap card to see full breakdown (navigates to detail)
- PR cards show exercise name and new PR weight/reps
- Video cards show inline thumbnail with tap-to-play

### Emoji reactions
- Group members can add emoji reactions to shared items (fire, muscle, clap, etc.)
- Lightweight social interaction without full comments
- Reaction counts visible on each card

### Notifications & privacy
- Push notification for every share to group members (uses existing Phase 13 push infra)
- Per-group mute toggle to silence notifications from a specific group
- Users can leave any group at any time
- Body metrics are NEVER shared (consistent with Phase 13 coaching privacy boundary)
- Shared content only visible to group members

### Claude's Discretion
- Invite code format for friend requests (can differ from coaching codes)
- Friend request UI/UX flow details
- Handle validation rules (length, characters, uniqueness check)
- Group feed pagination/loading strategy
- Emoji reaction set and UI implementation
- Share prompt UI layout on workout completion screen
- Database schema for friendships, groups, group_members, shared_items, reactions tables
- RLS policies for group-scoped data access
- How shared videos reference existing Supabase Storage URLs (no re-upload)

</decisions>

<specifics>
## Specific Ideas

- Groups function like WhatsApp groups but for workout shares — each group has its own feed where everyone sees each other's content
- The share flow is a one-tap experience after workout completion: pick content + pick group(s)
- Emoji reactions add social interaction without the complexity of a full messaging system
- Handle/username system enables remote friend discovery beyond in-person invite codes

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `coaching/hooks/useCoaching.ts`: Invite code generation and redemption pattern — reusable for friend invite codes
- `coaching/types.ts`: `CoachingRelationship`, `InviteCode` types — friendship types follow same shape
- `notifications/utils/pushTokenRegistration.ts`: Push token registration already runs on every authenticated launch
- `supabase/functions/send-push/index.ts`: Edge Function for push delivery — reusable for share notifications
- `videos/types.ts`: `VideoGalleryItem` type — shared videos reference same data
- `ProfilePhotoPicker` + avatar upload pattern: Profile infrastructure for handle/avatar display in feeds
- `historyStore` / `workoutStore`: Workout session data that gets shared as summaries

### Established Patterns
- Zustand + MMKV persist for all stores — new friendship/group stores follow same pattern
- Supabase RLS for per-user data isolation — needs new policies for group-scoped access
- `as-any` pattern for Supabase `.from()` calls on tables not in generated types
- Edge Functions with Deno.serve + CORS headers
- Ionicons for all UI icons
- Card-based UI patterns throughout the app (workout cards, PR cards, body cards)

### Integration Points
- New tab or screen for Friends/Groups (tab bar or accessible from Settings/Dashboard)
- Workout finish flow: add share prompt after session save
- PR detection flow: include PRs in shareable content
- Video attachment: reference existing `video_url` from `set_logs` when sharing
- Onboarding flow: add handle selection step
- Settings profile section: add handle edit
- New Supabase tables: friendships, friend_requests, groups, group_members, shared_items, reactions
- New Edge Function or extension of send-push for group share notifications

</code_context>

<deferred>
## Deferred Ideas

- Group chat/messaging — future phase (real-time messaging, message history, delivery/read receipts)
- Granular per-group content controls (share workouts but not PRs to specific groups)
- Sharing from history retroactively (currently only prompt after workout completion)

</deferred>

---

*Phase: 17-friend-workout-pr-and-set-video-sharing-creating-of-groups-to-share-with*
*Context gathered: 2026-03-12*
