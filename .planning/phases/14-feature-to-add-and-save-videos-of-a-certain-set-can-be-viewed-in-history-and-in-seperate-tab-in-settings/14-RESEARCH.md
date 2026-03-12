# Phase 14: Set Videos - Research

**Researched:** 2026-03-12
**Domain:** Video capture, upload, storage, playback, and thumbnail generation in React Native / Expo SDK 55
**Confidence:** HIGH

## Summary

This phase adds per-set video recording/upload to workouts, video thumbnails in history, fullscreen native playback, and a "My Videos" gallery in Settings. The project already has `expo-image-picker` (v55.0.11) installed which supports video capture and gallery selection. For playback, `expo-video` is the current standard (replaces deprecated `expo-av` removed in SDK 55). For thumbnails, `expo-video-thumbnails` still works in SDK 55 but is deprecated in favor of `expo-video`'s built-in `generateThumbnailsAsync` -- either approach works but `expo-video-thumbnails` is simpler since it does not require a VideoPlayer instance. Videos are stored in Supabase Storage following the existing `avatars` bucket pattern.

The existing codebase provides strong patterns to follow: `ProfilePhotoPicker` for camera/gallery picker UI, `uploadProfilePhoto` in `useAuth.ts` for Supabase Storage upload via fetch+blob, and `useSyncQueue` for offline-first background operations. The `set_logs` table needs a `video_url` nullable column via migration.

**Primary recommendation:** Use `expo-image-picker` for capture/selection (already installed), `expo-video` for playback with native controls, `expo-video-thumbnails` for thumbnail generation, and Supabase Storage with a `set-videos` bucket using the existing fetch-blob upload pattern. Video upload queue should extend the existing MMKV-backed sync queue pattern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Camera button on each SetCard (per-set granularity)
- Both record in-app and choose from gallery options
- Max video duration: 2 minutes
- Videos stored in Supabase Storage (new `set-videos` bucket)
- Background upload starts immediately after recording (offline-first pattern -- queue if no network)
- One video per set (1:1 mapping on set_logs)
- User can replace (re-record/re-upload) or delete an attached video
- Small video thumbnail with play icon overlay on each SetRow that has a video
- Tap thumbnail opens fullscreen native video player (system player, not custom)
- Single video view only -- no swipeable gallery between session videos
- Small camera/video icon badge on session list cards that contain at least one video
- Videos deletable from history detail screen (tap video -> delete option)
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

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-image-picker | ~55.0.11 | Video capture + gallery selection | Already installed; supports `mediaTypes: ['videos']`, `videoMaxDuration`, camera and library |
| expo-video | ~55.0.10 | Video playback with native controls | Replaces deprecated expo-av; provides VideoView + useVideoPlayer with fullscreen support |
| expo-video-thumbnails | ~55.0.x | Generate thumbnail images from video files | Simpler API than expo-video's generateThumbnailsAsync (no VideoPlayer instance needed) |
| expo-file-system | ~55.0.10 | Read video file as base64 for Supabase upload | Already installed; needed for base64 conversion before upload |
| base64-arraybuffer | ^1.0.2 | Convert base64 string to ArrayBuffer for Supabase Storage | Required for React Native uploads -- Blob/File objects do not work reliably |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | ^2.99.0 | Storage API for upload/download/delete | Already installed; storage.from('set-videos') |
| react-native-mmkv | ^4.2.0 | Persist video upload queue offline | Already installed; extend existing sync queue pattern |
| @react-native-community/netinfo | 11.5.2 | Detect connectivity for upload retry | Already installed; used by existing useSyncQueue |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-video-thumbnails | expo-video generateThumbnailsAsync | expo-video's version requires VideoPlayer instance; thumbnails lib is simpler for static thumbnail generation. Thumbnails lib deprecated in SDK 56, but fine for SDK 55 |
| Supabase signed URLs | Supabase public URLs | Signed URLs add security but require refresh logic; public bucket is simpler for a personal/friends app. Recommend public bucket with user-scoped paths |
| fetch+blob upload | base64-arraybuffer decode | The existing codebase uses fetch+blob for avatar uploads and it works. base64-arraybuffer is the officially recommended approach for React Native. Either works -- recommend base64-arraybuffer for video (larger files, more reliable) |

