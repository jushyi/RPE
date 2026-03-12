# Phase 14: Set Videos - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can record or upload a video for a specific set during an active workout, view those videos as thumbnails in workout history detail, and browse all videos in a dedicated gallery screen accessible from Settings. One video per set, stored in Supabase Storage.

</domain>

<decisions>
## Implementation Decisions

### Video capture flow
- Camera button on each SetCard (per-set granularity)
- Both record in-app and choose from gallery options
- Max video duration: 2 minutes
- Videos stored in Supabase Storage (new `set-videos` bucket)
- Background upload starts immediately after recording (offline-first pattern — queue if no network)

### Video-to-set association
- One video per set (1:1 mapping on set_logs)
- User can replace (re-record/re-upload) or delete an attached video
- Upload happens in background immediately, same pattern as set logging

### Playback in history
- Small video thumbnail with play icon overlay on each SetRow that has a video
- Tap thumbnail opens fullscreen native video player (system player, not custom)
- Single video view only — no swipeable gallery between session videos
- Small camera/video icon badge on session list cards that contain at least one video
- Videos deletable from history detail screen (tap video → delete option)

### Videos gallery in Settings
- "My Videos" row in Settings navigates to a dedicated gallery screen
- Chronological feed (reverse-chronological) with date, exercise name, and set info per entry
- Storage usage header showing total video count and MB used
- Tap to delete individual videos (consistent with tap-to-expand/delete pattern)

### Claude's Discretion
- Video compression/quality settings
- Thumbnail generation approach (local frame extraction vs server-side)
- Upload retry/queue implementation details
- Exact camera UI layout and recording indicators
- Supabase Storage bucket configuration (public vs authenticated URLs)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SetCard` (`src/features/workout/components/SetCard.tsx`): Target for adding camera button — already handles per-set UI
- `SetRow` (`src/features/history/components/SetRow.tsx`): Target for adding video thumbnail in history detail
- `SessionExerciseCard` (`src/features/history/components/SessionExerciseCard.tsx`): Parent of SetRow, may need layout adjustments
- `ProfilePhotoPicker` (`src/features/auth/components/ProfilePhotoPicker.tsx`): Existing camera/gallery picker pattern using `expo-image-picker`
- `useAuth.ts` → `uploadProfilePhoto()`: Existing Supabase Storage upload pattern (avatars bucket)
- `AccountSection` (`src/features/settings/components/AccountSection.tsx`): Pattern for Settings navigation rows

### Established Patterns
- Supabase Storage: `avatars` bucket exists with `{userId}/avatar.jpg` path pattern — video bucket follows same approach
- `expo-image-picker`: Already installed (v55.0.11) — supports video capture via `launchCameraAsync` and `launchImageLibraryAsync` with `mediaTypes: 'videos'`
- Offline-first writes: workoutStore uses MMKV persistence with background Supabase sync — video upload queue should follow same pattern
- Zustand + MMKV stores: All feature stores (workout, plan, history, bodyMeasurement) follow identical pattern
- Tap-to-expand for edit/delete: Used in body metrics history items (Phase 7)
- Ionicons for all UI icons (`@expo/vector-icons`)

### Integration Points
- `set_logs` table: Needs `video_url` column (nullable) for video association
- `workoutStore`: Needs video attachment/upload queue logic
- Settings screen (`app/(app)/(tabs)/settings.tsx`): New "My Videos" navigation row
- New route: `app/(app)/videos.tsx` for the gallery screen
- History session detail (`app/(app)/history/[sessionId].tsx`): Video badge on list, thumbnails on SetRow

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-feature-to-add-and-save-videos-of-a-certain-set-can-be-viewed-in-history-and-in-seperate-tab-in-settings*
*Context gathered: 2026-03-12*
