# Phase 17: Friend Workout, PR and Set Video Sharing - Research

**Researched:** 2026-03-12
**Domain:** Social sharing (friendships, groups, feed), Supabase RLS, Expo React Native
**Confidence:** HIGH

## Summary

Phase 17 adds a social layer to the gym app: friend connections (via invite codes and handle search), group creation, and a card-based feed for sharing workout summaries, PR achievements, and set videos to groups. The app already has the foundational patterns needed -- invite code generation/redemption from Phase 13 coaching, push notification delivery via the send-push Edge Function, video storage references from Phase 14, and card-based UI throughout.

The primary technical challenges are: (1) designing the database schema for friendships, groups, shared items, and reactions with correct RLS policies that scope data to group membership, (2) adding a `handle` field to user profiles with uniqueness enforcement and search capability, (3) building a group feed with pagination, and (4) integrating a share prompt into the existing workout summary screen.

**Primary recommendation:** Follow the established Zustand + MMKV + Supabase pattern. Create new `friendshipStore` and `socialStore` stores. Reuse the invite code generation pattern from coaching. Build the group feed as a new tab or accessible screen with cursor-based pagination. The share prompt slots into the existing `summary.tsx` screen between the PR section and the Done button.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two connection methods: invite codes (reuse Phase 13 pattern) AND username/handle search
- Mutual friendships: friend request must be accepted by both parties
- Friendships are separate from coaching relationships (independent connection types)
- New `handle` field on user profiles: unique, searchable username
- Handle setup in Settings profile section AND added to onboarding flow
- Either side can unfriend unilaterally
- Anyone can create a group and manage its membership (add/remove friends)
- All sharing goes through groups only (no direct friend-to-friend shares)
- To share with one person, create a 2-person group
- Group has a shared feed: all members see each other's shared content
- User picks which group(s) to share to each time (per-share targeting)
- Three shareable content types: workout summaries, PR achievements, set videos
- Share prompt appears after finishing a workout (on completion screen)
- User picks content to share (summary, PRs from session, videos) and target group(s)
- Card-based reverse-chronological timeline feed per group
- Workout cards show summary only: exercise names, total sets, total volume, duration
- Tap card to see full breakdown (navigates to detail)
- PR cards show exercise name and new PR weight/reps
- Video cards show inline thumbnail with tap-to-play
- Group members can add emoji reactions to shared items (fire, muscle, clap, etc.)
- Reaction counts visible on each card
- Push notification for every share to group members (uses existing Phase 13 push infra)
- Per-group mute toggle to silence notifications from a specific group
- Users can leave any group at any time
- Body metrics are NEVER shared
- Shared content only visible to group members

### Claude's Discretion
- Invite code format for friend requests (can differ from coaching codes)
- Friend request UI/UX flow details
- Handle validation rules (length, characters, uniqueness check)
- Group feed pagination/loading strategy
- Emoji reaction set and UI implementation
- Share prompt UI layout on workout completion screen
- Database schema for friendships, groups, group_members, shared_items, reactions tables
- RLS policies for group-scoped data access
- How shared videos reference existing Supabase Storage URLs (no re-upload)

### Deferred Ideas (OUT OF SCOPE)
- Group chat/messaging -- future phase (Phase 18)
- Granular per-group content controls (share workouts but not PRs to specific groups)
- Sharing from history retroactively (currently only prompt after workout completion)
</user_constraints>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.99.0 | Database, RLS, Edge Functions | Already project standard |
| zustand | ^5.0.11 | State management (friendshipStore, socialStore) | Established project pattern |
| react-native-mmkv | ^4.2.0 | Persistent local cache | Established project pattern |
| expo-router | ^55.0.4 | Navigation for new screens/tabs | Established project pattern |
| expo-notifications | ~55.0.11 | Push notification delivery | Already used in Phase 13 |
| expo-clipboard | ~55.0.8 | Copy invite codes | Already used in Phase 13 |
| Ionicons | via @expo/vector-icons | All UI icons | Project convention |

### No New Dependencies Required

This phase builds entirely on the existing stack. No new npm packages needed.

## Architecture Patterns

