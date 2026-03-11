---
phase: 11-add-settings-tab-move-sign-out-to-it-and-have-a-delete-account-option-with-data-export
verified: 2026-03-11T15:00:00Z
status: human_needed
score: 12/12 must-haves verified
human_verification:
  - test: "Settings tab navigation"
    expected: "Settings appears as 4th tab, tapping navigates to settings screen with all sections"
    why_human: "Visual/navigation verification requires running the app"
  - test: "Sign out confirmation flow"
    expected: "Tapping Sign Out shows alert with Cancel and Sign Out buttons; Sign Out signs user out"
    why_human: "Native Alert interaction requires device testing"
  - test: "Export Data share sheet"
    expected: "Tapping Export Data triggers CSV generation and opens OS share sheet with rpe-export.csv"
    why_human: "Share sheet is a native OS component, requires device testing"
  - test: "Delete Account flow"
    expected: "Tapping Delete Account shows 3-button alert (Cancel, Export Data First, Delete); Delete prompts for password; correct password schedules deletion and signs out"
    why_human: "Multi-step native alert flow with password input requires device testing"
  - test: "Deletion banner on dashboard"
    expected: "After scheduling deletion and signing back in, dashboard shows red warning banner with deletion date; tapping banner cancels deletion"
    why_human: "Requires end-to-end flow with Edge Function deployed to Supabase"
  - test: "Unit preference toggles persist"
    expected: "Toggling weight (lbs/kg) and measurement (in/cm) persists across app restarts"
    why_human: "Requires app restart verification on device"
---

# Phase 11: Settings + Account Management Verification Report

