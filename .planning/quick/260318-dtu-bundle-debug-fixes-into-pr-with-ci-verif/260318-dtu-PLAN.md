---
phase: quick
plan: 260318-dtu
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/_layout.tsx
  - src/features/notifications/utils/deepLinkRouter.ts
  - tests/notifications/deepLinkRouter.test.ts
  - .planning/debug/coach-trainee-history-loading.md
  - .planning/debug/exercise-save-failed-global-list.md
  - .planning/debug/group-creation-failed.md
  - .planning/debug/weekly-summary-notif-tap.md
  - supabase/migrations/20260320000000_fix_admin_exercises_rls.sql
  - supabase/migrations/20260320000001_fix_group_creation_rls.sql
autonomous: false
requirements: []
must_haves:
  truths:
    - "All debug fix commits are bundled into a single PR against main"
    - "CI checks (typecheck + lint) pass on the PR branch"
    - "PR is merged and OTA update is triggered to production"
  artifacts: []
  key_links:
    - from: "ota/* tag"
      to: ".github/workflows/ota-update.yml"
      via: "git tag push triggers EAS update"
      pattern: "ota/"
---

<objective>
Bundle all recent debug session fixes into a PR, verify via CI, merge, and trigger OTA update to production.

Purpose: Ship accumulated debug fixes (notification routing, PR detection, RLS policies, deep link routing) to production users via OTA update with CI verification first.
Output: Merged PR, OTA tag pushed, production updated.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Current state:
- Local main is 7 commits ahead of origin/main with debug fix commits
- 3 modified files (unstaged) and 6 untracked debug-related files need committing
- Untracked files to EXCLUDE (not debug fixes): .planning/phases/20-integration-gap-closure/, app/(app)/weekly-stats.tsx, src/features/weekly-stats/

Commits on local main ahead of origin (all debug fixes):
- 4d74dc9 fix(coaching): route coach workout_complete notifications to trainee history
- e551f2d docs: update debug knowledge base with pr-calculation-ignores-set-prs
- 67667d2 docs: resolve debug pr-calculation-ignores-set-prs
- 9523dc2 fix: prevent false PR flags by resolving exercise_id in baseline save/load
- 8fffd91 docs: update debug knowledge base with trainee-pr-deep-link
- 74f4a9b docs: resolve debug trainee-pr-deep-link
- 1ffafd1 fix: route coach PR notifications to trainee history instead of own progress chart

