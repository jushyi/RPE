---
status: awaiting_human_verify
trigger: "When trying to create a group in the social feature, it says 'failed to create group'. User is creating a group with only one person."
created: 2026-03-18T00:00:00Z
updated: 2026-03-18T00:00:00Z
---

## Current Focus

hypothesis: The groups INSERT uses .select('*').single() which triggers a SELECT after INSERT, but the groups SELECT RLS policy requires is_group_member(id). Since no members exist yet at that point, PostgREST cannot return the inserted row, causing groupError or null groupData, which makes createGroup return null.
test: Verify that groups SELECT RLS depends on group_members existence and that the insert+select pattern hits this
expecting: Confirmed circular dependency - INSERT succeeds but the chained SELECT fails because is_group_member returns false for a group with no members yet
next_action: Verify hypothesis and apply fix

## Symptoms

expected: Group should be created successfully with one person
actual: Error message "failed to create group" appears immediately
errors: "failed to create group" toast/alert
reproduction: Go to social, try to create a group, add only one person, submit
started: Never worked - group creation has never succeeded

## Eliminated

## Evidence

- timestamp: 2026-03-18T00:01:00Z
  checked: socialStore.ts createGroup function flow
  found: Line 120-124 inserts group with .select('*').single() which requires a SELECT after INSERT. The groups SELECT RLS policy (migration line 222-224) requires is_group_member(id), but group_members are not inserted until lines 140-142, AFTER the group insert. So the chained SELECT fails.
  implication: Root cause is a circular dependency - the groups table INSERT+SELECT pattern fails because the SELECT RLS requires membership, but membership is added after the group is created.

- timestamp: 2026-03-18T00:02:00Z
  checked: RLS policies in 20260318000001_create_social.sql
  found: Groups SELECT policy uses is_group_member(id) (SECURITY DEFINER function that checks group_members table). Group_members INSERT policy uses an inline EXISTS subquery on groups table (subject to RLS). This creates a second circular dependency for adding non-creator members.
  implication: Two layered issues - (1) group INSERT+SELECT fails because no members yet, (2) even if group insert returned data, batch member insert would fail for non-creator members because the EXISTS subquery on groups is blocked by the SELECT RLS.

## Resolution

root_cause: Circular RLS dependency on the groups table. The groups SELECT policy requires is_group_member(id), but group_members are inserted AFTER the group is created. The socialStore createGroup function uses .insert({...}).select('*').single(), and the chained .select() triggers a SELECT governed by the RLS policy. Since no members exist yet, is_group_member returns false, PostgREST cannot return the row, and the insert appears to fail (groupError is set or groupData is null). The function returns null, and the UI shows "Failed to create group." Additionally, the group_members INSERT policy has an inline EXISTS subquery on the groups table that is also blocked by the same SELECT RLS, creating a second circular dependency for non-creator members.
fix: Two-part fix: (1) New SQL migration adds a groups SELECT policy "Creator can view own group" with USING (auth.uid() = created_by), breaking the circular dependency so the INSERT...SELECT pattern works. (2) In socialStore.ts, split the batch member insert -- add creator as member first (single row), then add remaining members separately. This ensures the creator's membership is established before adding others, and prevents a single failed row from blocking the entire insert.
verification: Self-verified that the RLS circular dependency is resolved by the new SELECT policy. The INSERT...SELECT on groups will now succeed because the creator matches the new policy. The group_members INSERT for the creator uses auth.uid() = user_id. The group_members INSERT for other members uses the EXISTS subquery on groups, which now succeeds because the creator can see the group via the new SELECT policy.
files_changed: [supabase/migrations/20260320000001_fix_group_creation_rls.sql, src/stores/socialStore.ts]
