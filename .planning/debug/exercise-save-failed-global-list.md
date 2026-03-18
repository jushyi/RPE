---
status: resolved
trigger: "User logged in as maserinj@gmail.com on prod app cannot save new exercises to the exercise library. Gets a generic 'failed' message. This account was specifically configured to be able to add to AND edit the global exercise list, and it used to work before recent changes."
created: 2026-03-16T00:00:00Z
updated: 2026-03-16T00:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - RLS policy "Admin can insert global exercises" uses EXISTS(SELECT 1 FROM auth.users ...) but the authenticated role cannot access auth.users table. The policy evaluates to FALSE, denying the INSERT.
test: Code analysis + Supabase documentation confirms auth schema is restricted from authenticated role
expecting: Fix by using auth.jwt()->>'email' instead of querying auth.users in the RLS policy
next_action: Create a new migration to fix the RLS policy and trigger function

## Symptoms

expected: User should be able to create new exercises in the exercise library, including adding to the global exercise list
actual: Exercise save fails with a generic "failed" toast/message
errors: Generic "failed" message, no specific error details
reproduction: Log in as maserinj@gmail.com on prod, try to add a new exercise to the library
started: Broke after changes were made to give this account special privileges to add/edit the global exercise list

## Eliminated

- hypothesis: BEFORE INSERT trigger timing issue - RLS evaluated before trigger modifies NEW.user_id
  evidence: PostgreSQL docs confirm BEFORE triggers fire before RLS WITH CHECK evaluation on INSERT
  timestamp: 2026-03-16T00:10:00Z

- hypothesis: PostgREST RETURNING clause SELECT policy issue preventing readback of inserted row
  evidence: RETURNING uses SELECT policies, but "Anyone can read global exercises" (user_id IS NULL) would match the trigger-modified row
  timestamp: 2026-03-16T00:15:00Z

- hypothesis: Foreign key or NOT NULL constraint violation on user_id being set to NULL
  evidence: user_id column is nullable (no NOT NULL constraint), FK allows NULL
  timestamp: 2026-03-16T00:18:00Z

## Evidence

- timestamp: 2026-03-16T00:05:00Z
  checked: Migration 20260316000001_admin_exercises_global.sql
  found: RLS policy "Admin can insert global exercises" queries auth.users table directly
  implication: The authenticated role cannot access auth schema tables - this query will fail

- timestamp: 2026-03-16T00:08:00Z
  checked: Trigger function make_admin_exercises_global()
  found: Trigger is SECURITY DEFINER so it CAN access auth.users - trigger works correctly
  implication: The trigger succeeds (sets user_id=NULL) but the RLS policy check fails

- timestamp: 2026-03-16T00:12:00Z
  checked: Original exercises INSERT policy
  found: "Users can insert own exercises" checks auth.uid() = user_id - fails when trigger sets user_id=NULL
  implication: After trigger nullifies user_id, NEITHER insert policy passes for admin user

- timestamp: 2026-03-16T00:20:00Z
  checked: Supabase documentation and community issues
  found: API roles (anon, authenticated) cannot access auth and vault schemas - this is by design
  implication: The EXISTS subquery in the admin policy always fails, making the policy always FALSE

- timestamp: 2026-03-16T00:22:00Z
  checked: Client code createExercise in useExercises.ts
  found: Generic error caught in ExerciseBottomSheet/FreestyleExercisePicker catch blocks
  implication: The actual Supabase RLS error is swallowed, user sees generic "Failed to save exercise"

## Resolution

root_cause: The RLS policy "Admin can insert global exercises" queries auth.users table directly via EXISTS(SELECT 1 FROM auth.users WHERE ...). The authenticated role CANNOT access the auth schema tables. This causes the policy to always evaluate to FALSE. Combined with the BEFORE INSERT trigger setting user_id=NULL (which breaks the "Users can insert own" policy where auth.uid() = user_id), NO INSERT policy passes for the admin user, and the insert is denied by RLS.
fix: New migration 20260320000000_fix_admin_exercises_rls.sql replaces auth.users queries with auth.jwt()->>'email' (JWT claims accessible to all roles). Also adds admin UPDATE and DELETE policies for global exercises.
verification: Migration applied to production. User confirmed exercises save successfully on prod with maserinj@gmail.com account. Resolved 2026-03-18.
files_changed:
  - supabase/migrations/20260320000000_fix_admin_exercises_rls.sql (new)