### Recommended Feature Structure
```
src/features/social/
  types.ts              # Friendship, Group, SharedItem, Reaction types
  hooks/
    useFriendships.ts   # Friend connections (invite code + handle search)
    useGroups.ts        # Group CRUD, membership management
    useFeed.ts          # Group feed with pagination
    useShareFlow.ts     # Share prompt logic (select content + target groups)
    useReactions.ts     # Add/remove reactions on shared items
  components/
    FriendRequestCard.tsx
    FriendListItem.tsx
    GroupCard.tsx
    GroupFeedScreen.tsx
    SharedWorkoutCard.tsx
    SharedPRCard.tsx
    SharedVideoCard.tsx
    ReactionBar.tsx
    SharePrompt.tsx     # Bottom sheet on workout summary
    HandleSetup.tsx     # Reusable for settings + onboarding
  utils/
    friendInviteCode.ts # Can reuse coaching inviteCode.ts pattern directly
    notifyGroup.ts      # Send push to group members

src/stores/
  friendshipStore.ts    # Friends list, friend requests
  socialStore.ts        # Groups, feed cache, reactions
```

### Pattern 1: Database Schema

**Confidence: HIGH** -- follows established patterns from coaching migration.

```sql
-- 1. Add handle to profiles
ALTER TABLE public.profiles ADD COLUMN handle TEXT UNIQUE;
CREATE INDEX idx_profiles_handle ON public.profiles (handle);

-- Allow anyone to search profiles by handle (read-only, limited fields)
CREATE POLICY "Anyone can search profiles by handle"
  ON public.profiles FOR SELECT
  USING (handle IS NOT NULL);

-- 2. Friend requests (mutual acceptance required)
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id),
  CHECK(sender_id != receiver_id)
);

-- 3. Friendships (created when request accepted)
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b),
  CHECK(user_a < user_b)  -- canonical ordering prevents duplicate pairs
);

-- 4. Groups
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Group members
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 6. Shared items
CREATE TABLE public.shared_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('workout', 'pr', 'video')),
  -- Polymorphic payload: JSON blob with type-specific fields
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_shared_items_group_created ON public.shared_items (group_id, created_at DESC);

-- 7. Reactions
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_item_id UUID NOT NULL REFERENCES public.shared_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shared_item_id, user_id, emoji)  -- one reaction type per user per item
);
```

### Pattern 2: RLS for Group-Scoped Access

**Confidence: HIGH** -- follows coaching is_coach_of() pattern with a group membership check function.

```sql
-- Helper function: is user a member of group?
CREATE OR REPLACE FUNCTION public.is_group_member(target_group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = target_group_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Groups: members can view
CREATE POLICY "Members can view group"
  ON public.groups FOR SELECT
  USING (public.is_group_member(id));

-- Group members: members can view all members
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id));

-- Shared items: members can view, author can insert
CREATE POLICY "Members can view shared items"
  ON public.shared_items FOR SELECT
  USING (public.is_group_member(group_id));

CREATE POLICY "Members can insert shared items"
  ON public.shared_items FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_group_member(group_id));

-- Reactions: members can add/view/remove
CREATE POLICY "Members can view reactions"
  ON public.reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_items si
      WHERE si.id = reactions.shared_item_id
      AND public.is_group_member(si.group_id)
    )
  );
```

### Pattern 3: Friendship Canonical Ordering

**What:** Store friendships with `user_a < user_b` constraint to prevent duplicate pairs (A,B) and (B,A).
**When to use:** Always when inserting friendships.
**Example:**
```typescript
const [userA, userB] = [userId, friendId].sort();
await supabase.from('friendships').insert({ user_a: userA, user_b: userB });
```

### Pattern 4: Share Prompt on Workout Completion

**What:** After workout finishes, show a share prompt section on the summary screen (before Done button).
**Integration point:** `app/(app)/workout/summary.tsx` -- add SharePrompt component between PR section and Done button.
**Data available:** The `session` object already contains all exercises, sets, PR flags, and video URLs.

```typescript
// SharePrompt receives the completed session and extracts shareable content
<SharePrompt
  session={session}
  prs={prExercises}    // Already computed in summary.tsx
  onShare={handleShare}
  onSkip={() => {}}     // Just proceed to Done
/>
```

### Pattern 5: Feed Pagination (Cursor-Based)

