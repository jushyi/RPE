# Quick Task 260318-dtu: Bundle Debug Fixes into PR with CI Verification and OTA Update

## Result: COMPLETE

### What was done
1. Committed remaining unstaged debug fixes (weekly summary deep link, RLS migrations, debug docs)
2. Created branch `fix/debug-session-bundle` with all 8 debug fix commits
3. Opened PR #4: "fix: bundle debug session fixes (notifications, PRs, RLS)"
4. CI checks passed (TypeScript + ESLint)
5. Merged PR #4 to main with merge commit
6. Tagged `ota/debug-fixes-2026-03-18` to trigger OTA update workflow
7. OTA workflow completed successfully (EAS Update to production channel)

### Commits bundled (8 total)
- `69c1f32` fix: weekly summary deep link, RLS policies for admin exercises and group creation
- `4d74dc9` fix(coaching): route coach workout_complete notifications to trainee history
- `e551f2d` docs: update debug knowledge base with pr-calculation-ignores-set-prs
- `67667d2` docs: resolve debug pr-calculation-ignores-set-prs
- `9523dc2` fix: prevent false PR flags by resolving exercise_id in baseline save/load
- `8fffd91` docs: update debug knowledge base with trainee-pr-deep-link
- `74f4a9b` docs: resolve debug trainee-pr-deep-link
- `1ffafd1` fix: route coach PR notifications to trainee history instead of own progress chart

### Debug sessions addressed
1. **Coach notification deep link** - Coach tapping workout_complete/pr_achieved now routes to trainee history
2. **PR false positives** - exercise_id properly resolved in baseline save/load
3. **Weekly summary tap** - weekly_summary notifications now route to dashboard
4. **Admin exercises RLS** - Policy uses jwt() instead of auth.users query
5. **Group creation RLS** - Circular dependency broken with creator-view policy

### Artifacts
- PR: https://github.com/jushyi/RPE/pull/4 (MERGED)
- OTA tag: `ota/debug-fixes-2026-03-18`
- OTA workflow run: https://github.com/jushyi/RPE/actions/runs/23248613390
