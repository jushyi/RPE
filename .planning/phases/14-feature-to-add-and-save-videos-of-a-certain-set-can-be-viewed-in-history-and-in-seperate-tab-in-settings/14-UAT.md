---
status: issues_found
phase: 14
source: 14-VERIFICATION.md
started: 2026-03-12
completed: 2026-03-12
---

# Phase 14 UAT: Set Videos

## Tests

### Test 1: Video Capture Button on SetCard
**Result: ISSUE**

Two issues found:
1. **Camera button only appears after set is logged** -- should be available BEFORE logging so user can record during the set, then input numbers after.
2. **Camera button not prominent enough** -- currently a small icon in the header row. Should be an inline input field in the `inputRow`, treated like weight/reps/RPE (its own labeled column).

> Clarification (Test 3): The existing video icon/thumbnail in the header should STAY where it is with same state behavior. The inline input is specifically for the capture button.

### Test 2: Video Thumbnail on Set Card
**Result: PASS** (with note: thumbnail positioning should align with inline input layout from Test 1)

### Test 3: Delete Video from Workout Set
**Result: PASS**

### Test 4: Video Thumbnail in History Detail
**Result: PASS**

### Test 5: Video Playback from History
**Result: ISSUE**
Full-screen video player should be **swipe-down dismissable**, not just close-button dismissable.

### Test 6: Videos Tab in Settings
**Result: ISSUE**

Three issues:
1. **Header styling doesn't match** the rest of the app's headers.
2. **Has emojis** in the UI (violates project rule: no emojis in app UI).
3. **Video purpose**: Videos upload to Supabase so users can **free phone storage** while still accessing all their videos. Local copies should be cleaned up after successful upload.

### Test 7: Video Playback from Settings Videos Tab
**Result: PASS** (with same swipe-down dismiss UX needed as Test 5)

### Test 8: Storage Cleanup / Delete from Settings
**Result: ISSUE**
Delete should use **swipe-left-to-delete** pattern consistent with the rest of the app (like SessionExerciseCard), not long-press.

### Test 9: Video Upload Progress & Error Handling
**Result: PASS**

## Summary

total: 9
passed: 5
issues: 4
pending: 0
skipped: 0

---

## Gaps

```yaml
gaps:
  - id: GAP-01
    test: 1
    title: "VideoCaptureButton only available after set is logged"
    severity: major
    root_cause: |
      SetCard.tsx line 127: `{hasLogged.current && loggedSet?.id && (` gates the
      VideoCaptureButton behind logged state. The button requires `loggedSet.id`
      for the upload queue, but the user needs to record BEFORE logging.
    fix: |
      - Show VideoCaptureButton in the inputRow (as a labeled column like Weight/Reps/RPE)
        regardless of logged state.
      - Before the set is logged, store the captured video locally (URI + thumbnail).
      - After `onLog` fires and a `setLogId` is assigned, retroactively enqueue
        the pending video for upload with the new setLogId.
      - Requires adding a `pendingVideo` state to SetCard and a new prop or callback
        pattern to link the video to the set after logging.
    files:
      - src/features/workout/components/SetCard.tsx
      - src/features/videos/components/VideoCaptureButton.tsx
      - src/features/videos/hooks/useVideoCapture.ts

  - id: GAP-02
    test: 1
    title: "VideoCaptureButton not inline with other inputs"
    severity: major
    root_cause: |
      VideoCaptureButton is placed in `setHeaderRight` (line 127-133) as a small
      20px icon alongside the "Logged" badge. It's not treated as an input field.
    fix: |
      - Add a new column in the `inputRow` (after RPE) for the video capture button.
      - Style it like the other input groups: label on top ("Video"), tappable area
        below with the same height/radius as input fields.
      - Use `videocam-outline` icon inside the input-sized button area.
      - When a video is attached, show a small thumbnail or filled icon in that space.
      - Keep the existing header icon/thumbnail for status display (per user clarification).
    files:
      - src/features/workout/components/SetCard.tsx
      - src/features/videos/components/VideoCaptureButton.tsx

  - id: GAP-03
    test: 5, 7
    title: "Video player not swipe-down dismissable"
    severity: minor
    root_cause: |
      VideoPlayerModal in both SetRow.tsx and videos.tsx uses a standard `<Modal>`
      with only a close button (close-circle icon). No gesture handler for swipe dismiss.
    fix: |
      - Wrap the modal content in a PanResponder or use react-native-gesture-handler's
        PanGestureHandler to detect downward swipe.
      - On swipe down past threshold (~100px), animate the modal down and call onClose.
      - Alternative: use `animationType="slide"` with `presentationStyle="pageSheet"`
        which gives native iOS swipe-down dismiss for free. On Android, add a manual
        pan gesture handler.
      - Consider extracting shared VideoPlayerModal to src/features/videos/components/.
    files:
      - src/features/history/components/SetRow.tsx (VideoPlayerModal)
      - app/(app)/videos.tsx (VideoPlayerModal)

  - id: GAP-04
    test: 6
    title: "Videos screen header mismatch and emojis"
    severity: minor
    root_cause: |
      The videos.tsx Stack.Screen uses `title: 'My Videos'` and inherits from the
      (app) layout which sets headerStyle/headerTintColor correctly. The user reports
      the header looks different and has emojis -- needs device investigation.
      The storageHeader inside the screen uses a cloud-outline icon which may render
      as an emoji on some platforms.
    fix: |
      - Verify header rendering on device matches other screens.
      - If the cloud-outline Ionicon renders as an emoji on certain OS versions,
        replace with a different icon or ensure Ionicons font is loaded.
      - Audit the screen for any emoji characters in text strings.
    files:
      - app/(app)/videos.tsx

  - id: GAP-05
    test: 6
    title: "Local video files not cleaned up after upload"
    severity: major
    root_cause: |
      videoUploadQueue.ts copies videos to documents directory (line 31) for
      persistence, but after successful upload (line 97-101), only removes the
      queue entry via `removeFromQueue()` -- does NOT delete the local file copy.
      The user's core requirement: videos upload to Supabase to FREE phone storage.
    fix: |
      - Track the video source (camera vs gallery) in VideoUploadItem type.
      - After successful upload in `flushVideoQueue()`, ONLY delete the local file
        copy if the source was "camera" (app-recorded). Gallery picks must NOT be
        deleted since those are the user's own photos/videos library files.
      - useVideoCapture.ts should tag the result with `source: 'camera' | 'gallery'`
        and propagate through the enqueue path.
      - Delete the documents-dir copy (the queue's persistent copy) in all cases,
        but only delete the original source file when source is "camera".
    files:
      - src/features/videos/utils/videoUploadQueue.ts

  - id: GAP-06
    test: 8
    title: "Videos gallery uses long-press delete instead of swipe-left"
    severity: minor
    root_cause: |
      GalleryItem in videos.tsx uses `onLongPress` (line 82) to trigger an Alert
      for deletion. The app's established pattern is swipe-left-to-delete using
      react-native-gesture-handler's Swipeable (see SessionExerciseCard.tsx).
    fix: |
      - Wrap each GalleryItem in a `<Swipeable>` with `renderRightActions` showing
        a red delete button (matching SessionExerciseCard pattern: 80px wide,
        error background, trash icon + "Delete" text).
      - On swipe open, show Alert confirmation then call deleteVideo.
      - Remove the onLongPress handler.
    files:
      - app/(app)/videos.tsx
```