**What:** Load group feed in pages of ~20 items, using `created_at` as cursor.
**Why cursor over offset:** More reliable with real-time inserts; Supabase `.lt()` on created_at is efficient with the index.

```typescript
const loadFeed = async (groupId: string, cursor?: string) => {
  let query = supabase
    .from('shared_items')
    .select('*, profiles!user_id(display_name, avatar_url, handle)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  return query;
};
```

### Pattern 6: Shared Video References (No Re-upload)

**What:** When sharing a set video, the `shared_items.payload` stores the existing `video_url` from `set_logs`. No re-upload needed.
**Payload example:**
```json
{
  "content_type": "video",
  "payload": {
    "video_url": "https://xyz.supabase.co/storage/v1/object/set-videos/...",
    "exercise_name": "Bench Press",
    "weight": 225,
    "reps": 5,
    "unit": "lbs",
    "set_number": 3
  }
}
```

The video is already in Supabase Storage from Phase 14. The shared item just references its URL. RLS on shared_items controls who can see the reference. The Storage bucket itself already has policies allowing authenticated reads.

### Anti-Patterns to Avoid
- **Separate tables per content type:** Do NOT create shared_workouts, shared_prs, shared_videos tables. Use a single shared_items table with content_type discriminator and JSONB payload.
- **Friend-to-friend sharing:** All sharing goes through groups. Even 1:1 sharing requires a 2-person group. Do not add a direct share path.
- **Re-uploading videos:** Shared videos reference existing Storage URLs. Do not copy or re-upload video files.
- **Offset pagination:** Avoid `.range(offset, limit)` for feeds. Use cursor-based pagination with `created_at`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Invite codes | New code generator | Reuse `coaching/utils/inviteCode.ts` | Same 6-char unambiguous pattern works for friend invites |
| Push notifications | New notification sender | Reuse `send-push` Edge Function | Already handles multi-recipient, token lookup |
| Handle uniqueness check | Client-side check only | Supabase UNIQUE constraint + real-time validation | Race conditions on client-only check |
| Feed real-time updates | WebSocket subscription | Poll on screen focus + optimistic updates | Complexity of real-time not justified for v1 social feed |
| Video playback | Custom player | Reuse existing `expo-video` Modal player from Phase 14 | Already built and tested |

## Common Pitfalls

### Pitfall 1: Friendship Duplication
**What goes wrong:** Without canonical ordering, (Alice, Bob) and (Bob, Alice) can both exist in the friendships table.
**Why it happens:** Two users can each send friend requests that get accepted.
**How to avoid:** `CHECK(user_a < user_b)` constraint + always sort IDs before insert.
**Warning signs:** Duplicate friend entries in the UI.

### Pitfall 2: RLS Policy Conflicts with Existing Profile Policies
**What goes wrong:** Current profile RLS only allows `auth.uid() = id` for SELECT. Adding handle search requires a new policy that allows reading other users' profiles (limited fields).
**Why it happens:** Phase 1 profile policy is restrictive by design.
**How to avoid:** Add a new SELECT policy: "Anyone can search profiles by handle" that only applies when handle IS NOT NULL. Use a Supabase RPC function for handle search that returns only id, display_name, avatar_url, handle -- never email or other private fields.
**Warning signs:** Handle search returns empty results despite matching handles existing.

### Pitfall 3: Group Creator Auto-Membership
**What goes wrong:** Group creator forgets to add themselves as a member.
**Why it happens:** Creating a group and adding the creator as member are separate DB operations.
**How to avoid:** Use a database trigger or always insert group + group_member in the same client-side transaction.

### Pitfall 4: Notification Spam from Active Groups
**What goes wrong:** Users get overwhelmed by push notifications from busy groups.
**Why it happens:** Every share triggers a notification to every group member.
**How to avoid:** The per-group `muted` boolean on group_members. When sending notifications, filter out muted members server-side in the Edge Function or client-side before calling send-push.

### Pitfall 5: Stale Profile Handle in Search Results
**What goes wrong:** Handle search uses `as any` Supabase pattern, but the profiles table search requires reading other users' profiles which existing RLS blocks.
**Why it happens:** RLS policy on profiles only allows `auth.uid() = id`.
**How to avoid:** Create a Supabase RPC function `search_by_handle(query TEXT)` that uses SECURITY DEFINER to bypass RLS but only returns safe fields (id, display_name, avatar_url, handle). This is safer than loosening the profiles RLS.

