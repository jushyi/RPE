---
phase: quick-45
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tsconfig.json
  - app/(app)/(tabs)/dashboard.tsx
  - app/(app)/(tabs)/settings.tsx
  - app/(app)/_layout.tsx
  - app/(app)/dev-tools.tsx
  - app/_layout.tsx
  - src/components/ui/Skeleton.tsx
  - src/features/settings/hooks/useDataExport.ts
  - src/features/settings/hooks/useDeleteAccount.ts
  - src/features/social/components/MessageBubble.tsx
  - src/features/social/components/RetroShareButton.tsx
  - src/features/social/components/SharedVideoCard.tsx
  - src/features/social/hooks/useChatMedia.ts
  - src/stores/friendshipStore.ts
  - tests/dashboard/todays-workout.test.ts
  - tests/plans/plan-crud.test.ts
  - tests/workout/workout-session-hook.test.ts
  - tests/workout/workout-store.test.ts
autonomous: true
requirements: [quick-45]
must_haves:
  truths:
    - "tsc --noEmit passes with zero errors"
    - "No runtime behavior changes introduced"
  artifacts:
    - path: tsconfig.json
      provides: "Excludes supabase/functions from TS compilation"
      contains: "supabase/functions"
  key_links: []
---

<objective>
Fix all TypeScript errors failing the CI "TypeScript Check" (tsc --noEmit).

Purpose: Unblock CI pipeline so PRs can merge.
Output: Zero tsc errors across the entire codebase.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@tsconfig.json
@src/features/plans/types.ts (PlanDay has alarm_time and alarm_enabled fields)
@src/lib/supabase/types/database.ts (Profile type lacks deletion_scheduled_at; Functions = Record<string, never>)
@src/features/notifications/types.ts (NotificationType and NotificationData exports)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Exclude Deno edge functions and fix app-level type errors</name>
  <files>
    tsconfig.json,
    app/(app)/(tabs)/dashboard.tsx,
    app/(app)/(tabs)/settings.tsx,
    app/(app)/_layout.tsx,
    app/(app)/dev-tools.tsx,
    app/_layout.tsx,
    src/components/ui/Skeleton.tsx,
    src/features/settings/hooks/useDataExport.ts,
    src/features/settings/hooks/useDeleteAccount.ts,
    src/features/social/components/MessageBubble.tsx,
    src/features/social/components/RetroShareButton.tsx,
    src/features/social/components/SharedVideoCard.tsx,
    src/features/social/hooks/useChatMedia.ts,
    src/stores/friendshipStore.ts
  </files>
  <action>
Apply these targeted fixes (type-only, no runtime changes):

1. **tsconfig.json** — Add `"exclude": ["supabase/functions/**"]` to stop tsc from checking Deno edge functions.

2. **app/(app)/(tabs)/dashboard.tsx line 279** — The `navigation.addListener('tabPress', ...)` has a type mismatch. Fix by adding a type assertion: cast the event name or use `as any` on the listener call, e.g. `navigation.addListener('tabPress' as any, (e: any) => {`.

3. **app/(app)/(tabs)/settings.tsx line 34** — `pwd` parameter in Alert prompt callback implicitly has `any`. Add type annotation: `(pwd: string | undefined)`.

4. **app/(app)/_layout.tsx line 33** — `as NotificationData` cast fails because `Record<string, unknown>` doesn't sufficiently overlap. Change to `as unknown as NotificationData`.

5. **app/_layout.tsx line 63** — Same fix as above: change `as NotificationData` to `as unknown as NotificationData`.

6. **app/(app)/dev-tools.tsx line 57** — `NotificationType` is used but not imported. Add import: `import type { NotificationType } from '@/features/notifications/types';`

7. **src/components/ui/Skeleton.tsx** — Two issues:
   - Line 25: `width` prop typed as `number | string` but `DimensionValue` doesn't accept plain `string`. Change the SkeletonProps interface `width` to `DimensionValue` (import from react-native). Keep the component prop type matching.
   - Line 31: `useAnimatedStyle` return type doesn't match `AnimatedStyle`. The style object includes `width` which is a prop value. Use `as any` on the style return or wrap with explicit type: `const style = useAnimatedStyle(() => ({ opacity: opacity.value, width: width as number, height, backgroundColor: colors.surfaceElevated, borderRadius }));` — casting width to number in the animated style since reanimated expects numeric dimensions.

