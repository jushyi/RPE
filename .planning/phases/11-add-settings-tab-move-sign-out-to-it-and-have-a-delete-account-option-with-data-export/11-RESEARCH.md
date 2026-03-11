# Phase 11: Settings Tab, Sign Out, Delete Account with Data Export - Research

**Researched:** 2026-03-11
**Domain:** React Native (Expo) settings UI, CSV data export, Supabase Edge Functions for account deletion
**Confidence:** HIGH

## Summary

Phase 11 adds a 4th Settings tab to the bottom navigation, consolidating account management (sign out, delete account) and user preferences (weight/measurement units, alarm pause). The phase also introduces CSV data export via the OS share sheet and a delete account flow with password re-entry, 7-day grace period, and server-side cleanup via a Supabase Edge Function.

The core technical challenges are: (1) moving the existing settings screen from a stack route to a tab route, (2) building CSV generation from multiple Supabase tables and sharing via expo-file-system + expo-sharing, (3) implementing the delete account flow with a Supabase Edge Function using the service_role admin API, and (4) adding a grace period banner on the dashboard with cancellation support.

**Primary recommendation:** Use expo-file-system to write CSV files to the cache directory and expo-sharing to present the share sheet. For account deletion, create a Supabase Edge Function that uses `auth.admin.deleteUser()` with the service_role key, with a `deletion_scheduled_at` column on the profiles table for grace period tracking and a pg_cron job for cleanup.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Settings becomes the 4th tab in the bottom navigation bar (alongside Home, Exercises, Plans)
- Remove the gear icon from the dashboard header -- Settings tab replaces it, no duplicate entry points
- Tab icon: Ionicons (Claude picks appropriate icon)
- Single scrollable screen with grouped card sections (same card pattern as existing settings screen)
- User profile header at the top: avatar, display name, email
- Section order: Preferences > Notifications > Account
- Default weight unit toggle (lbs / kg) -- reads/writes existing preferredUnit from auth store
- Default measurement unit toggle (in / cm) -- sets default for body measurements
- Existing "Pause all alarms" toggle carried over from Phase 8 settings.tsx
- Export Data row -- standalone action, always available (also offered during delete flow)
- Sign Out row -- shows confirmation alert before signing out
- Delete Account row -- red/destructive text color, same card as other account actions
- CSV format with multiple files per data type (one file per category)
- Categories: workout sessions + sets, plans, body metrics + bodyweight, PR baselines + records
- Delivery: OS share sheet (expo-sharing)
- Export available as standalone action AND offered during delete account flow
- Confirmation alert before signing out
- Password re-entry required before deletion proceeds
- 7-day grace period -- account marked for deletion but data preserved
- Server-side: Supabase Edge Function handles marking, scheduling cleanup after 7 days
- Grace period banner on dashboard with cancel button
- Delete confirmation dialog offers "Export first" option

### Claude's Discretion
- Settings tab icon choice (settings-outline vs person-outline vs other Ionicon)
- CSV generation library/approach
- Edge Function implementation details (cron cleanup, soft-delete column, etc.)
- Profile header styling and avatar display
- Password re-entry UI (inline in alert vs separate screen)
- Grace period banner styling and positioning
- How deletion cancellation is persisted (profile column, separate table, etc.)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-file-system | SDK 55 compatible | Write CSV files to device cache | Standard Expo module for file I/O |
| expo-sharing | SDK 55 compatible | Present OS share sheet for CSV files | Standard Expo module for sharing files |
| @supabase/supabase-js | ^2.99.0 | Already installed -- client-side queries for data export | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Supabase Edge Functions (Deno) | Latest | Server-side account deletion with service_role key | Delete account flow |
| pg_cron + pg_net | Built into Supabase | Schedule cleanup of expired grace period accounts | Automated 7-day cleanup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-sharing | react-native-share | expo-sharing is simpler, already in Expo ecosystem, sufficient for file sharing |
| Manual CSV string building | papaparse / csv-stringify | Extra dependency for simple tabular data -- manual string concatenation is fine for known schemas |
| pg_cron scheduled cleanup | Edge Function with Supabase Vault cron | pg_cron is simpler, runs in-database, no HTTP overhead for a simple DELETE query |