### Pitfall 6: Share Prompt Session Data Missing
**What goes wrong:** The share prompt shows no videos because video_url is on set_logs in Supabase, not in the local WorkoutSession object.
**Why it happens:** The local session exercises have video attachment data in the videoStore, but not always the final uploaded URL.
**How to avoid:** The share prompt should check both the local video attachment state and the set_logs.video_url field. For videos still uploading, show them as "uploading" and allow sharing once upload completes. Alternatively, only show sharable videos that have confirmed video_url.

## Code Examples

### Handle Validation Rules (Discretion Area)
```typescript
// Recommended: 3-20 chars, lowercase alphanumeric + underscores, must start with letter
const HANDLE_REGEX = /^[a-z][a-z0-9_]{2,19}$/;

function validateHandle(handle: string): string | null {
  if (!handle) return 'Handle is required';
  if (handle.length < 3) return 'Handle must be at least 3 characters';
  if (handle.length > 20) return 'Handle must be at most 20 characters';
  if (!HANDLE_REGEX.test(handle)) return 'Letters, numbers, and underscores only. Must start with a letter.';
  return null; // valid
}
```

### Emoji Reaction Set (Discretion Area)
```typescript
// Use Ionicons icon names, not emoji characters (per CLAUDE.md: no emojis in UI)
// IMPORTANT: Reactions use icon-based rendering, not emoji characters
const REACTION_ICONS = [
  { key: 'fire', icon: 'flame-outline', label: 'Fire' },
  { key: 'muscle', icon: 'fitness-outline', label: 'Strong' },
  { key: 'clap', icon: 'thumbs-up-outline', label: 'Nice' },
  { key: 'trophy', icon: 'trophy-outline', label: 'Champion' },
  { key: 'heart', icon: 'heart-outline', label: 'Love' },
] as const;
```

**IMPORTANT:** The CLAUDE.md rule says "No emojis in the app UI." Reactions should use Ionicons icon components, NOT emoji characters. The `emoji` column in the reactions table stores a key string (e.g., "fire") that maps to an Ionicons icon name. This is a critical project convention.

### Friend Invite Code (Reuse Coaching Pattern)
```typescript
// The exact same generateInviteCode() function from coaching/utils/inviteCode.ts
// can be reused. The friend_invite_codes table mirrors invite_codes structure.
// Alternatively, use the same invite_codes table with a 'type' column.
// Recommendation: separate table (friend_invite_codes) to avoid coaching confusion.
```

### Notify Group Members on Share
```typescript
import { supabase } from '@/lib/supabase/client';

async function notifyGroupOnShare(
  groupId: string,
  sharerId: string,
  title: string,
  body: string,
) {
  // Get all non-muted group members except the sharer
  const { data: members } = await (supabase.from as any)('group_members')
    .select('user_id, muted')
    .eq('group_id', groupId)
    .neq('user_id', sharerId)
    .eq('muted', false);

  if (!members?.length) return;

  const recipientIds = members.map((m: any) => m.user_id);

  // Reuse existing send-push Edge Function
  await supabase.functions.invoke('send-push', {
    body: {
      recipient_ids: recipientIds,
      title,
      body,
      data: { type: 'group_share', group_id: groupId },
    },
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate tables per share type | JSONB payload in single shared_items table | PostgreSQL JSONB matured | Simpler schema, single query for feed |
| WebSocket for real-time feed | Poll on focus + optimistic UI | Project convention | Avoids real-time subscription complexity |
| Emoji characters in UI | Icon-based reactions | CLAUDE.md project rule | Must use Ionicons, not Unicode emoji |

## Navigation Approach (Discretion Area)

**Recommendation:** Add a new tab "Social" to the bottom tab bar (4 tabs total: Home, Plans, Social, Settings). The Social tab contains:
- Friends list (with add friend button)
- Groups list (with create group button)
- Tap group to see its feed

This is preferred over nesting social features in Settings because social is a primary use case for this phase, not a configuration concern.

Alternative considered: Stack screens accessible from dashboard. Rejected because the feed needs its own persistent tab for quick access.

```
app/(app)/(tabs)/social.tsx    # Social tab root (groups list + friends)
app/(app)/social/
  group-feed.tsx               # Group feed screen (stack)
  create-group.tsx             # Create group screen
  add-friend.tsx               # Friend request screen
  friend-requests.tsx          # Pending requests list
  shared-item-detail.tsx       # Full workout detail when tapping card
