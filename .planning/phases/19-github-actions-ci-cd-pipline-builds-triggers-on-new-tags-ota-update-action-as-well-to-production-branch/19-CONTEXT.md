# Phase 19: GitHub Actions CI/CD - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up GitHub Actions workflows for automated builds and OTA updates. No more running `eas build` or `eas update` manually from the local machine. Triggered by Git tags and PR events.

</domain>

<decisions>
## Implementation Decisions

### Tag convention & triggers
- Two separate workflows triggered by different tag formats
- `v1.0.0` semver tags → native EAS Build workflow (full native iOS build + TestFlight upload)
- `ota/v1.0.1` prefixed tags → OTA update workflow (JS bundle push to production channel only)
- Both workflows are tag-triggered; manual workflow dispatch not required

### Native build workflow (v* tags)
- iOS only — Android deferred (consistent with Phase 10 decision)
- EAS Build using production profile → auto-submit to TestFlight via `eas submit`
- Creates a GitHub Release on successful build with auto-generated changelog from commit messages
- Failure notification: GitHub default email only (no Slack/Discord webhooks)

### OTA update workflow (ota/* tags)
- Pushes JS bundle to the `production` EAS Update channel only
- Matches the channel configured in quick-40 and eas.json production profile
- No native build step — JS-only update

### PR/branch CI checks
- Separate workflow runs on every PR and every push to `main`
- Checks: TypeScript type checking (`tsc --noEmit`) + ESLint
- No test runner (no test suite exists)
- Purpose: catch type errors and lint issues before they reach a tagged release

### Failure handling
- GitHub's default email notifications for workflow failures — zero extra setup
- No Discord or Slack webhooks
- Successful v* releases create a GitHub Release entry (auto-changelog from commits)
- Successful OTA pushes run silently — check EAS dashboard if needed

### Claude's Discretion
- Exact workflow YAML structure and job names
- Node.js version used in workflows
- Whether to cache node_modules in workflows
- GitHub Release body format (tag diff vs full commit log)
- Whether PR checks block merges (branch protection rules) or are advisory only

</decisions>

<specifics>
## Specific Ideas

- No special setup needed for notifications — GitHub email is sufficient for a small friend-group project
- GitHub Release on v* tags provides a useful changelog record over time

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `eas.json`: production profile with `channel: "production"`, `autoIncrement: true`, `appVersionSource: "remote"` — workflow uses this profile directly
- `eas.json` submit config: `ascAppId: "6760412044"` already set — `eas submit` will use this for TestFlight upload
- `app.json`: `runtimeVersion.policy: "appVersion"` and EAS Update URL `https://u.expo.dev/8ea209dd-0ed7-4d73-9aee-3a6fe3993657` — OTA workflow targets this project

### Established Patterns
- EAS-managed credentials (Phase 10) — no Apple certificates to store in GitHub secrets beyond `EXPO_TOKEN`
- iOS-only distribution (Phase 10) — native build targets iOS only

### Integration Points
- `.github/workflows/` directory needs to be created (doesn't exist yet)
- GitHub repository secret needed: `EXPO_TOKEN` (Expo personal access token for EAS CLI auth)
- EAS CLI is the primary tool used in all three workflows (`eas build`, `eas update`, `eas submit`)
- `package.json` scripts may need a `lint` and `typecheck` entry if not already present (for PR checks workflow)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-github-actions-ci-cd-pipline-builds-triggers-on-new-tags-ota-update-action-as-well-to-production-branch*
*Context gathered: 2026-03-13*