**Installation:**
```bash
npx expo install expo-file-system expo-sharing
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  features/
    settings/
      components/
        ProfileHeader.tsx          # Avatar, name, email display
        PreferencesSection.tsx     # Weight/measurement unit toggles
        NotificationsSection.tsx   # Alarm pause toggle (moved from old settings)
        AccountSection.tsx         # Export, Sign Out, Delete Account rows
        DeletionBanner.tsx         # Grace period warning banner for dashboard
      hooks/
        useDataExport.ts           # CSV generation and sharing logic
        useDeleteAccount.ts        # Deletion flow: password verify, Edge Function call
      utils/
        csvExport.ts              # Pure functions: data -> CSV string conversion
app/
  (app)/
    (tabs)/
      settings.tsx                # New tab-based settings screen (replaces stack route)
supabase/
  functions/
    delete-account/
      index.ts                    # Edge Function: mark/execute account deletion
  migrations/
    20260316000000_add_deletion_columns.sql  # deletion_scheduled_at on profiles
```

### Pattern 1: Tab Route Migration
**What:** Move settings from stack route `app/(app)/settings.tsx` to tab route `app/(app)/(tabs)/settings.tsx`
**When to use:** Settings becomes a persistent tab instead of a pushed screen
**Example:**
```typescript
// app/(app)/(tabs)/_layout.tsx - Add 4th tab
<Tabs.Screen
  name="settings"
  options={{
    title: 'Settings',
    tabBarIcon: ({ color }) => (
      <Ionicons name="settings-outline" size={20} color={color} />
    ),
    headerShown: true,
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.textPrimary,
  }}
/>
// Also: Remove headerRight from dashboard tab options
```

### Pattern 2: CSV Export with Share Sheet
**What:** Query Supabase tables, build CSV strings, write to cache, present share sheet
**When to use:** Data export action
**Example:**
```typescript
// Source: Expo docs for expo-file-system + expo-sharing
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

async function exportAndShare(csvContent: string, filename: string) {
  const fileUri = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(fileUri, csvContent);
  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Export Data',
  });
}
```

### Pattern 3: Supabase Edge Function for Account Deletion
**What:** Deno Edge Function that uses service_role key to mark account for deletion or hard-delete
**When to use:** Delete account flow (client cannot use admin API)
**Example:**
```typescript
// supabase/functions/delete-account/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')!;
  // Verify the user's JWT to get their ID
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await userClient.auth.getUser();

  // Use service_role client for admin operations
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { action } = await req.json();

  if (action === 'schedule') {
    // Mark for deletion (7-day grace period)
    const deletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await adminClient.from('profiles')
      .update({ deletion_scheduled_at: deletionDate.toISOString() })
      .eq('id', user!.id);
    return new Response(JSON.stringify({ deletion_date: deletionDate }));
  }

  if (action === 'cancel') {
    await adminClient.from('profiles')
      .update({ deletion_scheduled_at: null })
      .eq('id', user!.id);
    return new Response(JSON.stringify({ cancelled: true }));
  }

  if (action === 'execute') {
    // Called by pg_cron -- hard delete the user (CASCADE handles data tables)
    await adminClient.auth.admin.deleteUser(user!.id);
    return new Response(JSON.stringify({ deleted: true }));
  }

  return new Response('Bad request', { status: 400 });
});
```

### Pattern 4: Password Re-entry Verification
**What:** Re-authenticate user with signInWithPassword before allowing destructive action
**When to use:** Before scheduling account deletion
**Example:**
```typescript
// Verify password by attempting sign-in with current email
const { error } = await supabase.auth.signInWithPassword({
  email: user.email!,
  password: enteredPassword,
});
if (error) throw new Error('Incorrect password');
// Password verified -- proceed with deletion scheduling
```

