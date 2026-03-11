---
phase: 11-add-settings-tab-move-sign-out-to-it-and-have-a-delete-account-option-with-data-export
plan: 03
subsystem: account
tags: [supabase-edge-functions, account-deletion, grace-period, deno, password-verification]

requires:
  - phase: 11-01
    provides: Settings tab screen with AccountSection component
  - phase: 11-02
    provides: CSV data export hook and utilities
provides:
  - Delete account Edge Function (schedule/cancel/execute)
  - useDeleteAccount hook with password verification
  - DeletionBanner dashboard component with grace period cancel
  - Fully wired Settings screen (export + delete flows)
  - Database migration for deletion_scheduled_at tracking
affects: []

tech-stack:
  added: [supabase-edge-functions]
  patterns: [edge-function-with-cors, password-re-authentication, grace-period-deletion]

key-files:
  created:
    - supabase/migrations/20260316000000_add_deletion_columns.sql
    - supabase/functions/delete-account/index.ts
    - src/features/settings/hooks/useDeleteAccount.ts
    - src/features/settings/components/DeletionBanner.tsx
  modified:
    - src/stores/authStore.ts
    - src/features/settings/components/AccountSection.tsx
    - app/(app)/(tabs)/settings.tsx
    - app/(app)/(tabs)/dashboard.tsx

key-decisions:
  - "Edge Function uses Deno.serve pattern with CORS headers for all responses"
  - "Password re-entry uses Alert.prompt on iOS and custom modal on Android"
  - "User is signed out after scheduling deletion (must sign back in to cancel)"
  - "DeletionBanner syncs deletion status from profiles table on mount"

patterns-established:
  - "Edge Function pattern: CORS headers, auth header verification, service_role for admin ops"
  - "Platform-specific password input: Alert.prompt (iOS) vs Modal with TextInput (Android)"

requirements-completed: [SETT-03, SETT-05, SETT-06]

duration: 4min
completed: 2026-03-11
---

# Phase 11 Plan 03: Delete Account Flow Summary

**Delete account with password re-entry, 7-day grace period via Supabase Edge Function, dashboard deletion banner with cancel, and fully wired Settings screen**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T14:28:05Z
- **Completed:** 2026-03-11T14:32:01Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Supabase migration adds deletion_scheduled_at column with cleanup function and pg_cron comment
- Edge Function handles schedule (7-day grace), cancel, and execute actions with CORS and auth
- useDeleteAccount hook verifies password, calls Edge Function, syncs deletion state, signs out on schedule
- DeletionBanner shows grace period warning on dashboard with formatted date and tap-to-cancel
- Settings screen fully wired: Export Data with loading indicator, Delete Account with export-first option and password prompt

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration, Edge Function, and delete account hook** - `0db376e` (feat)
2. **Task 2: Deletion banner, wire all Settings actions together** - `d40501e` (feat)

## Files Created/Modified

- `supabase/migrations/20260316000000_add_deletion_columns.sql` - Adds deletion_scheduled_at column and cleanup function
- `supabase/functions/delete-account/index.ts` - Edge Function for account deletion lifecycle
- `src/features/settings/hooks/useDeleteAccount.ts` - Hook for delete flow with password verification
- `src/features/settings/components/DeletionBanner.tsx` - Grace period warning banner for dashboard
- `src/stores/authStore.ts` - Added deletionScheduledAt state and setter
- `src/features/settings/components/AccountSection.tsx` - Added isExporting prop with loading indicator
- `app/(app)/(tabs)/settings.tsx` - Wired export and delete flows with password prompt modal
- `app/(app)/(tabs)/dashboard.tsx` - Added DeletionBanner at top of scroll content

## Decisions Made

- Edge Function uses Deno.serve pattern with CORS headers for all responses
- Password re-entry uses Alert.prompt on iOS and custom modal with SecureTextEntry on Android
- User is signed out immediately after scheduling deletion (must sign back in to cancel)
- DeletionBanner syncs deletion status from profiles table on hook mount for app restart resilience

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

The Edge Function needs to be deployed to Supabase:
- Run `supabase functions deploy delete-account` to deploy the Edge Function
- The pg_cron cleanup job needs to be scheduled manually in the Supabase SQL editor (see migration comment)

## Next Phase Readiness

- Phase 11 is complete: Settings tab with preferences, notifications, data export, sign out, and delete account
- All features are wired and functional

---
*Phase: 11-add-settings-tab-move-sign-out-to-it-and-have-a-delete-account-option-with-data-export*
*Completed: 2026-03-11*
