---
phase: quick-17
plan: 1
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true
requirements: [QUICK-17]
user_setup: []

must_haves:
  truths:
    - "GitHub repo 'RPE' exists under account 'jushyi' as public"
    - "Local git repo has remote 'origin' pointing to jushyi/RPE"
    - "All local branches (master, main) are pushed to GitHub"
  artifacts:
    - path: "GitHub repo: https://github.com/jushyi/RPE (public)"
      provides: "Remote repository for RPE project"
  key_links:
    - from: "Local .git/config"
      to: "GitHub remote origin"
      via: "gh repo create + git push"
      pattern: "origin.*github.com.*jushyi/RPE"
---

<objective>
Create a public GitHub repository named "RPE" under the jushyi account and connect the local repository to it, pushing all branches.

Purpose: Get the codebase on GitHub for backup and future collaboration/deployment.
Output: Live public GitHub repo at github.com/jushyi/RPE with all local branches pushed.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

**Current state:**
- Local git repo exists with commits on master and main branches
- No remotes currently configured
- gh CLI authenticated as "jushyi"
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create GitHub repo and push all branches</name>
  <files>none (remote operation only)</files>
  <action>
    1. Create the public GitHub repo, add origin remote, and push current branch in one command:
       `gh repo create RPE --public --source=. --remote=origin --push`

    2. Push all remaining branches to ensure both master and main are on GitHub:
       `git push origin --all`

    3. Verify remote and repo:
       `git remote -v`
       `gh repo view jushyi/RPE --json name,url,visibility`
       `git branch -r`

    NOTE: If the command fails because a repo named RPE already exists (HTTP 422), check with `gh repo view jushyi/RPE` first. If origin remote already exists, use `git remote set-url origin` instead of creating.
  </action>
  <verify>
    <automated>git remote -v | grep -E "origin.*jushyi/RPE" && git branch -r | grep -E "origin/(main|master)" && gh repo view jushyi/RPE --json visibility --jq .visibility</automated>
  </verify>
  <done>
    - GitHub repo "RPE" created as public under jushyi account
    - Local git config has "origin" remote pointing to jushyi/RPE
    - Both master and main branches pushed and visible via `git branch -r`
    - Repo accessible at https://github.com/jushyi/RPE
  </done>
</task>

</tasks>

<verification>
1. `git remote -v` shows origin pointing to jushyi/RPE
2. `git branch -r` shows origin/master and origin/main
3. `gh repo view jushyi/RPE` confirms public visibility with code present
</verification>

<success_criteria>
Public GitHub repository "RPE" exists under jushyi with all local branches pushed and origin remote configured.
</success_criteria>

<output>
After completion, create `.planning/quick/17-create-github-repo-and-connect-to-local/17-SUMMARY.md`
</output>