**Installation:**
```bash
npx expo install expo-video expo-video-thumbnails
npm install base64-arraybuffer
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  features/
    videos/
      hooks/
        useVideoCapture.ts      # Camera/gallery picker logic
        useVideoUpload.ts       # Upload to Supabase Storage + queue
        useVideoGallery.ts      # Fetch all user videos for gallery screen
      utils/
        videoUploadQueue.ts     # MMKV-backed upload queue (extends sync queue pattern)
        thumbnailCache.ts       # Local thumbnail URI cache in MMKV
      components/
        VideoThumbnail.tsx      # Thumbnail with play icon overlay (used in SetRow + gallery)
        VideoCaptureButton.tsx  # Camera icon button for SetCard
      types.ts                  # VideoAttachment interface
app/
  (app)/
    videos.tsx                  # "My Videos" gallery screen (stack route)
supabase/
  migrations/
    20260317000000_add_video_url_to_set_logs.sql
    20260317000001_create_set_videos_bucket.sql
```

### Pattern 1: Video Capture Flow
**What:** Camera button on SetCard triggers Alert with "Record Video" / "Choose from Gallery" options (matching ProfilePhotoPicker pattern)
**When to use:** When user taps camera icon on a set card during active workout
**Example:**
```typescript
// Source: existing ProfilePhotoPicker pattern + expo-image-picker docs
import * as ImagePicker from 'expo-image-picker';

async function captureVideo(): Promise<string | null> {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync();
  if (!granted) {
    Alert.alert('Permission Required', 'Camera access is needed to record set videos.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['videos'],
    videoMaxDuration: 120, // 2 minutes
    videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    allowsEditing: true,
  });
  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

async function pickVideoFromGallery(): Promise<string | null> {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!granted) {
    Alert.alert('Permission Required', 'Gallery access is needed to select videos.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    videoMaxDuration: 120,
    allowsEditing: true,
  });
  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}
```

### Pattern 2: Supabase Storage Upload (React Native)
**What:** Read video as base64, convert to ArrayBuffer, upload to Supabase Storage
**When to use:** After video is captured/selected, upload in background
**Example:**
```typescript
// Source: Supabase official blog + existing useAuth.ts pattern
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase/client';

async function uploadSetVideo(
  userId: string,
  setLogId: string,
  localUri: string
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const filePath = `${userId}/${setLogId}.mp4`;

  const { error } = await supabase.storage
    .from('set-videos')
    .upload(filePath, decode(base64), {
      contentType: 'video/mp4',
      upsert: true, // allows replace
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('set-videos')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
```

### Pattern 3: Video Playback with expo-video
**What:** Tap thumbnail opens fullscreen native player
**When to use:** In history detail when user taps a video thumbnail
**Example:**
```typescript
// Source: expo-video official docs
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRef } from 'react';

function VideoPlayback({ videoUrl }: { videoUrl: string }) {
  const ref = useRef<VideoView>(null);
  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = false;
  });

  return (
    <VideoView
      ref={ref}
      player={player}
      style={{ width: '100%', aspectRatio: 16 / 9 }}
      nativeControls={true}
      contentFit="contain"
    />
  );
}

// For fullscreen on tap:
// ref.current?.enterFullscreen();
```

### Pattern 4: Thumbnail Generation
**What:** Extract first frame of video for thumbnail display
**When to use:** After video capture, before/during upload, cache locally
**Example:**
```typescript
// Source: expo-video-thumbnails official docs
import * as VideoThumbnails from 'expo-video-thumbnails';

async function generateThumbnail(videoUri: string): Promise<string> {
  const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
    time: 500, // 500ms into video
    quality: 0.5,
  });
  return uri;
}
```

### Pattern 5: Video Upload Queue (Offline-First)
**What:** MMKV-backed queue for video uploads, flush when online
**When to use:** Video captured during workout; upload may fail if offline
**Example:**
```typescript
// Source: existing useSyncQueue.ts pattern
import { createMMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';

const videoQueueStorage = createMMKV({ id: 'video-upload-queue' });

interface VideoUploadItem {
  setLogId: string;
  userId: string;
  localUri: string;
  thumbnailUri: string;
  createdAt: string;
}

function enqueueVideoUpload(item: VideoUploadItem): void {
  const queue = getVideoQueue();
  queue.push(item);
  videoQueueStorage.set('pending', JSON.stringify(queue));
}

async function flushVideoQueue(): Promise<void> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  const queue = getVideoQueue();
  const failed: VideoUploadItem[] = [];

  for (const item of queue) {
    try {
      const publicUrl = await uploadSetVideo(item.userId, item.setLogId, item.localUri);
      // Update set_logs.video_url in Supabase
      await supabase.from('set_logs').update({ video_url: publicUrl }).eq('id', item.setLogId);
    } catch {
      failed.push(item);
    }
  }
  videoQueueStorage.set('pending', JSON.stringify(failed));
}
```

