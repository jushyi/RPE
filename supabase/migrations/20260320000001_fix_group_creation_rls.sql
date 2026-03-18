-- Fix: Group creation fails because the groups SELECT RLS policy only allows
-- members to view groups (via is_group_member), but at creation time no members
-- exist yet. The INSERT...SELECT pattern in PostgREST fails because the chained
-- SELECT cannot return the newly inserted row.
--
-- Root cause: Circular RLS dependency - creating a group requires being a member
-- to see it, but members are added after the group is created.
--
-- Fix: Add a SELECT policy allowing the creator to always view their own group.

CREATE POLICY "Creator can view own group"
  ON public.groups FOR SELECT
  USING (auth.uid() = created_by);