### Anti-Patterns to Avoid
- **Exposing service_role key on client:** Never use `auth.admin.deleteUser()` from the React Native app. Always go through an Edge Function.
- **Deleting user data before auth user:** The CASCADE constraint on `auth.users(id)` handles data cleanup automatically when the auth user is deleted. Do not manually delete from each table.
- **Blocking UI during export:** CSV generation and file writing should show a loading indicator but not freeze the UI. Use async/await properly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File sharing | Custom intent/activity code | expo-sharing `shareAsync()` | Platform-specific share sheet behavior is complex |
| File I/O | Direct native file access | expo-file-system | Handles permissions, sandboxing, cache paths |
| User deletion | Client-side admin calls | Supabase Edge Function | Service role key must never be on client |
| Scheduled cleanup | Custom timer/polling | pg_cron with database function | Runs in Supabase infrastructure, no external service needed |
| CSV escaping | Naive string join | Proper escape function | Fields containing commas, quotes, or newlines need proper RFC 4180 escaping |

**Key insight:** The most complex part is the Edge Function + pg_cron pipeline. CSV generation is straightforward because the data schemas are known and fixed. The CASCADE delete constraint on all tables means data cleanup is automatic once the auth user is deleted.

## Common Pitfalls

### Pitfall 1: Tab Route File Collision
**What goes wrong:** Having both `app/(app)/settings.tsx` (old stack route) and `app/(app)/(tabs)/settings.tsx` (new tab route) causes expo-router conflicts.
**Why it happens:** Forgetting to delete the old stack route when creating the tab route.
**How to avoid:** Delete `app/(app)/settings.tsx` when creating `app/(app)/(tabs)/settings.tsx`.
**Warning signs:** Navigation errors, wrong screen rendering.

### Pitfall 2: CSV Special Characters
**What goes wrong:** CSV fields containing commas, double quotes, or newlines break the file format.
**Why it happens:** Naive `array.join(',')` without escaping.
**How to avoid:** Wrap fields containing special characters in double quotes, and escape internal double quotes by doubling them (`"` becomes `""`).
**Warning signs:** CSV opens incorrectly in Excel/Numbers.

### Pitfall 3: Share Sheet on Simulator
**What goes wrong:** `expo-sharing` may not work correctly on iOS Simulator (no share targets).
**Why it happens:** Simulator limitations.
**How to avoid:** Test on physical device. Use `Sharing.isAvailableAsync()` guard.
**Warning signs:** Share sheet doesn't appear or immediately dismisses.

### Pitfall 4: Edge Function Auth Header Forwarding
**What goes wrong:** Edge Function cannot identify the calling user.
**Why it happens:** Forgetting to pass the Authorization header from the client to the Edge Function.
**How to avoid:** Always forward the user's JWT: `supabase.functions.invoke('delete-account', { body: { action: 'schedule' } })` -- the Supabase JS client automatically includes the auth header.
**Warning signs:** 401 errors or null user in Edge Function.

### Pitfall 5: Grace Period Banner State
**What goes wrong:** Banner shows/hides incorrectly across app restarts.
**Why it happens:** Reading deletion status only from local state, not syncing with server.
**How to avoid:** Check `profiles.deletion_scheduled_at` on app launch/dashboard mount. Store in auth store or a dedicated store with MMKV persistence.
**Warning signs:** Banner persists after cancellation, or doesn't show after scheduling.

### Pitfall 6: Password Re-entry Creates New Session
**What goes wrong:** `signInWithPassword` for verification replaces the current session token.
**Why it happens:** Supabase treats every successful sign-in as a session refresh.
**How to avoid:** This is actually fine -- the session is refreshed with the same user. The user remains authenticated. No special handling needed.
**Warning signs:** None (this is a non-issue but commonly feared).

