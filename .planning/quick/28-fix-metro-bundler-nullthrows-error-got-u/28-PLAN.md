---
phase: quick
plan: 28
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true
requirements: [QUICK-28]
must_haves:
  truths:
    - "Metro bundler starts and serves the app without nullthrows error"
    - "App loads successfully on device/emulator after cache clear"
  artifacts: []
  key_links: []
---

<objective>
Fix Metro bundler nullthrows error in Graph._recursivelyCommitModule that prevents the app from bundling.

Purpose: The app cannot be served by Metro due to a dependency graph corruption or broken import. This blocks all development.
Output: Working Metro bundler that serves the app without errors.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

The error occurs in Metro's Graph._recursivelyCommitModule, which means Metro's internal
dependency graph has an undefined module entry. Common causes:
1. Corrupted Metro cache (most common, especially after file moves/renames)
2. Circular dependency or broken import path
3. A recently moved/renamed file where Metro's watcher hasn't caught up
4. A barrel export re-exporting something that doesn't exist

Recent quick-27 moved exercises content into plans tab - this file reorganization
could have left stale imports or Metro cache corruption.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Clear Metro cache and rebuild</name>
  <files></files>
  <action>
The most common fix for this error is clearing Metro's cache. Run:

1. Kill any running Metro processes
2. Clear Metro cache: `npx expo start --clear`
3. If that alone doesn't fix it, also clear the temp cache directories:
   - Delete `node_modules/.cache` if it exists
   - Run `npx expo start --clear` again

If the error persists after cache clearing, move to Task 2 for deeper diagnosis.
  </action>
  <verify>
    <automated>npx expo start --clear 2>&1 | head -20</automated>
  </verify>
  <done>Metro bundler starts without the nullthrows error</done>
</task>

<task type="auto">
  <name>Task 2: Diagnose and fix broken imports (if cache clear insufficient)</name>
  <files></files>
  <action>
If Task 1 did not resolve the issue, the error is caused by a broken import. Diagnose:

1. Check recent git changes for moved/renamed files:
   `git diff HEAD~3 --name-status | grep -E "^[RD]"` to find renamed or deleted files.

2. Search for imports of any deleted/renamed files:
   For each renamed/deleted file, grep the codebase for old import paths.

3. Specifically check quick-27 changes (moved exercises into plans tab):
   `git show HEAD --name-status` to see what files were affected.
   Look for any lingering imports to old exercise file locations.

4. Check for barrel exports re-exporting non-existent modules:
   Look at any index.ts files that aggregate exports.

5. Fix any broken import paths found - update to correct new paths.

6. After fixing imports, run `npx expo start --clear` to verify.
  </action>
  <verify>
    <automated>npx expo start --clear 2>&1 | head -20</automated>
  </verify>
  <done>All import paths resolve correctly and Metro bundles without errors</done>
</task>

</tasks>

<verification>
Metro bundler starts cleanly with `npx expo start --clear` and the app loads on device/emulator.
</verification>

<success_criteria>
- Metro bundler starts without nullthrows error
- App loads and renders on device/emulator
- No broken import warnings in Metro output
</success_criteria>

<output>
After completion, create `.planning/quick/28-fix-metro-bundler-nullthrows-error-got-u/28-SUMMARY.md`
</output>
