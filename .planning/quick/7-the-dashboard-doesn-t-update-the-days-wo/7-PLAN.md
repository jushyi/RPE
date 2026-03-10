---
phase: quick
plan: 7
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/workout/hooks/useCompletedToday.ts
  - src/features/history/hooks/useHistory.ts
autonomous: true
must_haves:
  truths:
    - "After deleting a workout session, the dashboard no longer shows it"
    - "Returning to the dashboard tab after deletion shows updated state"
  artifacts:
    - path: "src/features/workout/hooks/useCompletedToday.ts"
      provides: "removeCompletedSession export for cache invalidation"
    - path: "src/features/history/hooks/useHistory.ts"
      provides: "deleteSession calls removeCompletedSession to clear MMKV cache"
  key_links:
    - from: "src/features/history/hooks/useHistory.ts"
      to: "src/features/workout/hooks/useCompletedToday.ts"
      via: "import removeCompletedSession"
      pattern: "removeCompletedSession"
---

<objective>
Fix dashboard showing deleted workout sessions. After a user deletes a workout from history, the dashboard "Today's Workout" section still displays it because the MMKV cache in `useCompletedToday` is never invalidated on deletion.

Purpose: The `deleteSession` in useHistory deletes from Supabase and historyStore, but the separate MMKV cache (`completed-today`) retains the stale session. On dashboard focus, `useCompletedToday` merges the stale MMKV data back in, resurrecting the deleted session.

Output: Dashboard correctly reflects deletions immediately.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/workout/hooks/useCompletedToday.ts
@src/features/history/hooks/useHistory.ts
@src/stores/historyStore.ts
@app/(app)/(tabs)/dashboard.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Export removeCompletedSession from useCompletedToday and wire into deleteSession</name>
  <files>src/features/workout/hooks/useCompletedToday.ts, src/features/history/hooks/useHistory.ts</files>
  <action>
In `src/features/workout/hooks/useCompletedToday.ts`:

1. Add a new exported function `removeCompletedSession(sessionId: string): void` that:
   - Reads the current MMKV cache via `getCachedToday()`
   - Filters out the session with matching id
   - Writes the filtered array back to MMKV using the same `{ date, sessions }` format
   - If the resulting sessions array is empty, delete the key entirely via `mmkv.delete(KEY)`

```typescript
export function removeCompletedSession(sessionId: string): void {
  const today = new Date().toISOString().split('T')[0];
  const existing = getCachedToday();
  const filtered = existing.filter((s) => s.id !== sessionId);
  if (filtered.length === 0) {
    mmkv.delete(KEY);
  } else {
    mmkv.set(KEY, JSON.stringify({ date: today, sessions: filtered }));
  }
}
```

In `src/features/history/hooks/useHistory.ts`:

2. Import `removeCompletedSession` from `@/features/workout/hooks/useCompletedToday`
3. In the `deleteSession` callback, after the existing `removeSession(id)` call, add `removeCompletedSession(id)` to also clear the MMKV cache. This ensures that when the user navigates back to the dashboard, the stale cached session is gone.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Desktop/Gym-App && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Deleting a workout session from history removes it from both the historyStore AND the completed-today MMKV cache. When the dashboard tab regains focus, useCompletedToday no longer returns the deleted session.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors: `npx tsc --noEmit`
2. Manual flow: Start a workout, complete it, see it on dashboard, go to history, delete it, return to dashboard -- the deleted session is gone.
</verification>

<success_criteria>
- Dashboard no longer shows deleted workout sessions after navigating back
- No TypeScript errors introduced
- Both MMKV cache and Supabase/store are cleared on deletion
</success_criteria>

<output>
After completion, create `.planning/quick/7-the-dashboard-doesn-t-update-the-days-wo/7-SUMMARY.md`
</output>