**Phase Goal:** Users have a dedicated Settings tab for account management -- unit preferences, alarm controls, data export (CSV via share sheet), sign out with confirmation, and account deletion with password re-entry, 7-day grace period, and server-side cleanup via Supabase Edge Function.
**Verified:** 2026-03-11T15:00:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Settings appears as the 4th tab in the bottom navigation bar | VERIFIED | `_layout.tsx` has `Tabs.Screen name="settings"` as 4th entry with settings-outline icon |
| 2 | Dashboard no longer has gear icon in header | VERIFIED | No `headerRight` or `gear` references in `_layout.tsx` dashboard tab |
| 3 | Settings screen shows profile header with avatar, display name, and email | VERIFIED | `ProfileHeader.tsx` fetches user via `supabase.auth.getUser()`, renders avatar (60x60), display name, email |
| 4 | User can toggle weight unit (lbs/kg) and measurement unit (in/cm) | VERIFIED | `PreferencesSection.tsx` reads/writes `preferredUnit` and `preferredMeasurementUnit` via `useAuthStore` |
| 5 | Pause all alarms toggle works in Settings | VERIFIED | `NotificationsSection.tsx` uses `useAlarmStore` isPaused/setPaused with `cancelPlanAlarms`/`syncActiveAlarms` |
| 6 | Sign Out shows confirmation alert and signs user out | VERIFIED | `AccountSection.tsx` shows `Alert.alert("Sign Out", ...)` with Cancel/Sign Out buttons, calls `useAuth().signOut()` |
| 7 | CSV generation produces valid output with proper escaping | VERIFIED | `csvExport.ts` implements RFC 4180 escaping; 20 unit tests all pass |
| 8 | All data categories are exported | VERIFIED | `useDataExport.ts` queries workout_sessions, plans, bodyweight_logs, body_measurements, pr_baselines in parallel |
| 9 | Export triggers OS share sheet with CSV file | VERIFIED | `useDataExport.ts` writes to `cacheDirectory + 'rpe-export.csv'`, calls `Sharing.shareAsync` with correct mimeType/UTI |
| 10 | User must re-enter password before account deletion proceeds | VERIFIED | `useDeleteAccount.ts` calls `supabase.auth.signInWithPassword` before invoking Edge Function |
| 11 | Account deletion sets a 7-day grace period, not immediate deletion | VERIFIED | Edge Function `schedule` action sets `deletion_scheduled_at` to `now() + 7 days`; migration adds column |
| 12 | Dashboard shows warning banner during grace period with cancel | VERIFIED | `DeletionBanner.tsx` renders when `deletionScheduledAt` is set; `dashboard.tsx` imports and renders it at top |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/(app)/(tabs)/settings.tsx` | Settings tab screen with all sections | VERIFIED (205 lines) | Composes ProfileHeader, PreferencesSection, NotificationsSection, AccountSection; wires useDataExport and useDeleteAccount; includes Android password modal |
| `app/(app)/(tabs)/_layout.tsx` | 4th tab for settings | VERIFIED | Settings tab added, no gear icon remains |
| `src/features/settings/components/ProfileHeader.tsx` | User profile display | VERIFIED (85 lines) | Fetches user, renders avatar/name/email |
| `src/features/settings/components/PreferencesSection.tsx` | Unit toggles | VERIFIED (133 lines) | SegmentedToggle component, lbs/kg and in/cm toggles |
| `src/features/settings/components/NotificationsSection.tsx` | Alarm pause toggle | VERIFIED (102 lines) | Switch with alarm cancel/sync logic |
| `src/features/settings/components/AccountSection.tsx` | Export/SignOut/Delete rows | VERIFIED (107 lines) | Three rows with proper icons, sign out confirmation, isExporting loading state |
| `src/features/settings/utils/csvExport.ts` | CSV generation functions | VERIFIED (119 lines) | escapeCSVField, toCSV, 4 generators, combineExportSections |
| `src/features/settings/hooks/useDataExport.ts` | Data export hook | VERIFIED (95 lines) | Parallel Supabase queries, file write, share sheet |
| `src/features/settings/hooks/useDeleteAccount.ts` | Delete account hook | VERIFIED (91 lines) | Password verify, Edge Function invoke, deletion sync on mount |
| `src/features/settings/components/DeletionBanner.tsx` | Grace period banner | VERIFIED (62 lines) | Warning banner with formatted date, tap-to-cancel |
| `supabase/migrations/20260316000000_add_deletion_columns.sql` | deletion_scheduled_at column + cleanup function | VERIFIED (24 lines) | ALTER TABLE, cleanup function, pg_cron comment |
| `supabase/functions/delete-account/index.ts` | Edge Function | VERIFIED (117 lines) | schedule/cancel/execute actions, CORS, auth verification, service_role admin |
| `tests/settings/csvExport.test.ts` | CSV unit tests | VERIFIED | 20 tests, all passing |
| `src/stores/authStore.ts` | preferredMeasurementUnit + deletionScheduledAt | VERIFIED | Both fields added with setters and clearAuth reset |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `_layout.tsx` | `settings.tsx` (tab) | `Tabs.Screen name="settings"` | WIRED | 4th tab entry present |
| `settings.tsx` | `authStore.ts` | `useAuthStore` via PreferencesSection | WIRED | PreferencesSection imports and uses useAuthStore |
| `settings.tsx` | `useDataExport` | import + `exportData` passed to AccountSection | WIRED | Line 8 import, line 12 destructure, line 91 prop |
| `settings.tsx` | `useDeleteAccount` | import + `scheduleDelete` in password flow | WIRED | Line 9 import, line 13 destructure, line 47 call |
| `useDataExport.ts` | `csvExport.ts` | imports CSV generation functions | WIRED | Line 6-12 imports all generators + combiner |
| `useDataExport.ts` | `expo-file-system` | `writeAsStringAsync` | WIRED | Line 73 writeAsStringAsync call |
| `useDataExport.ts` | `expo-sharing` | `shareAsync` | WIRED | Line 81 shareAsync call |
| `useDeleteAccount.ts` | Edge Function | `supabase.functions.invoke('delete-account')` | WIRED | Lines 51, 73 invoke calls |
| `DeletionBanner.tsx` | `authStore.ts` | reads `deletionScheduledAt` | WIRED | Via useDeleteAccount hook which reads from authStore |
| `dashboard.tsx` | `DeletionBanner.tsx` | renders `<DeletionBanner />` | WIRED | Line 20 import, line 361 render |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SETT-01 | 11-01 | Settings tab appears as 4th tab | VERIFIED | `_layout.tsx` has settings Tabs.Screen |
| SETT-02 | 11-02 | CSV export generates valid CSV from all data categories | VERIFIED | 20 tests passing; useDataExport queries all tables |
| SETT-03 | 11-03 | Password re-entry verification works | VERIFIED | `useDeleteAccount.ts` calls signInWithPassword |
| SETT-04 | 11-01 | Sign out confirmation flow | VERIFIED | AccountSection shows Alert.alert with confirmation |
| SETT-05 | 11-03 | Delete account Edge Function marks for deletion | VERIFIED | Edge Function schedule action sets 7-day grace period |
| SETT-06 | 11-03 | Grace period banner shows/hides correctly | VERIFIED | DeletionBanner conditionally renders based on deletionScheduledAt |
| SETT-07 | 11-01 | Unit preference toggles read/write store | VERIFIED | PreferencesSection reads/writes both unit preferences |

Note: SETT-01 through SETT-07 are phase-specific requirements defined in 11-RESEARCH.md/11-VALIDATION.md. They are not present in the main REQUIREMENTS.md (which was finalized before Phase 11 was added to the roadmap). The REQUIREMENTS.md traceability section should be updated to include these requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none found) | - | - | - | - |

No TODOs, FIXMEs, placeholders, console.logs, or stub implementations found in any phase 11 files. Old settings stack route `app/(app)/settings.tsx` has been properly deleted.

### Human Verification Required

### 1. Settings tab navigation
**Test:** Open app, verify Settings appears as 4th tab with gear icon, tap to navigate
**Expected:** Settings screen shows with ProfileHeader, Preferences, Notifications, Account sections
**Why human:** Visual/navigation verification requires running the app

### 2. Sign out confirmation
**Test:** Tap Sign Out row in Account section
**Expected:** Alert appears with "Cancel" and "Sign Out" buttons; Sign Out signs user out
**Why human:** Native Alert interaction requires device testing

### 3. Export Data via share sheet
**Test:** Tap Export Data row in Account section
**Expected:** Loading indicator shows, then OS share sheet opens with rpe-export.csv file
**Why human:** Share sheet is a native OS component, file writing needs real filesystem

### 4. Delete Account full flow
**Test:** Tap Delete Account, choose "Delete", enter password
**Expected:** Three-button alert (Cancel / Export Data First / Delete), password prompt, signs out after scheduling
**Why human:** Multi-step native alert flow with Edge Function requires deployed backend

### 5. Deletion banner on dashboard
**Test:** Schedule deletion, sign back in, check dashboard
**Expected:** Red warning banner with "Your account is scheduled for deletion on {date}. Tap to cancel."
**Why human:** Requires deployed Edge Function and end-to-end flow

### 6. Unit preference persistence
**Test:** Toggle weight to kg, measurement to cm, force-close and reopen app
**Expected:** Settings screen shows kg and cm as selected
**Why human:** Requires app restart to verify MMKV persistence

### Gaps Summary

No gaps found. All 12 observable truths are verified at the code level. All 14 artifacts exist, are substantive, and are properly wired. All 10 key links are connected. All 7 SETT requirements have supporting implementation.

The only remaining verification is human testing of the interactive flows (native alerts, share sheet, Edge Function deployment, app restart persistence). The Edge Function requires deployment via `supabase functions deploy delete-account` and the pg_cron job must be scheduled manually in the Supabase SQL editor.

---

_Verified: 2026-03-11T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