```

## Open Questions

1. **Onboarding flow modification**
   - What we know: Handle setup must be added to onboarding (per locked decision)
   - What's unclear: Whether existing users who already completed onboarding need a one-time handle setup prompt
   - Recommendation: Show a handle setup prompt on first launch after update if profile.handle is null. Add as optional step in onboarding for new users.

2. **Profile search RLS approach**
   - What we know: Current RLS only allows self-read. Handle search needs to read other profiles.
   - What's unclear: Whether to add a permissive SELECT policy or use RPC function
   - Recommendation: Use a `search_profiles_by_handle(query TEXT)` RPC function with SECURITY DEFINER that returns only safe fields. This is safer than loosening RLS.

3. **Group admin model**
   - What we know: "Anyone can create a group and manage its membership (add/remove friends)"
   - What's unclear: Whether only the creator can add/remove, or any member can
   - Recommendation: Only the creator (stored as `created_by` on groups table) can add/remove members. Any member can leave. This is simplest.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + jest-expo 55 |
| Config file | jest.config.js (project root) |
| Quick run command | `npx jest --bail --testPathPattern=social` |
| Full suite command | `npx jest --bail` |

### Phase Requirements -> Test Map

Since no formal requirement IDs were specified, test map covers the key behaviors from locked decisions:

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| Handle validation (format, length) | unit | `npx jest tests/social/handleValidation.test.ts -x` | No - Wave 0 |
| Friend invite code generation | unit | `npx jest tests/social/friendInviteCode.test.ts -x` | No - Wave 0 |
| Friendship canonical ordering | unit | `npx jest tests/social/friendship.test.ts -x` | No - Wave 0 |
| Share payload construction | unit | `npx jest tests/social/sharePayload.test.ts -x` | No - Wave 0 |
| Reaction icon mapping | unit | `npx jest tests/social/reactions.test.ts -x` | No - Wave 0 |
| Feed pagination cursor logic | unit | `npx jest tests/social/feedPagination.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --bail --testPathPattern=social`
- **Per wave merge:** `npx jest --bail`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/social/handleValidation.test.ts` -- handle format validation
- [ ] `tests/social/friendInviteCode.test.ts` -- code generation (can reuse coaching test pattern)
- [ ] `tests/social/friendship.test.ts` -- canonical ordering helper
- [ ] `tests/social/sharePayload.test.ts` -- payload construction for each content type
- [ ] `tests/social/reactions.test.ts` -- reaction icon mapping, toggle logic

## Sources

### Primary (HIGH confidence)
- Existing codebase: `coaching/hooks/useCoaching.ts` -- invite code flow pattern
- Existing codebase: `coaching/utils/inviteCode.ts` -- 6-char code generation
- Existing codebase: `supabase/functions/send-push/index.ts` -- push notification delivery
- Existing codebase: `stores/coachingStore.ts` -- Zustand + MMKV persist pattern
- Existing codebase: `supabase/migrations/20260317000002_create_coaching.sql` -- RLS pattern with helper functions
- Existing codebase: `app/(app)/workout/summary.tsx` -- workout completion screen (share prompt integration point)
- Existing codebase: `features/videos/types.ts` -- VideoGalleryItem type for video sharing

### Secondary (MEDIUM confidence)
- Supabase RLS documentation: SECURITY DEFINER functions for cross-user queries
- PostgreSQL JSONB: payload storage for polymorphic shared_items

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing libraries
- Architecture: HIGH -- follows established project patterns closely
- Database schema: HIGH -- mirrors coaching schema patterns with proven RLS approach
- Pitfalls: HIGH -- based on direct codebase analysis of existing RLS and profile policies
- Navigation: MEDIUM -- new Social tab is a recommendation, could alternatively use stack screens

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- no external dependency changes expected)