CI workflows:
- ci-checks.yml: Runs typecheck + lint on push to main OR pull_request to main
- ota-update.yml: Runs on push with tag pattern 'ota/*', executes `eas update --channel production`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Commit remaining debug changes, create branch, push, and open PR</name>
  <files>
    app/(app)/_layout.tsx
    src/features/notifications/utils/deepLinkRouter.ts
    tests/notifications/deepLinkRouter.test.ts
    .planning/debug/coach-trainee-history-loading.md
    .planning/debug/exercise-save-failed-global-list.md
    .planning/debug/group-creation-failed.md
    .planning/debug/weekly-summary-notif-tap.md
    supabase/migrations/20260320000000_fix_admin_exercises_rls.sql
    supabase/migrations/20260320000001_fix_group_creation_rls.sql
  </files>
  <action>
    Step 1 - Commit remaining unstaged/untracked debug changes on main:
    Stage ONLY these debug-related files (do NOT stage weekly-stats or phase-20 files):
    - app/(app)/_layout.tsx
    - src/features/notifications/utils/deepLinkRouter.ts
    - tests/notifications/deepLinkRouter.test.ts
    - .planning/debug/coach-trainee-history-loading.md
    - .planning/debug/exercise-save-failed-global-list.md
    - .planning/debug/group-creation-failed.md
    - .planning/debug/weekly-summary-notif-tap.md
    - supabase/migrations/20260320000000_fix_admin_exercises_rls.sql
    - supabase/migrations/20260320000001_fix_group_creation_rls.sql

    Commit with message: "fix: add deep link routing for weekly summary + RLS policy fixes for admin exercises and group creation"

    Step 2 - Create feature branch from current HEAD:
    ```bash
    git checkout -b fix/debug-session-bundle
    ```
    Note: This branch will contain ALL commits from local main (which is ahead of origin/main) plus the new commit.

    Step 3 - Push the branch to origin:
    ```bash
    git push -u origin fix/debug-session-bundle
    ```

    Step 4 - Create PR using gh CLI:
    ```bash
    gh pr create --base main --head fix/debug-session-bundle \
      --title "fix: bundle debug session fixes (notifications, PRs, RLS)" \
      --body "## Summary
    - Route coach workout_complete and PR notifications to trainee history
    - Fix false PR flags by resolving exercise_id in baseline save/load
    - Add deep link routing for weekly summary notifications
    - Fix RLS policies for admin exercises and group creation
    - Update debug knowledge base documentation

    ## Changes
    8 commits bundling fixes from debug sessions:
    - Notification deep link routing improvements
    - PR detection baseline resolution
    - Supabase RLS migration fixes
    - Debug knowledge base docs

    ## Test plan
    - [ ] CI passes (typecheck + lint)
    - [ ] Notification deep links route correctly
    - [ ] PR detection no longer shows false positives"
    ```

    Step 5 - Switch back to main so working directory stays on main:
    ```bash
    git checkout main
    ```

    IMPORTANT: Do NOT reset local main. Keep it as-is. The PR will diff fix/debug-session-bundle against origin/main.
  </action>
  <verify>
    <automated>gh pr view fix/debug-session-bundle --json state,title,statusCheckRollup | head -30</automated>
  </verify>
  <done>PR is open against main with all debug fix commits, branch pushed to origin, CI checks triggered.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>PR created with all debug fixes. CI checks should be running or completed.</what-built>
  <how-to-verify>
    1. Check CI status: `gh pr checks fix/debug-session-bundle --watch` (or check the PR URL in browser)
    2. Verify the PR contains the expected changes (8 commits, notification routing, PR detection, RLS fixes)
    3. If CI passes, confirm ready to merge
    4. If CI fails, report the failure output
  </how-to-verify>
  <resume-signal>Type "ci passed" to proceed with merge and OTA, or describe any CI failures.</resume-signal>
</task>

<task type="auto">
  <name>Task 3: Merge PR and tag for OTA production update</name>
  <files></files>
  <action>
    Step 1 - Merge the PR (use merge commit to preserve history):
    ```bash
    gh pr merge fix/debug-session-bundle --merge --delete-branch
    ```

    Step 2 - Pull the merge to local main:
    ```bash
    git checkout main
    git pull origin main
    ```

    Step 3 - Tag the merge commit to trigger OTA update:
    ```bash
    git tag ota/debug-fixes-2026-03-18
    git push origin ota/debug-fixes-2026-03-18
    ```

    Step 4 - Verify OTA workflow was triggered:
    ```bash
    gh run list --workflow=ota-update.yml --limit=1
    ```
  </action>
  <verify>
    <automated>gh run list --workflow=ota-update.yml --limit=1 --json status,conclusion,displayTitle | head -10</automated>
  </verify>
  <done>PR merged to main, ota/debug-fixes-2026-03-18 tag pushed, OTA update workflow triggered and running.</done>
</task>

</tasks>

<verification>
1. PR merged: `gh pr view fix/debug-session-bundle --json state` shows "MERGED"
2. OTA tag exists: `git tag -l "ota/debug-fixes-2026-03-18"` returns the tag
3. OTA workflow triggered: `gh run list --workflow=ota-update.yml --limit=1` shows a recent run
4. Local main is in sync: `git log --oneline -1 origin/main` matches local HEAD
</verification>

<success_criteria>
- All debug fix commits are in a merged PR on main
- CI checks (typecheck + lint) passed on the PR before merge
- OTA update workflow triggered by ota/* tag
- Production users will receive the fixes via OTA update
- Local main is synced with origin/main
</success_criteria>

<output>
After completion, create `.planning/quick/260318-dtu-bundle-debug-fixes-into-pr-with-ci-verif/260318-dtu-SUMMARY.md`
</output>
