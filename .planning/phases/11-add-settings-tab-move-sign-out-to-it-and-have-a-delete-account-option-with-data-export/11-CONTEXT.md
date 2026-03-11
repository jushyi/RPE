# Phase 11: Settings Tab, Sign Out, Delete Account with Data Export - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a Settings tab to the bottom navigation bar (4th tab), consolidating account management and user preferences. Move sign out from its former dashboard location into Settings. Add data export (CSV via share sheet) and delete account with password re-entry, 7-day grace period, and Supabase Edge Function for server-side deletion. Remove the gear icon from the dashboard header.

</domain>

<decisions>
## Implementation Decisions

### Settings placement
- Settings becomes the 4th tab in the bottom navigation bar (alongside Home, Exercises, Plans)
- Remove the gear icon from the dashboard header — Settings tab replaces it, no duplicate entry points
- Tab icon: Ionicons (Claude picks appropriate icon, e.g., settings-outline or person-outline)

### Settings screen layout
- Single scrollable screen with grouped card sections (same card pattern as existing settings screen)
- User profile header at the top: avatar, display name, email
- Section order: Preferences > Notifications > Account

### Preferences section
- Default weight unit toggle (lbs / kg) — reads/writes existing preferredUnit from auth store
- Default measurement unit toggle (in / cm) — sets default for body measurements

### Notifications section
- Existing "Pause all alarms" toggle (carried over from Phase 8 settings.tsx)

### Account section
- Export Data row — standalone action, always available (also offered during delete flow)
- Sign Out row — shows confirmation alert before signing out
- Delete Account row — red/destructive text color, same card as other account actions (no separate danger zone card)

### Data export
- Format: CSV with multiple sheets per data type (one file per category)
- Categories included: workout sessions + sets, plans, body metrics + bodyweight, PR baselines + records
- Delivery: OS share sheet (expo-sharing) — user can save to Files, AirDrop, email, etc.
- Export available as standalone action AND offered again during delete account flow as final chance

### Sign out flow
- Confirmation alert before signing out ("Are you sure?" with Cancel/Sign Out buttons)
- Uses existing `useAuth().signOut()` hook

### Delete account flow
- Password re-entry required before deletion proceeds
- 7-day grace period — account marked for deletion but data preserved
- Server-side: Supabase Edge Function handles marking, scheduling cleanup after 7 days
- During grace period: if user signs back in, show a dismissible warning banner at top of dashboard with cancel button ("Your account is scheduled for deletion on [date]. Tap to cancel.")
- Delete confirmation dialog offers "Export first" option before proceeding

### Claude's Discretion
- Settings tab icon choice (settings-outline vs person-outline vs other Ionicon)
- CSV generation library/approach
- Edge Function implementation details (cron cleanup, soft-delete column, etc.)
- Profile header styling and avatar display
- Password re-entry UI (inline in alert vs separate screen)
- Grace period banner styling and positioning
- How deletion cancellation is persisted (profile column, separate table, etc.)

</decisions>

<specifics>
## Specific Ideas

- User wants CSV specifically with multiple sheets per data type — not JSON
- Share sheet is the preferred delivery mechanism (standard mobile UX)
- Password re-entry for delete adds security without being overly complex
- 7-day grace period with banner + cancel button gives a safety net for the friend group
- Export Data as standalone means users can back up data anytime, not just when deleting

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/(app)/settings.tsx`: Existing settings screen with alarm pause toggle — will be expanded/refactored into a tab
- `src/features/auth/hooks/useAuth.ts`: `signOut()` already implemented, `user` object available with email
- `src/stores/authStore.ts`: Auth store with `preferredUnit`, `setAuthenticated`, `clearAuth`
- `src/stores/alarmStore.ts`: `isPaused` / `setPaused` for alarm toggle
- `app/(app)/(tabs)/_layout.tsx`: Tab layout where 4th tab will be added
- Card/row styling pattern from existing `settings.tsx` (card, row, rowIcon, rowLabel, rowHint styles)

### Established Patterns
- StyleSheet.create for all styling (no NativeWind)
- Zustand + MMKV for local state with Supabase sync
- Ionicons for all tab and UI icons
- Feature-based directory structure: `src/features/{feature}/`
- Supabase Edge Functions for server-side operations
- `supabase` client from `@/lib/supabase/client`

### Integration Points
- Tab bar layout (`app/(app)/(tabs)/_layout.tsx`): Add 4th Settings tab, remove dashboard headerRight gear icon
- Settings route: Move from `app/(app)/settings.tsx` (stack) to `app/(app)/(tabs)/settings.tsx` (tab)
- Dashboard: Add deletion grace period warning banner component
- Auth flow: Password re-entry uses `supabase.auth.signInWithPassword` to verify
- Supabase Edge Function: New function for account deletion scheduling and cleanup
- Profile data: `supabase.auth.getUser()` for avatar, display name, email display

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-add-settings-tab-move-sign-out-to-it-and-have-a-delete-account-option-with-data-export*
*Context gathered: 2026-03-11*
