---
phase: quick-36
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/videos/components/VideoPlayerModal.tsx
autonomous: true
requirements: [quick-36]
must_haves:
  truths:
    - "No mute button visible in the fullscreen video player"
    - "Close button is positioned in the top-left corner"
    - "Close button sits visually near the native control buttons area"
  artifacts:
    - path: "src/features/videos/components/VideoPlayerModal.tsx"
      provides: "Fullscreen video player modal with corrected button layout"
  key_links: []
---

<objective>
Fix fullscreen video player button layout: remove mute button and reposition close button to top-left.

Purpose: The mute button overlaps with the close button in the top-right, creating a confusing UI. The mute button is unnecessary, and the close button should be in the top-left next to the other native control buttons.
Output: Updated VideoPlayerModal with clean button positioning.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/videos/components/VideoPlayerModal.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix video player button layout</name>
  <files>src/features/videos/components/VideoPlayerModal.tsx</files>
  <action>
    In VideoPlayerModal.tsx, make these changes:

    1. **Remove mute button**: On the VideoView component, add the `allowsVideoFrameAnalysis={false}` prop if available, but more importantly add `showsTimecodes={false}` — however the key fix is to set `nativeControls={false}` to disable ALL native controls (which includes the mute button). Then build custom minimal controls if needed, OR keep `nativeControls` enabled and just reposition the close button to not conflict.

    PREFERRED APPROACH: Keep `nativeControls` enabled (for play/pause/seek) but the mute button is part of expo-video's native controls and cannot be selectively hidden. Since the user explicitly does not want a mute button, the best approach is:
    - Set `nativeControls={false}` on VideoView to remove all native overlay buttons including mute
    - The video will still be playable (it auto-plays via `p.play()`)
    - Add a simple tap-to-toggle-play if desired, but since videos are short set recordings, auto-play without controls is acceptable
    - If the user misses play/pause, this can be iterated on later

    ACTUALLY — expo-video on iOS with pageSheet presentation shows native iOS video controls. The "mute" button is likely the native volume/airplay button. A simpler fix: keep `nativeControls` but move the close button to top-LEFT so it does not stack on top of the native mute/volume button in the top-right.

    FINAL APPROACH (simplest, addresses both issues):
    - Move the close button from `top: 50, right: 20` to `top: 50, left: 20` (top-left corner)
    - Set `allowsVideoFrameAnalysis={false}` on VideoView (removes the Live Text button if present)
    - To remove the mute button: pass `showsTimecodes={false}` and `allowsPictureInPicture={false}` to reduce native chrome, but the mute button specifically requires setting `nativeControls={false}`
    - Set `nativeControls={false}` to remove the mute button entirely. Replace with a simple Pressable overlay that toggles play/pause on tap (player.playing ? player.pause() : player.play()). This gives a clean fullscreen view with just the close button in the top-left.

    2. **Update closeButton style**: Change `right: 20` to `left: 20` in the StyleSheet.

    3. **Add tap-to-play/pause**: Wrap the VideoView area in a Pressable that calls `player.playing ? player.pause() : player.play()` on press. This replaces the lost native play/pause control.

    4. **Update the fallback (no ExpoVideo) close button** to also use `left: 20` instead of `right: 20`.

    Summary of style changes:
    - closeButton: `{ position: 'absolute', top: 50, left: 20, zIndex: 10 }`
    - VideoView: remove `nativeControls` prop (or set `nativeControls={false}`)
    - Add a Pressable wrapper around the video area for tap-to-toggle play/pause
  </action>
  <verify>
    <automated>cd C:/Users/maser/Projects/Gym-App && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
    - Mute button no longer appears in fullscreen video player (nativeControls disabled)
    - Close button is positioned in the top-left corner (left: 20)
    - Tap anywhere on video toggles play/pause as replacement for native controls
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- Open the app, navigate to a video, tap to play fullscreen
- Confirm no mute button is visible
- Confirm close button is in the top-left
- Confirm tapping the video toggles play/pause
</verification>

<success_criteria>
- No mute button in fullscreen video player
- Close button positioned top-left
- Video playback still functional (auto-plays, tap to pause/resume)
</success_criteria>

<output>
After completion, create `.planning/quick/36-the-video-playback-fullscreen-looks-a-li/36-SUMMARY.md`
</output>