## Code Examples

### CSV Generation Utility
```typescript
// src/features/settings/utils/csvExport.ts

function escapeCSVField(field: string | number | null | undefined): string {
  if (field == null) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(headers: string[], rows: (string | number | null)[][]): string {
  const headerLine = headers.map(escapeCSVField).join(',');
  const dataLines = rows.map(row => row.map(escapeCSVField).join(','));
  return [headerLine, ...dataLines].join('\n');
}
```

### Invoking Edge Function from Client
```typescript
// Source: Supabase JS client docs
const { data, error } = await supabase.functions.invoke('delete-account', {
  body: { action: 'schedule' },
});
// Auth header is automatically included by the Supabase client
```

### Profile Header with User Data
```typescript
// Get user info for profile header
const { data: { user } } = await supabase.auth.getUser();
const displayName = user?.user_metadata?.display_name || 'User';
const email = user?.email || '';
const avatarUrl = user?.user_metadata?.avatar_url;
// Or from profiles table via existing profile query pattern
```

### pg_cron Cleanup Job
```sql
-- Migration: Schedule daily cleanup of expired deletion grace periods
-- This calls the Edge Function with service_role to execute deletions
-- Alternative: Direct SQL deletion of auth.users (requires careful RLS bypass)

-- Simpler approach: Database function that directly cleans up
CREATE OR REPLACE FUNCTION public.cleanup_expired_deletions()
RETURNS void AS $$
DECLARE
  expired_user RECORD;
BEGIN
  FOR expired_user IN
    SELECT id FROM public.profiles
    WHERE deletion_scheduled_at IS NOT NULL
      AND deletion_scheduled_at <= now()
  LOOP
    -- Delete from auth.users triggers CASCADE on all public tables
    DELETE FROM auth.users WHERE id = expired_user.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule to run daily at 3 AM UTC
SELECT cron.schedule(
  'cleanup-expired-deletions',
  '0 3 * * *',
  'SELECT public.cleanup_expired_deletions()'
);
```

**Note:** The direct SQL approach (deleting from `auth.users` in a SECURITY DEFINER function) is simpler than calling an Edge Function from pg_cron. All data tables have `ON DELETE CASCADE` referencing `auth.users(id)`, so deleting the auth user automatically removes all their data.

