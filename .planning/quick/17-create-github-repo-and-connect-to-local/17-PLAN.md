---
phase: quick-17
plan: 1
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true
requirements: []
user_setup: []

must_haves:
  truths:
    - "GitHub repo 'Gym-App' exists under account 'jushyi' as private"
    - "Local git repo has remote 'origin' pointing to GitHub"
    - "Existing commits are pushed to GitHub main/master branches"
  artifacts:
    - path: "GitHub repo: https://github.com/jushyi/Gym-App (private)"
      provides: "Remote repository for Gym-App project"
  key_links:
    - from: "Local .git/config"
      to: "GitHub remote origin"
      via: "git remote add origin"
      pattern: "origin.*github.com"
---

<objective>
Create a private GitHub repository named "Gym-App" under the account "jushyi" and connect it to the existing local git repository, then push all commits.

Purpose: Enable remote backup and collaboration for the Gym-App project.
Output: Private GitHub repo with all local commits accessible remotely.
</objective>

<execution_context>
@C:\Users\maser\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\maser\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@.planning\STATE.md
@CLAUDE.md

**Current state:**
- Local git repo exists with commits on master and main branches
- No remote configured
- gh CLI authenticated as "jushyi"
- User account: jushyi
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create GitHub repo, add remote, and push commits</name>
  <files>none (remote operation only)</files>
  <action>
    1. Use gh CLI to create the private GitHub repository, add it as origin remote, and push existing commits in one atomic command:
       `gh repo create Gym-App --private --source=. --remote=origin --push`

    This single command:
    - Creates "Gym-App" repository as private under account "jushyi" (authenticated)
    - Adds the GitHub URL as "origin" remote to the local .git/config
    - Pushes all local commits (master and main branches) to GitHub

    If the push includes both master and main branches, verify both are present on GitHub after completion.

    NOTE: If the command fails due to the repo already existing (HTTP 422), the remote may already be configured. Verify with `git remote -v` before retrying. If already exists, skip to verification.
  </action>
  <verify>
    <automated>git remote -v | grep -E "origin.*github.com/jushyi/Gym-App" && git branch -r | grep -E "origin/(main|master)"</automated>
  </verify>
  <done>
    - GitHub repo "Gym-App" created as private under jushyi account
    - Local git config has "origin" remote pointing to GitHub
    - All local commits pushed to remote branches (main/master visible in `git branch -r`)
    - Accessible at https://github.com/jushyi/Gym-App (private repository)
  </done>
</task>

</tasks>

<verification>
Verify the following after task completion:
1. `git remote -v` shows origin pointing to GitHub Gym-App repo
2. `git log --oneline -3` shows the 3 most recent commits
3. Visit https://github.com/jushyi/Gym-App and confirm repo is private and contains the code
</verification>

<success_criteria>
- Private GitHub repository "Gym-App" exists under account "jushyi"
- Local .git/config has origin remote configured
- All existing commits are pushed and visible on GitHub
- Repository is confirmed private (not public)
</success_criteria>

<output>
After completion, create `.planning/quick/17-create-github-repo-and-connect-to-local/17-SUMMARY.md` documenting:
- GitHub repo URL created
- Remote configuration completed
- Commits pushed (branches and count)
- Any issues encountered or resolved
</output>
