---
phase: quick-30
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/auth/hooks/useAuth.ts
  - src/features/settings/components/ProfileHeader.tsx
  - src/features/dashboard/components/TappableAvatar.tsx
autonomous: true
requirements: [QUICK-30]
must_haves:
  truths:
    - "Profile photo selected during sign-up is persisted and visible after login"
    - "Dashboard avatar displays the user's profile photo from Supabase storage"
    - "Settings ProfileHeader displays the user's profile photo from Supabase storage"
    - "All avatar fallbacks use the same initials-based pattern when no photo exists"
  artifacts:
    - path: "src/features/auth/hooks/useAuth.ts"
      provides: "uploadProfilePhoto saves avatar_url to user_metadata"
    - path: "src/features/settings/components/ProfileHeader.tsx"
      provides: "ProfileHeader with consistent initials fallback and profiles table avatar fetch"
    - path: "src/features/dashboard/components/TappableAvatar.tsx"
      provides: "Dashboard avatar (unchanged, already correct)"
  key_links:
    - from: "src/features/auth/hooks/useAuth.ts"
      to: "supabase.auth.updateUser"
      via: "avatar_url stored in user_metadata during sign-up"
      pattern: "updateUser.*avatar_url"
    - from: "src/features/settings/components/ProfileHeader.tsx"
      to: "profiles table or user_metadata"
      via: "fetch avatar_url from profiles table as primary source"
      pattern: "avatar_url"
---

<objective>
Fix three related profile photo bugs:
1. Photo selected during account creation is uploaded to storage but the URL is never saved to `user_metadata`, so it disappears after sign-up
2. Dashboard and settings screens cannot display the photo because `user_metadata.avatar_url` is never set
3. Avatar fallback is inconsistent: dashboard uses initials, settings uses an Ionicons person icon

Purpose: Profile photos should persist through sign-up and display everywhere consistently.
Output: Working profile photo flow from sign-up through dashboard and settings display.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/auth/hooks/useAuth.ts
@src/features/settings/components/ProfileHeader.tsx
@src/features/dashboard/components/TappableAvatar.tsx
@app/(app)/(tabs)/dashboard.tsx (lines 220-260 for avatar handling reference)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix uploadProfilePhoto to save avatar_url in user_metadata</name>
  <files>src/features/auth/hooks/useAuth.ts</files>
  <action>
In the `uploadProfilePhoto` function (lines 7-30), after successfully uploading to storage and getting the public URL, add a call to `supabase.auth.updateUser({ data: { avatar_url: urlData.publicUrl } })` in addition to the existing profiles table update. This ensures the avatar URL is stored in `user_metadata` where the dashboard and settings screens read it from.

The current code only writes to the `profiles` table (`supabase.from('profiles').update({ avatar_url })`), but both the dashboard (`user?.user_metadata?.avatar_url`) and settings ProfileHeader (`user.user_metadata?.avatar_url`) read from auth user metadata, which is never set.

Add the updateUser call right after the profiles table update (line 25), before the closing brace of the `if (!uploadError)` block:

```typescript
await supabase.auth.updateUser({ data: { avatar_url: urlData.publicUrl } });
```

Also add a cache-busting query param to the URL (consistent with how dashboard.tsx does it on line 251):
```typescript
const cacheBustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;
```
Use `cacheBustedUrl` for both the profiles update and the updateUser call.

Note: The signUp function calls uploadProfilePhoto as fire-and-forget (line 73: `.catch(console.warn)`). This is fine -- the photo upload is non-blocking and the user can always re-upload from the dashboard. But the key fix is that when it does succeed, the URL is now stored where the app reads it.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Projects/Gym-App && npx tsc --noEmit --pretty 2>&1 | head -20</automated>
  </verify>
  <done>uploadProfilePhoto writes avatar_url to both profiles table AND user_metadata via supabase.auth.updateUser</done>
</task>

<task type="auto">
  <name>Task 2: Fix ProfileHeader to use consistent initials fallback and fetch avatar from profiles table</name>
  <files>src/features/settings/components/ProfileHeader.tsx</files>
  <action>
Two fixes in ProfileHeader:

1. **Fetch avatar from profiles table as fallback**: The current code only checks `user.user_metadata?.avatar_url`. For existing accounts that already have a photo in the profiles table but not in user_metadata, also query the profiles table. After the `getUser()` call, add a query: `const { data: profile } = await (supabase.from('profiles') as any).select('avatar_url').eq('id', user.id).single()`. Use `user.user_metadata?.avatar_url || profile?.avatar_url || null` as the avatarUrl.

2. **Replace Ionicons person-circle-outline fallback with initials**: Match the dashboard TappableAvatar pattern. Remove the `Ionicons` import if no longer needed. Replace the `avatarFallback` view (lines 38-40) with an initials-based circle matching TappableAvatar's style:
   - Extract initials from displayName: `displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'`
   - Render a View with the initials text, using `backgroundColor: colors.accent` and `color: colors.white` (same as TappableAvatar)
   - Size should remain 60x60 (matching current ProfileHeader avatar size, not 48x48 like dashboard)
   - Font size 24, fontWeight bold

Remove the Ionicons import since it will no longer be used in this component.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Projects/Gym-App && npx tsc --noEmit --pretty 2>&1 | head -20</automated>
  </verify>
  <done>ProfileHeader shows initials fallback (matching dashboard style), fetches avatar from profiles table as backup source</done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors
- In sign-up flow: selecting a profile photo results in avatar_url being set in user_metadata
- Dashboard TappableAvatar displays the profile photo after sign-up
- Settings ProfileHeader displays the profile photo after sign-up
- When no photo exists, both dashboard and settings show initials in an accent-colored circle
</verification>

<success_criteria>
- Profile photo selected during sign-up persists and is visible on dashboard and settings after login
- All avatar fallbacks consistently show initials (no Ionicons person icon anywhere)
- Existing users with photos in profiles table but not user_metadata still see their photo in settings
</success_criteria>

<output>
After completion, create `.planning/quick/30-profile-photo-doesn-t-save-on-account-cr/30-SUMMARY.md`
</output>