### Anti-Patterns to Avoid
- **Using Blob/File directly for Supabase uploads in React Native:** These do not work reliably. Always convert to ArrayBuffer via base64-arraybuffer decode.
- **Storing video files in MMKV or AsyncStorage:** These are for small key-value data. Video files stay in the file system; only URIs go in the queue.
- **Building a custom video player:** Use expo-video's VideoView with `nativeControls={true}` and fullscreen. The system player handles all edge cases.
- **Synchronous video upload in workout flow:** Never block the workout UI waiting for upload. Capture locally, queue upload, return immediately.
- **Fetching all video blobs for gallery listing:** Gallery should query set_logs for video_url metadata, not download actual video files. Only stream on playback.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video recording UI | Custom camera view | expo-image-picker launchCameraAsync | System camera handles permissions, recording indicators, duration limits, format encoding |
| Video playback | Custom player controls | expo-video VideoView with nativeControls | Native player handles buffering, seeking, fullscreen, PiP, hardware acceleration |
| Thumbnail extraction | Manual frame extraction | expo-video-thumbnails getThumbnailAsync | Handles video format decoding, frame seeking, image output |
| File format conversion | MP4/MOV transcoding | expo-image-picker videoExportPreset | iOS returns MOV by default; export preset handles conversion |
| Upload retry logic | Custom retry with exponential backoff | MMKV queue + NetInfo listener | Same pattern as existing sync queue; fires on connectivity restore |

**Key insight:** Video handling has enormous edge cases (formats, codecs, permissions, memory). Every layer (capture, thumbnail, playback, upload) should use a purpose-built library.

## Common Pitfalls

### Pitfall 1: iOS Returns .MOV, Not .MP4
**What goes wrong:** expo-image-picker on iOS returns videos in .MOV format regardless of original format
**Why it happens:** iOS native video APIs default to QuickTime (.MOV) container
**How to avoid:** Either accept .MOV (Supabase Storage handles it fine, contentType: 'video/quicktime') or use `videoExportPreset` to force H.264 output. Simpler to accept both formats and set contentType dynamically based on file extension.
**Warning signs:** Videos uploaded from iOS won't play on some Android devices if contentType is wrong

### Pitfall 2: Large File Base64 Memory Pressure
**What goes wrong:** Reading a 2-minute video as base64 can use significant memory (a 100MB video becomes ~133MB base64 string)
**Why it happens:** Base64 encoding adds ~33% overhead; string held in JS memory
**How to avoid:** Use `videoQuality: Medium` (not High/Highest) to keep files under ~50MB. The 2-minute limit also helps. Consider chunked upload for very large files, but Medium quality + 2 min should stay under 30MB.
**Warning signs:** App crashes on low-memory devices during upload

### Pitfall 3: Video URL Column Must Be Nullable
**What goes wrong:** Making video_url NOT NULL breaks all existing set_logs inserts
**Why it happens:** Migration adds column to existing table with existing data
**How to avoid:** `ALTER TABLE set_logs ADD COLUMN video_url TEXT;` -- nullable by default, no DEFAULT needed
**Warning signs:** All workout logging breaks after migration

### Pitfall 4: Stale Thumbnails After Video Replace
**What goes wrong:** User replaces a video but old thumbnail shows from cache
**Why it happens:** Thumbnail was generated from previous video and cached locally
**How to avoid:** Invalidate thumbnail cache entry when video is replaced. Use setLogId as cache key; overwrite on re-capture.
**Warning signs:** Thumbnail doesn't match actual video content

### Pitfall 5: Supabase Storage RLS Configuration
**What goes wrong:** Upload succeeds but download returns 403
**Why it happens:** Storage bucket RLS policies not configured for authenticated reads
**How to avoid:** Create bucket as public (simplest for this use case -- friend group app, no sensitive content). Path pattern `{userId}/{setLogId}.mp4` provides logical isolation. Alternatively, use authenticated bucket with proper SELECT/INSERT/DELETE policies.
**Warning signs:** Videos play in development but fail in production

### Pitfall 6: Upload Queue Items Reference Stale Local URIs
**What goes wrong:** Video queued for upload offline, but local file URI becomes invalid after app restart
**Why it happens:** expo-image-picker stores files in cache directory which can be cleaned
**How to avoid:** Copy video to app's document directory immediately after capture (using expo-file-system copyAsync). Queue references the persistent copy.
**Warning signs:** Queued uploads fail with "file not found" after app restart

