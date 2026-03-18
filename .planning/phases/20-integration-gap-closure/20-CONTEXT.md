# Phase 20: Integration Gap Closure - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Close 5 cross-phase integration gaps identified by the v1.0 milestone audit, plus generate 2 missing VERIFICATION.md files. All gaps are partial-satisfaction bugs in existing requirements — no new features.

Gaps: AUTH-03, ALRM-02, VID-03, NOTIF-02, NOTIF-04, plus missing verifications for Phases 05 and 10.

</domain>

<decisions>
## Implementation Decisions

### 1. Sign-out data isolation (AUTH-03)
- Add 4 missing MMKV store IDs to `clearAllUserData()`: `social-store`, `chat-store`, `friendship-store`, `notification-storage`
- These are the exact IDs used by `socialStore.ts`, `chatStore.ts`, `friendshipStore.ts`, `notificationStore.ts`
- Straightforward array addition — no behavioral changes needed

### 2. Alarm notification deep link (ALRM-02)
- Alarm and nudge notification taps navigate to **plan day detail screen** with a Start Workout button
- Requires adding `plan_day_id` to the alarm/nudge notification payload when scheduling
- Deep link route: `/(app)/plans/{plan_id}/day/{plan_day_id}` (or equivalent existing route)
- **Fallback:** If plan_day_id cannot be resolved (plan deleted, etc.), fall back to dashboard `/(app)`
- **Nudge notifications** (ALRM-03) get the same plan_day_id deep link behavior as alarms

### 3. Video upload queue retry (VID-03)
- Auto-flush pending videos **on app foreground** when connectivity is available
- Matches the pattern used by `useSyncQueue` for workout data sync
- **Retry limit:** 3 attempts per video item. After 3 failures, stop retrying that item and surface a persistent error (visible in settings/video management)
- Add a `retryCount` field to `VideoUploadItem` type to track attempts
- No periodic timer needed — foreground trigger is sufficient

### 4. Deep link router for social/chat types (NOTIF-02, NOTIF-04)
- Add `group_share` and `chat_message` cases to `getDeepLinkRoute()` in `deepLinkRouter.ts`
- `group_share` routes to the group screen (requires `group_id` in notification data)
- `chat_message` routes to the group chat screen (requires `group_id` in notification data)
- Covers both inbox tap (NOTIF-02) and push notification tap (NOTIF-04)

### 5. Body-metrics unit defaults
- Replace hardcoded `'in'` and `'lbs'` defaults in `body-metrics.tsx` with values from `authStore` preferences (`preferredUnit`, `preferredMeasurementUnit`)
- Fallback to `'lbs'`/`'in'` only if store has no preference set

### 6. Missing verification reports (Phases 05, 10)
- Generate VERIFICATION.md from **automated code analysis** — read phase PLANs, grep for implementation evidence, check test coverage
- No interactive re-verification needed — these phases are stable and shipped
- Output: `05-VERIFICATION.md` and `10-VERIFICATION.md` in their respective phase directories

### Claude's Discretion
- Exact route path format for plan day detail (use whatever route structure already exists)
- AppState listener implementation for foreground detection
- How to surface the "3 retries exceeded" error in the video management UI
- Verification report format and evidence depth

</decisions>

<specifics>
## Specific Ideas

No specific requirements — these are bug fixes with clear targets from the milestone audit. Follow existing patterns in the codebase.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/clearUserData.ts`: Central MMKV wipe function — just needs 4 more store IDs added to the array
- `src/features/notifications/utils/deepLinkRouter.ts`: Switch-case router — add 2 new cases
- `src/features/videos/utils/videoUploadQueue.ts`: Complete queue with `flushVideoQueue()` — needs foreground trigger and retry counter
- `src/features/workout/hooks/useSyncQueue.ts`: Reference pattern for connectivity-based auto-flush

### Established Patterns
- MMKV store IDs follow `kebab-case` naming: `social-store`, `chat-store`, etc.
- Deep link routes use Expo Router path format: `/(app)/section/id`
- Notification payloads carry typed `data` with `type` discriminator field
- Zustand + MMKV persist pattern used across all stores

### Integration Points
- `clearAllUserData()` called from `useAuth.ts` sign-out flow
- `getDeepLinkRoute()` called from notification inbox tap handler AND push notification response handler
- `flushVideoQueue()` currently called only from `finishWorkout()` in workout session hook
- `body-metrics.tsx` needs to import from `authStore` (already available as `useAuthStore`)
- Alarm scheduling in `useAlarmScheduler.ts` needs to include `plan_day_id` in notification content data

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 20-integration-gap-closure*
*Context gathered: 2026-03-16*
