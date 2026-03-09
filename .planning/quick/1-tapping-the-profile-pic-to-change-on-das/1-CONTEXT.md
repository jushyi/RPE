# Quick Task 1: Fix dashboard profile pic change - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Task Boundary

Tapping the profile pic to change on dashboard doesn't seem to work properly. The new picture shows for a second then disappears — optimistic update works but Supabase upload/URL persistence fails.

</domain>

<decisions>
## Implementation Decisions

### Upload mechanism
- Use FormData with file URI for Supabase Storage upload — no new dependencies, no rebuild needed
- Do NOT use fetch(uri).blob() (broken in RN) or expo-file-system (would require rebuild)

### Error feedback
- Show Alert on upload failure and revert avatar back to previous image (undo optimistic update)

### Image caching
- Append `?t=Date.now()` timestamp query param to Supabase public URL so RN Image always fetches fresh

### Claude's Discretion
- Whether to also sync avatar_url to the profiles table (currently only updates auth.user metadata)
- Whether to add a subtle loading indicator during upload

</decisions>

<specifics>
## Specific Ideas

- Core symptom: image shows briefly (local URI optimistic update) then disappears
- Root cause: `fetch(uri).blob()` is unreliable in React Native for local file URIs
- The `handlePhotoChanged` in dashboard.tsx silently catches errors with console.warn
- Supabase public URL path is always `<userId>/avatar.jpg` — no cache busting

</specifics>