## Code Examples

### Database Migration: Add video_url to set_logs
```sql
-- Migration: 20260317000000_add_video_url_to_set_logs.sql
ALTER TABLE public.set_logs
  ADD COLUMN video_url TEXT;

-- Index for gallery queries (find all sets with videos for a user)
CREATE INDEX idx_set_logs_video_url
  ON public.set_logs(session_exercise_id)
  WHERE video_url IS NOT NULL;
```

### Supabase Storage Bucket Setup (via Dashboard or SQL)
```sql
-- Create public bucket for set videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('set-videos', 'set-videos', true);

-- RLS: Only authenticated users can upload to their own folder
CREATE POLICY "Users can upload own videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'set-videos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- RLS: Anyone can read (public bucket)
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'set-videos');

-- RLS: Users can delete own videos
CREATE POLICY "Users can delete own videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'set-videos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- RLS: Users can update (replace) own videos
CREATE POLICY "Users can update own videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'set-videos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );
```

### Gallery Query: Fetch Videos with Context
```typescript
// Fetch all set_logs that have videos, with exercise name and session date
const { data } = await supabase
  .from('set_logs')
  .select(`
    id,
    video_url,
    set_number,
    weight,
    reps,
    unit,
    logged_at,
    session_exercises!inner(
      exercises!inner(name),
      workout_sessions!inner(started_at, ended_at)
    )
  `)
  .not('video_url', 'is', null)
  .order('logged_at', { ascending: false });
```

### Storage Usage Calculation
```typescript
// Get total storage used by user's videos
async function getStorageUsage(userId: string): Promise<{ count: number; totalMB: number }> {
  const { data, error } = await supabase.storage
    .from('set-videos')
    .list(userId);

  if (error || !data) return { count: 0, totalMB: 0 };

  const totalBytes = data.reduce((sum, file) => sum + (file.metadata?.size ?? 0), 0);
  return {
    count: data.length,
    totalMB: Math.round(totalBytes / (1024 * 1024) * 10) / 10,
  };
}
```