### Measurement Unit Default Store
```typescript
// Add to authStore or create a new preferences store
// For measurement unit default (in/cm), extend authStore:
interface AuthState {
  // ... existing
  preferredMeasurementUnit: 'in' | 'cm';
}
// setPreferredMeasurementUnit action follows same pattern as setPreferredUnit
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stack route settings screen | Tab-based settings (this phase) | Phase 11 | Settings accessible via tab bar, not header icon |
| No data export | CSV export via share sheet | Phase 11 | Users can back up their data anytime |
| No account deletion | Grace period deletion with Edge Function | Phase 11 | GDPR/privacy compliance, user control |

**Deprecated/outdated:**
- `app/(app)/settings.tsx` (stack route): Will be replaced by `app/(app)/(tabs)/settings.tsx`
- Dashboard header gear icon: Removed, replaced by Settings tab

## Open Questions

1. **pg_cron availability on project's Supabase plan**
   - What we know: pg_cron is available on all paid Supabase plans and the free tier.
   - What's unclear: Whether the project's Supabase instance has pg_cron enabled.
   - Recommendation: Enable pg_cron extension if not already enabled (`CREATE EXTENSION IF NOT EXISTS pg_cron`). If unavailable, the Edge Function approach via vault + pg_net is the fallback.

2. **Multiple CSV files vs single ZIP**
   - What we know: User wants "multiple sheets per data type" which maps to separate CSV files.
   - What's unclear: Whether expo-sharing can share multiple files at once.
   - Recommendation: `expo-sharing` only shares one file at a time. Options: (a) share files one by one with user tapping export per category, (b) combine all CSVs into one multi-section file with headers separating sections, or (c) generate one CSV per category and let user export each. Option (b) is recommended -- a single CSV file with section headers is simplest UX.

3. **Deletion of storage objects (avatars)**
   - What we know: CASCADE handles database rows but not Supabase Storage objects.
   - What's unclear: Whether avatar cleanup is needed or if orphaned storage objects are acceptable.
   - Recommendation: Add avatar cleanup to the Edge Function or database cleanup function. Call `storage.from('avatars').remove([userId + '/avatar.jpg'])` before deleting the auth user.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo |
| Config file | `jest.config.js` |
| Quick run command | `npm test -- --bail` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETT-01 | Settings tab appears as 4th tab | manual-only | Manual: visual verification | N/A |
| SETT-02 | CSV export generates valid CSV from all data categories | unit | `npm test -- tests/settings/csvExport.test.ts --bail` | No - Wave 0 |
| SETT-03 | Password re-entry verification works | unit | `npm test -- tests/settings/deleteAccount.test.ts --bail` | No - Wave 0 |
| SETT-04 | Sign out confirmation flow | manual-only | Manual: tap Sign Out, verify alert appears | N/A |
| SETT-05 | Delete account Edge Function marks for deletion | unit | `npm test -- tests/settings/deleteAccount.test.ts --bail` | No - Wave 0 |
| SETT-06 | Grace period banner shows/hides correctly | unit | `npm test -- tests/settings/deletionBanner.test.ts --bail` | No - Wave 0 |
| SETT-07 | Unit preference toggles read/write store | unit | `npm test -- tests/settings/preferences.test.ts --bail` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --bail`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/settings/csvExport.test.ts` -- covers CSV generation logic (pure function tests)
- [ ] `tests/settings/deleteAccount.test.ts` -- covers password verification and Edge Function invocation mocking
- [ ] `tests/settings/deletionBanner.test.ts` -- covers banner show/hide logic
- [ ] `tests/settings/preferences.test.ts` -- covers unit toggle store integration
- [ ] Mock for `expo-file-system` and `expo-sharing` in `tests/__mocks__/`

## Sources

### Primary (HIGH confidence)
- [Supabase auth.admin.deleteUser() docs](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser) -- API signature, soft delete option, service_role requirement
- [Supabase Edge Functions quickstart](https://supabase.com/docs/guides/functions/quickstart) -- Deno.serve pattern, directory structure
- [Supabase scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions) -- pg_cron + pg_net pattern, vault secrets
- [Expo Sharing docs](https://docs.expo.dev/versions/latest/sdk/sharing/) -- shareAsync API, mimeType/UTI options
- [Expo FileSystem docs](https://docs.expo.dev/versions/latest/sdk/filesystem/) -- writeAsStringAsync, cacheDirectory
- Existing codebase: `app/(app)/settings.tsx`, `app/(app)/(tabs)/_layout.tsx`, all migration files, `src/stores/authStore.ts`

### Secondary (MEDIUM confidence)
- [Supabase pg_cron docs](https://supabase.com/docs/guides/database/extensions/pg_cron) -- cron.schedule syntax
- [Supabase Edge Function environment variables](https://supabase.com/docs/guides/functions/secrets) -- SUPABASE_SERVICE_ROLE_KEY availability
- [Supabase Edge Function auth](https://supabase.com/docs/guides/functions/auth) -- Securing Edge Functions, JWT verification

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- expo-file-system and expo-sharing are standard Expo modules, well-documented
- Architecture: HIGH -- patterns follow existing project conventions (Zustand + MMKV, feature dirs, Ionicons)
- Pitfalls: HIGH -- common patterns well-documented, CASCADE delete behavior verified from migrations
- Edge Function: MEDIUM -- first Edge Function in this project, pg_cron availability not confirmed

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable Expo SDK 55 ecosystem)
