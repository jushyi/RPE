---
phase: quick-18
plan: 1
type: execute
wave: 1
depends_on: []
files_modified: [README.md]
autonomous: true
requirements: [QUICK-18]
must_haves:
  truths:
    - "main branch contains all commits from master"
    - "main is the default branch on GitHub"
    - "master branch no longer exists locally or remotely"
    - "README.md describes the RPE app accurately with no emojis"
  artifacts:
    - path: "README.md"
      provides: "App description and setup instructions"
  key_links: []
---

<objective>
Make "main" the default branch by merging master into it, setting it as default on GitHub, deleting master, and replacing the boilerplate README with a proper app summary.

Purpose: Align with Git conventions (main as default) and provide a real project README.
Output: Single default branch (main) with accurate README.md
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@README.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Merge master into main and set as default branch</name>
  <files>n/a (git operations only)</files>
  <action>
    Execute the following git operations in sequence:

    1. Checkout main branch: `git checkout main`
    2. Merge master into main: `git merge master` (should be a fast-forward or clean merge since main is behind master)
    3. Push updated main to origin: `git push origin main`
    4. Set main as default branch on GitHub: `gh repo edit --default-branch main`
    5. Delete remote master: `git push origin --delete master`
    6. Delete local master: `git branch -d master`

    Verify each step succeeds before proceeding to the next. If the merge has conflicts (unlikely since main is simply behind), resolve them by accepting master's changes.
  </action>
  <verify>
    <automated>git branch -a && git remote show origin | head -10</automated>
  </verify>
  <done>Only "main" branch exists locally and remotely. origin/HEAD points to origin/main. No master branch anywhere.</done>
</task>

<task type="auto">
  <name>Task 2: Replace README with proper app description</name>
  <files>README.md</files>
  <action>
    Replace the entire contents of README.md with a proper project description. No emojis anywhere (per CLAUDE.md).

    The README should include:

    **Title:** RPE -- Gym Workout Tracker

    **Description:** A React Native (Expo) workout tracking app for logging gym sessions, tracking personal records, and monitoring progress over time.

    **Features section** (bulleted list):
    - Exercise library with built-in and custom exercises
    - Workout plan creation with day-by-day scheduling
    - Live workout logging with focus mode (one exercise at a time)
    - Personal record (PR) tracking and celebration
    - Body metrics tracking (weight, chest, waist, hips measurements)
    - Progress dashboard with charts and trends
    - Workout alarm and reminder notifications
    - Offline-first with cloud sync

    **Tech Stack section:**
    - React Native with Expo SDK 55
    - TypeScript
    - Supabase (PostgreSQL database, authentication, real-time sync)
    - Zustand + MMKV for state management and local persistence
    - Expo Router (file-based routing)

    **Getting Started section** with:
    1. Clone the repo
    2. `npm install`
    3. Copy `.env.example` to `.env` and fill in Supabase credentials
    4. `npx expo start`

    **License section:** MIT (or omit if no LICENSE file exists -- check first)

    Keep it concise and professional. No boilerplate Expo template text.
  </action>
  <verify>
    <automated>head -50 README.md</automated>
  </verify>
  <done>README.md contains accurate RPE app description with features, tech stack, and getting started. No emojis. No Expo boilerplate.</done>
</task>

</tasks>

<verification>
- `git branch -a` shows only main (no master)
- `git remote show origin` shows HEAD branch: main
- README.md starts with "# RPE" and contains no emoji characters
</verification>

<success_criteria>
- main is the only branch, set as default on GitHub
- master is fully deleted (local + remote)
- README.md accurately describes the RPE workout tracking app
- All changes committed and pushed
</success_criteria>

<output>
After completion, create `.planning/quick/18-make-main-default-branch-merge-master-in/18-SUMMARY.md`
</output>