### VideoThumbnail Component Pattern
```typescript
import { Image, Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface VideoThumbnailProps {
  thumbnailUri: string;
  onPress: () => void;
  size?: number;
}

function VideoThumbnail({ thumbnailUri, onPress, size = 48 }: VideoThumbnailProps) {
  return (
    <Pressable onPress={onPress} style={[s.container, { width: size, height: size }]}>
      <Image source={{ uri: thumbnailUri }} style={s.image} resizeMode="cover" />
      <View style={s.overlay}>
        <Ionicons name="play-circle" size={size * 0.5} color="rgba(255,255,255,0.9)" />
      </View>
    </Pressable>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| expo-av for video playback | expo-video | SDK 55 (expo-av removed) | Must use expo-video; expo-av not available |
| expo-video-thumbnails (standalone) | expo-video generateThumbnailsAsync | SDK 55+ (deprecated, removed in 56) | expo-video-thumbnails still works in SDK 55 but will be removed in SDK 56 |
| MediaTypeOptions.Videos enum | mediaTypes: ['videos'] string array | SDK 55 | Old enum deprecated; use string array |
| Blob/File upload in React Native | base64-arraybuffer decode | 2024+ | Blob uploads unreliable in RN; ArrayBuffer is official recommendation |

**Deprecated/outdated:**
- `expo-av`: Removed in SDK 55. Do not use.
- `ImagePicker.MediaTypeOptions`: Deprecated. Use `mediaTypes: ['videos']` string array instead.
- `expo-video-thumbnails`: Still works in SDK 55 but deprecated. Will be removed in SDK 56. Fine to use now.

## Discretion Recommendations

### Video Compression/Quality
**Recommendation:** Use `UIImagePickerControllerQualityType.Medium` for camera recordings and leave gallery selections as-is. Medium quality keeps 2-minute videos under ~30MB while maintaining acceptable visual quality for form-check purposes.

### Thumbnail Generation
**Recommendation:** Local frame extraction using `expo-video-thumbnails.getThumbnailAsync()`. It is simpler than expo-video's approach (no VideoPlayer instance needed), works with local URIs (before upload), and can generate immediately after capture. Cache thumbnail URIs in MMKV keyed by setLogId.

### Upload Retry/Queue
**Recommendation:** Separate MMKV instance (`video-upload-queue`) from existing sync queue. Video uploads are large and slow -- mixing them with the fast data sync queue could block set_log inserts. Queue structure: `{ setLogId, userId, localUri, thumbnailUri, createdAt }`. Flush on NetInfo connectivity change (same pattern as useSyncQueue). Copy captured video to documents directory immediately to prevent cache eviction.

### Camera UI
**Recommendation:** Use system camera via expo-image-picker (no custom camera UI). Add a small `videocam-outline` Ionicons button to SetCard header row, next to the delete button. Show upload progress indicator (small spinner or progress bar) on the set card after recording.

### Supabase Storage Bucket
**Recommendation:** Public bucket with user-scoped paths (`{userId}/{setLogId}.mp4`). This app is for a friends group -- public URLs are simpler (no signed URL refresh logic). RLS policies still restrict upload/delete to the owning user. Path pattern matches existing avatars bucket convention.

## Open Questions

1. **Supabase Storage file size limit**
   - What we know: Supabase free tier has a default 50MB file size limit per upload
   - What's unclear: Whether the project's Supabase plan has a higher limit configured
   - Recommendation: Medium quality + 2-min limit should keep files under 30MB. Add client-side file size check before upload with user-friendly error if exceeded.

2. **iOS .MOV vs .MP4 handling**
   - What we know: iOS returns .MOV from camera, Android returns .MP4
   - What's unclear: Whether to convert or accept both formats
   - Recommendation: Accept both. Store with original extension. Set contentType dynamically. Both formats play fine on both platforms via expo-video.

3. **Video deletion cascade**
   - What we know: Deleting a set_log row should also delete the video from Storage
   - What's unclear: Whether to handle this client-side or via database trigger
   - Recommendation: Client-side deletion (delete from Storage, then null out video_url or delete set_log). Simpler than database triggers for a small app.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 55 |
| Config file | package.json jest section |
| Quick run command | `npx jest --bail` |
| Full suite command | `npx jest` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VID-01 | Video capture returns URI | unit (mock) | `npx jest tests/videos/useVideoCapture.test.ts -x` | No - Wave 0 |
| VID-02 | Upload queue enqueue/dequeue | unit | `npx jest tests/videos/videoUploadQueue.test.ts -x` | No - Wave 0 |
| VID-03 | video_url added to set_logs type | unit | `npx jest tests/videos/types.test.ts -x` | No - Wave 0 |
| VID-04 | Gallery query returns videos with context | unit (mock) | `npx jest tests/videos/useVideoGallery.test.ts -x` | No - Wave 0 |
| VID-05 | Storage usage calculation | unit | `npx jest tests/videos/storageUsage.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --bail`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/videos/videoUploadQueue.test.ts` -- covers VID-02
- [ ] `tests/videos/useVideoCapture.test.ts` -- covers VID-01 (mocked ImagePicker)
- [ ] Framework install: `npx expo install expo-video expo-video-thumbnails && npm install base64-arraybuffer` -- new dependencies

## Sources

### Primary (HIGH confidence)
- [expo-image-picker docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) - video mediaTypes, videoMaxDuration, videoQuality options
- [expo-video docs](https://docs.expo.dev/versions/latest/sdk/video/) - VideoView component, useVideoPlayer hook, fullscreen API
- [expo-video-thumbnails docs](https://docs.expo.dev/versions/latest/sdk/video-thumbnails/) - getThumbnailAsync API, deprecation notice
- [Supabase React Native Storage blog](https://supabase.com/blog/react-native-storage) - base64-arraybuffer upload pattern, RLS policies
- [Supabase Storage upload docs](https://supabase.com/docs/reference/javascript/storage-from-upload) - upload method signature
- Existing codebase: `ProfilePhotoPicker.tsx`, `useAuth.ts` uploadProfilePhoto, `useSyncQueue.ts`

### Secondary (MEDIUM confidence)
- [expo-image-picker iOS .MOV issue](https://github.com/expo/expo/issues/29918) - iOS returns .MOV format
- [Supabase video uploads discussion](https://github.com/orgs/supabase/discussions/36752) - React Native video upload patterns

### Tertiary (LOW confidence)
- Storage file size limits may vary by Supabase plan -- needs validation against project's actual configuration

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries verified via official docs, expo-image-picker already installed
- Architecture: HIGH - follows established codebase patterns (sync queue, storage upload, settings navigation)
- Pitfalls: HIGH - iOS .MOV behavior, base64 memory, and RLS issues well-documented in official sources and community
- Video playback: HIGH - expo-video is the current standard, verified in SDK 55 docs

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- Expo SDK 55 is current)
