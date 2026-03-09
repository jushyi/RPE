---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/(tabs)/dashboard.tsx
autonomous: true
requirements: [QUICK-1]

must_haves:
  truths:
    - "User taps avatar, picks a photo, and the new photo persists across app reloads"
    - "If upload fails, user sees an Alert explaining the failure and avatar reverts to previous image"
    - "After successful upload, the avatar image is not stale-cached (shows updated photo immediately)"
  artifacts:
    - path: "app/(app)/(tabs)/dashboard.tsx"
      provides: "Fixed handlePhotoChanged with FormData upload, Alert on failure, cache-bust URL"
  key_links:
    - from: "app/(app)/(tabs)/dashboard.tsx"
      to: "supabase.storage.from('avatars').upload"
      via: "FormData with file URI object"
      pattern: "FormData.*append.*uri"
---

<objective>
Fix the dashboard profile photo change so uploads actually persist.

Purpose: The current `fetch(uri).blob()` approach silently fails in React Native, causing the avatar to revert after a brief optimistic preview. Replace with FormData file URI upload, add user-facing error feedback, and cache-bust the public URL.

Output: Working avatar upload in `dashboard.tsx` — no new dependencies, no rebuild required.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@app/(app)/(tabs)/dashboard.tsx

<interfaces>
<!-- From app/(app)/(tabs)/dashboard.tsx — the only file we touch -->
Key imports already available:
- `supabase` from `@/lib/supabase/client` — Supabase client instance
- `ImagePicker` from `expo-image-picker` — provides result.assets[0].uri
- `Alert` from `react-native` — already imported
- `useAuth` provides `user` with `user.id` and `user.user_metadata`

The handlePhotoChanged function (lines 114-130) is the fix target.
TappableAvatar component (lines 14-62) needs no changes — it correctly calls onPhotoChanged with the local URI.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix avatar upload with FormData, error feedback, and cache-busting</name>
  <files>app/(app)/(tabs)/dashboard.tsx</files>
  <action>
Replace the `handlePhotoChanged` function (lines 114-130) with the following fixes:

1. **Save previous avatar URL** before optimistic update: `const previousUrl = avatarUrl;`

2. **Replace fetch(uri).blob() with FormData upload** (per user decision — NO new deps):
   ```typescript
   const ext = uri.split('.').pop() ?? 'jpg';
   const formData = new FormData();
   formData.append('file', {
     uri,
     name: `avatar.${ext}`,
     type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
   } as any);
   ```
   Then upload: `supabase.storage.from('avatars').upload(filePath, formData, { contentType: 'multipart/form-data', upsert: true })`

   NOTE: The `as any` cast is needed because React Native's FormData accepts file URI objects but TypeScript types don't know about it. This is the standard RN pattern.

3. **Check upload error** — Supabase storage returns `{ data, error }`. If `error`:
   - Revert: `setAvatarUrl(previousUrl);`
   - Show Alert: `Alert.alert('Upload Failed', 'Could not update your profile photo. Please try again.');`
   - `return;`

4. **Cache-bust the public URL** (per user decision): After getting `urlData.publicUrl`, append `?t=${Date.now()}` before calling `setAvatarUrl` and `updateUser`:
   ```typescript
   const cacheBustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;
   await supabase.auth.updateUser({ data: { avatar_url: cacheBustedUrl } });
   setAvatarUrl(cacheBustedUrl);
   ```

5. **Wrap the outer catch** to also revert and alert (handles any unexpected errors):
   ```typescript
   catch (err) {
     console.warn('Avatar upload failed:', err);
     setAvatarUrl(previousUrl);
     Alert.alert('Upload Failed', 'Could not update your profile photo. Please try again.');
   }
   ```

6. **Also fix initial avatarUrl state** — if the stored `avatar_url` in user metadata already has a cache-bust param, it will work fine. No change needed there.

Do NOT add any new imports or dependencies. Do NOT change TappableAvatar or any other part of the file.
  </action>
  <verify>
    <automated>cd c:/Users/maser/Desktop/Gym-App && npx tsc --noEmit app/\(app\)/\(tabs\)/dashboard.tsx 2>&1 | head -20</automated>
  </verify>
  <done>
    - handlePhotoChanged uses FormData with file URI object (not fetch/blob)
    - Upload failure shows Alert and reverts avatarUrl to previous value
    - Successful upload sets cache-busted URL with ?t=timestamp
    - TypeScript compiles without errors
    - No new dependencies added
  </done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `npx tsc --noEmit` passes for dashboard.tsx
2. Manual test: tap avatar, pick photo from gallery, confirm it persists after scrolling away and back
3. Manual test: airplane mode, tap avatar, pick photo — should see Alert and avatar reverts
</verification>

<success_criteria>
- Avatar photo upload works end-to-end (pick -> upload -> persist)
- Failed uploads show Alert and revert to previous avatar
- Fresh avatar URL is not stale-cached by RN Image
- No new dependencies introduced
</success_criteria>

<output>
After completion, create `.planning/quick/1-tapping-the-profile-pic-to-change-on-das/1-SUMMARY.md`
</output>
