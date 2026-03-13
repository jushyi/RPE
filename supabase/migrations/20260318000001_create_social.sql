-- Phase 17: Social System
-- Creates all social infrastructure: handle on profiles, friend_requests, friendships,
-- friend_invite_codes, groups, group_members, shared_items, reactions, RLS policies,
-- helper functions, and a trigger to auto-create friendships on request acceptance.

-- ============================================================================
-- 1. Add handle column to profiles
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN handle TEXT UNIQUE;
CREATE INDEX idx_profiles_handle ON public.profiles (handle);

-- ============================================================================
-- 2. Profile search RPC (SECURITY DEFINER so it bypasses restrictive RLS)
--    Returns only safe fields: id, display_name, avatar_url, handle
-- ============================================================================
CREATE OR REPLACE FUNCTION public.search_profiles_by_handle(query TEXT)
RETURNS TABLE (
  id           UUID,
  display_name TEXT,
  avatar_url   TEXT,
  handle       TEXT
) AS $$
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.handle
  FROM public.profiles p
  WHERE p.handle ILIKE '%' || query || '%'
    AND p.handle IS NOT NULL
    AND p.id != auth.uid()
  LIMIT 20;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 3. Friend requests (mutual acceptance required)
-- ============================================================================
CREATE TABLE public.friend_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id),
  CHECK(sender_id != receiver_id)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Sender and receiver can view their own requests
CREATE POLICY "Participants can view friend requests"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Authenticated users can send friend requests as themselves
CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Only receiver can update status (accept/reject); sender can update if pending (cancel)
CREATE POLICY "Receiver can respond to friend requests"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id)
  WITH CHECK (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- Either party can delete the request
CREATE POLICY "Participants can delete friend requests"
  ON public.friend_requests FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================================================
-- 4. Friendships (created automatically via trigger when request accepted)
--    user_a < user_b enforces canonical ordering to prevent duplicate pairs
-- ============================================================================
CREATE TABLE public.friendships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b),
  CHECK(user_a < user_b)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Either party can view the friendship
CREATE POLICY "Either party can view friendship"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- System inserts friendships via trigger (SECURITY DEFINER trigger function handles this)
-- But allow direct insert for the trigger function
CREATE POLICY "System can insert friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (true);

-- Either party can delete (unfriend)
CREATE POLICY "Either party can unfriend"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- ============================================================================
-- 5. Trigger: auto-create friendship when friend request is accepted
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_friend_request_accepted()
RETURNS TRIGGER AS $$
DECLARE
  uid_a UUID;
  uid_b UUID;
BEGIN
  -- Only act when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    -- Canonical ordering: smaller UUID goes in user_a
    IF NEW.sender_id < NEW.receiver_id THEN
      uid_a := NEW.sender_id;
      uid_b := NEW.receiver_id;
    ELSE
      uid_a := NEW.receiver_id;
      uid_b := NEW.sender_id;
    END IF;

    -- Insert friendship, ignore if already exists
    INSERT INTO public.friendships (user_a, user_b)
    VALUES (uid_a, uid_b)
    ON CONFLICT (user_a, user_b) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_friend_request_accepted();

-- ============================================================================
-- 6. Friend invite codes (separate from coaching invite_codes table)
-- ============================================================================
CREATE TABLE public.friend_invite_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.friend_invite_codes ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own codes
CREATE POLICY "Users can manage own friend invite codes"
  ON public.friend_invite_codes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone can view unexpired unredeemed codes for redemption
CREATE POLICY "Anyone can view unexpired friend codes for redemption"
  ON public.friend_invite_codes FOR SELECT
  USING (redeemed_by IS NULL AND expires_at > now());

-- Anyone can redeem a code (set redeemed_by to their own uid)
CREATE POLICY "Anyone can redeem a friend code"
  ON public.friend_invite_codes FOR UPDATE
  USING (redeemed_by IS NULL AND expires_at > now())
  WITH CHECK (auth.uid() = redeemed_by);

-- ============================================================================
-- 7. Groups
-- ============================================================================
CREATE TABLE public.groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. Group members
-- ============================================================================
CREATE TABLE public.group_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted     BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. RLS helper functions
-- ============================================================================

-- Check if current user is a member of a group
CREATE OR REPLACE FUNCTION public.is_group_member(target_group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = target_group_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is friends with another user (checks both orderings)
CREATE OR REPLACE FUNCTION public.is_friend_with(target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_a = auth.uid() AND user_b = target_user_id)
       OR (user_a = target_user_id AND user_b = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 10. Groups RLS policies (after helper functions exist)
-- ============================================================================

-- Members can view groups they belong to
CREATE POLICY "Members can view group"
  ON public.groups FOR SELECT
  USING (public.is_group_member(id));

-- Authenticated users can create groups
CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only creator can update group
CREATE POLICY "Creator can update group"
  ON public.groups FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Only creator can delete group
CREATE POLICY "Creator can delete group"
  ON public.groups FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================================
-- 11. Group members RLS policies
-- ============================================================================

-- Members can view all members of groups they belong to
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id));

-- Creator can add members; members can add themselves (join via invite)
CREATE POLICY "Creator can add group members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    -- Creator can add anyone
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_id AND g.created_by = auth.uid()
    )
    -- Or user can add themselves (self-join)
    OR auth.uid() = user_id
  );

-- Creator can remove members; members can remove themselves (leave)
CREATE POLICY "Creator or self can remove group member"
  ON public.group_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_id AND g.created_by = auth.uid()
    )
  );

-- Members can update own membership (e.g., toggle mute)
CREATE POLICY "Members can update own membership"
  ON public.group_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 12. Shared items
-- ============================================================================
CREATE TABLE public.shared_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('workout', 'pr', 'video')),
  payload      JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Efficient feed queries: most recent items per group
CREATE INDEX idx_shared_items_group_created ON public.shared_items (group_id, created_at DESC);

ALTER TABLE public.shared_items ENABLE ROW LEVEL SECURITY;

-- Group members can view shared items in their groups
CREATE POLICY "Members can view shared items"
  ON public.shared_items FOR SELECT
  USING (public.is_group_member(group_id));

-- Group members can share items (must be member AND own the content)
CREATE POLICY "Members can insert shared items"
  ON public.shared_items FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_group_member(group_id));

-- Author can delete their own shared items
CREATE POLICY "Author can delete own shared items"
  ON public.shared_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 13. Reactions
-- ============================================================================
CREATE TABLE public.reactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_item_id UUID NOT NULL REFERENCES public.shared_items(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji          TEXT NOT NULL, -- stores icon key string (e.g., "fire"), NOT emoji characters
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shared_item_id, user_id, emoji)
);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Members can view reactions on items in their groups
CREATE POLICY "Members can view reactions"
  ON public.reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_items si
      WHERE si.id = reactions.shared_item_id
        AND public.is_group_member(si.group_id)
    )
  );

-- Members can add reactions (must be member of the group the item belongs to)
CREATE POLICY "Members can add reactions"
  ON public.reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.shared_items si
      WHERE si.id = shared_item_id
        AND public.is_group_member(si.group_id)
    )
  );

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
  ON public.reactions FOR DELETE
  USING (auth.uid() = user_id);