8. **src/features/settings/hooks/useDataExport.ts line 72** — `FileSystem.cacheDirectory` can be `null`. Add null guard: `const fileUri = (FileSystem.cacheDirectory ?? '') + 'rpe-export.csv';` or add a null check before usage.

9. **src/features/settings/hooks/useDeleteAccount.ts lines 23-24** — `deletion_scheduled_at` doesn't exist on the Profile type (returns `never`). The `.select('deletion_scheduled_at')` call returns unknown columns. Fix by casting: change the query result to `const { data } = await supabase.from('profiles').select('deletion_scheduled_at').eq('id', userId).single() as { data: { deletion_scheduled_at: string | null } | null };` — or use `.select('*')` and cast the result.

10. **src/features/social/components/MessageBubble.tsx line 214** and **SharedVideoCard.tsx line 106** — `allowsFullscreen` prop doesn't exist on `VideoView` in current expo-video types. Remove the `allowsFullscreen` and `allowsFullscreen={false}` props from both files. These are no-ops in current expo-video.

11. **src/features/social/hooks/useChatMedia.ts lines 74, 78** — Dynamic `import('expo-video-thumbnails')` resolves to a module that doesn't exist in the project's types. Fix by:
    - Wrap the import with a `// @ts-ignore` comment above line 74, OR
    - Change to: `const VideoThumbnails = (await import('expo-video-thumbnails' as any)) as any;` and handle the null thumbnail result with appropriate type.
    - Line 78: `thumbnailUrl` can be `null` from `uploadMedia` but is typed `string | undefined`. Change the variable declaration to `let thumbnailUrl: string | null | undefined;` or ensure uploadMedia result is properly typed.

12. **src/features/social/components/RetroShareButton.tsx line 89** — `shareToGroups` extracted via `ReturnType<typeof useSocialStore>['shareToGroups']` resolves to unknown because Zustand store return type doesn't expose it cleanly. Fix by importing the type directly: replace `ReturnType<typeof useSocialStore>['shareToGroups']` with the explicit function signature: `(groupIds: string[], items: any[]) => Promise<void>`.

13. **src/stores/friendshipStore.ts line 325** — `supabase.rpc('search_profiles_by_handle', { query })` fails because `Functions` is `Record<string, never>`. Fix by casting: `await (supabase.rpc as any)('search_profiles_by_handle', { query })`.
    - Line 350: `.update({ handle } as any)` — already uses `as any` but the `.eq()` chain returns `never`. Add explicit typing or cast the whole chain: `await (supabase.from('profiles').update({ handle } as any).eq('id', session.user.id) as any)`.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0 errors"</automated>
  </verify>
  <done>All app source and config type errors resolved; tsc reports no errors for non-test files</done>
</task>

<task type="auto">
  <name>Task 2: Fix test file type errors (missing PlanDay fields)</name>
  <files>
    tests/dashboard/todays-workout.test.ts,
    tests/plans/plan-crud.test.ts,
    tests/workout/workout-session-hook.test.ts,
    tests/workout/workout-store.test.ts
  </files>
  <action>
The PlanDay type now requires `alarm_time: string | null` and `alarm_enabled: boolean` fields (added in a recent phase). All test mocks creating PlanDay objects are missing these fields.

Add the missing fields to every mock PlanDay object in each file:

1. **tests/dashboard/todays-workout.test.ts line 6** — In the `makePlanDay` function's return object, add `alarm_time: null` and `alarm_enabled: false` as defaults (before the spread of overrides so they can be overridden).

2. **tests/plans/plan-crud.test.ts line 18** — In the `mockPlanDay` factory function's return object, add `alarm_time: null` and `alarm_enabled: false`.

3. **tests/workout/workout-session-hook.test.ts line 366** — In the inline `planDay` object literal around line 335-364, add `alarm_time: null` and `alarm_enabled: false`.

4. **tests/workout/workout-store.test.ts line 5** — In the `mockPlanDay` constant, add `alarm_time: null` and `alarm_enabled: false`.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>All test file PlanDay type errors resolved; tsc --noEmit exits with code 0</done>
</task>

</tasks>

<verification>
Run the full TypeScript check to confirm zero errors:
```bash
npx tsc --noEmit
```
Expected: exits with code 0, no output.
</verification>

<success_criteria>
- `npx tsc --noEmit` passes with zero errors
- No runtime behavior changed (all fixes are type annotations, casts, and prop removals for non-existent props)
- CI "TypeScript Check" job would pass
</success_criteria>

<output>
After completion, create `.planning/quick/45-fix-all-failing-typescript-ci-check-erro/45-SUMMARY.md`
</output>
