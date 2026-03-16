# Phase 19: GitHub Actions CI/CD Pipeline - Research

**Researched:** 2026-03-16
**Domain:** GitHub Actions, EAS CLI, CI/CD for Expo/React Native
**Confidence:** HIGH

## Summary

This phase sets up three GitHub Actions workflows: (1) a native iOS EAS Build + TestFlight submit triggered by semver tags (`v*`), (2) an OTA-only EAS Update triggered by `ota/*` tags, and (3) a PR/push CI check running TypeScript type checking and ESLint. All three workflows use the official `expo/expo-github-action@v8` action for EAS CLI authentication and setup, with `EXPO_TOKEN` as the sole required repository secret.

The project already has all EAS configuration in place (`eas.json` production profile with channel, auto-increment, and submit config). The `package.json` has a `lint` script (`expo lint`) but no dedicated `typecheck` script -- one needs to be added. The `.github/workflows/` directory does not exist yet and must be created.

**Primary recommendation:** Use `expo/expo-github-action@v8` with Node 22, `npm ci` for installs, and `--non-interactive` flag on all EAS commands. Use `gh release create` (built into GitHub Actions runner) for release creation rather than a third-party action.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two separate workflows triggered by different tag formats
- `v1.0.0` semver tags trigger native EAS Build workflow (full native iOS build + TestFlight upload)
- `ota/v1.0.1` prefixed tags trigger OTA update workflow (JS bundle push to production channel only)
- Both workflows are tag-triggered; manual workflow dispatch not required
- iOS only -- Android deferred (consistent with Phase 10 decision)
- EAS Build using production profile with auto-submit to TestFlight via `eas submit`
- Creates a GitHub Release on successful build with auto-generated changelog from commit messages
- Failure notification: GitHub default email only (no Slack/Discord webhooks)
- OTA pushes JS bundle to the `production` EAS Update channel only
- No native build step for OTA -- JS-only update
- Separate PR/push CI workflow: TypeScript type checking (`tsc --noEmit`) + ESLint
- No test runner (no test suite exists)
- GitHub default email notifications for workflow failures

### Claude's Discretion
- Exact workflow YAML structure and job names
- Node.js version used in workflows (recommendation: Node 22 LTS)
- Whether to cache node_modules in workflows (recommendation: yes, via actions/setup-node cache)
- GitHub Release body format (recommendation: `--generate-notes` for auto-changelog)
- Whether PR checks block merges (branch protection rules) or are advisory only (recommendation: advisory only, document how to enable branch protection if desired later)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| expo/expo-github-action | v8 (8.2.1) | Sets up EAS CLI and Expo authentication in GitHub Actions | Official Expo action; handles auth token export, caching, and CLI install |
| actions/checkout | v5 | Checks out repository code | Standard GitHub action for repo checkout |
| actions/setup-node | v6 | Installs Node.js with npm cache | Standard Node.js setup with built-in caching |
| EAS CLI | latest (via action) | Runs `eas build`, `eas update`, `eas submit` | Expo's official build and update toolchain |
| GitHub CLI (gh) | pre-installed | Creates GitHub Releases | Built into ubuntu-latest runners; no extra action needed |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `--non-interactive` flag | Prevents EAS CLI prompts in CI | Every EAS command in CI |
| `--no-wait` flag | Exits after build is queued on EAS servers | Optional for build workflow if you want faster CI completion |
| `--auto-submit` flag | Automatically submits to TestFlight after build | On `eas build` for production iOS |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `gh release create` | softprops/action-gh-release | Third-party action adds dependency; `gh` is built-in and simpler |
| `--no-wait` on build | Wait for build completion | Waiting ties up the runner for 15-30min; `--no-wait` is faster but no in-CI failure detection |
| EAS Workflows (.eas/workflows/) | GitHub Actions | EAS Workflows is Expo's own CI system; GitHub Actions gives more control and is what user requested |

## Architecture Patterns

### Recommended Project Structure
```
.github/
  workflows/
    build-ios.yml        # Triggered by v* tags - EAS Build + Submit + GitHub Release
    ota-update.yml       # Triggered by ota/* tags - EAS Update to production
    ci-checks.yml        # Triggered by PR + push to main - tsc + eslint
```

### Pattern 1: Tag-Triggered Build Workflow (build-ios.yml)
**What:** Full native iOS build triggered by pushing a semver tag
**When to use:** Every new app version that requires a native binary
**Example:**
```yaml
# Source: https://docs.expo.dev/build/building-on-ci/
name: iOS Build & Submit
on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write  # Required for GitHub Release creation

jobs:
  build:
    name: EAS Build iOS
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --platform ios --profile production --non-interactive --auto-submit
      - name: Create GitHub Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh release create "${{ github.ref_name }}" \
            --repo="$GITHUB_REPOSITORY" \
            --title="${{ github.ref_name }}" \
            --generate-notes
```

### Pattern 2: OTA Update Workflow (ota-update.yml)
**What:** JS-only OTA update pushed to EAS Update production channel
**When to use:** JS/asset-only changes that don't need a new native binary
**Example:**
```yaml
name: OTA Update
on:
  push:
    tags:
      - 'ota/*'

jobs:
  update:
    name: EAS Update Production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas update --channel production --message "OTA ${{ github.ref_name }}" --non-interactive
```

### Pattern 3: PR/Push CI Checks (ci-checks.yml)
**What:** Type checking and linting on PRs and pushes to main
**When to use:** Every PR and every push to main
**Example:**
```yaml
name: CI Checks
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  checks:
    name: TypeScript & ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: TypeScript Check
        run: npx tsc --noEmit
      - name: ESLint
        run: npm run lint
```

### Anti-Patterns to Avoid
- **Using `--no-wait` with `--auto-submit`:** The `--auto-submit` flag requires the build to complete in-session so EAS can trigger submission. If using `--auto-submit`, do NOT use `--no-wait`.
- **Storing Apple credentials in GitHub secrets:** EAS manages credentials remotely (Phase 10 decision). Do NOT add Apple IDs, certificates, or provisioning profiles to GitHub secrets.
- **Running `npm install` instead of `npm ci`:** `npm ci` is faster, deterministic, and correct for CI -- it installs from lockfile exactly.
- **Hardcoding EAS CLI version:** Use `eas-version: latest` to stay current; EAS CLI updates frequently.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expo/EAS authentication in CI | Manual token export scripts | `expo/expo-github-action@v8` | Handles caching, token export, CLI install automatically |
| Release changelog generation | Custom commit parsing scripts | `gh release create --generate-notes` | GitHub auto-generates changelog from PR titles and commit messages |
| Node.js caching | Manual cache restore/save steps | `actions/setup-node` with `cache: npm` | Built-in npm/yarn/pnpm caching support |
| iOS build orchestration | Shell scripts calling xcodebuild | `eas build --platform ios` | EAS handles remote builds, code signing, provisioning |

## Common Pitfalls

### Pitfall 1: Missing EXPO_TOKEN Secret
**What goes wrong:** All EAS commands fail with authentication error
**Why it happens:** Repository secret not set up before first workflow run
**How to avoid:** Add `EXPO_TOKEN` as a repository secret in GitHub Settings > Secrets and variables > Actions before pushing any workflow files. Generate token at https://expo.dev/settings/access-tokens
**Warning signs:** "Not logged in" or "Authentication required" errors in workflow logs

### Pitfall 2: --auto-submit Combined with --no-wait
**What goes wrong:** Build is queued but submission never happens because the CI step exits before build completes
**Why it happens:** `--no-wait` tells EAS CLI to exit immediately; `--auto-submit` needs the build to finish in the same session
**How to avoid:** Do NOT use `--no-wait` when `--auto-submit` is set. The build step will take 15-30 minutes but that is expected.
**Warning signs:** Build succeeds on EAS dashboard but no TestFlight submission appears

### Pitfall 3: Tag Pattern Overlap
**What goes wrong:** Both workflows trigger on the same tag, or neither triggers
**Why it happens:** Misconfigured tag glob patterns
**How to avoid:** Use `v*` (matches `v1.0.0`, `v2.0.0-beta`) for builds and `ota/*` (matches `ota/v1.0.1`) for OTA. These patterns are mutually exclusive.
**Warning signs:** Unexpected workflow runs or missing workflow runs after tag push

### Pitfall 4: permissions Block Missing for Release Creation
**What goes wrong:** `gh release create` fails with 403 Forbidden
**Why it happens:** GitHub Actions tokens have restricted permissions by default; `contents: write` is required
**How to avoid:** Add `permissions: contents: write` at the job or workflow level
**Warning signs:** "Resource not accessible by integration" error

### Pitfall 5: tsc --noEmit Fails Due to Missing Type Declarations
**What goes wrong:** TypeScript check fails in CI but works locally
**Why it happens:** Generated files (like `expo-env.d.ts`, `nativewind-env.d.ts`) may be gitignored or missing in CI
**How to avoid:** Ensure `expo-env.d.ts` is either committed or generated before `tsc` runs. The project `.gitignore` includes `expo-env.d.ts` -- need to either remove it from gitignore or run `npx expo customize tsconfig.json` in CI before type checking.
**Warning signs:** "Cannot find type definition" errors only in CI

### Pitfall 6: npm ci Fails on Lockfile Mismatch
**What goes wrong:** `npm ci` errors out because package-lock.json is out of date
**Why it happens:** Developer ran `npm install` locally but forgot to commit updated lockfile
**How to avoid:** Always commit `package-lock.json` changes. CI will catch this as a fail-fast signal.
**Warning signs:** "npm ci can only install packages when your package-lock.json..."

## Code Examples

### Creating and Pushing a Build Tag
```bash
# Source: Standard git tagging workflow
git tag v1.0.0
git push origin v1.0.0
```

### Creating and Pushing an OTA Tag
```bash
git tag ota/v1.0.1
git push origin ota/v1.0.1
```

### Adding typecheck Script to package.json
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

### EXPO_TOKEN Setup (one-time manual step)
```
1. Go to https://expo.dev/settings/access-tokens
2. Create a new personal access token (name: "github-actions")
3. Go to https://github.com/jushyi/RPE/settings/secrets/actions
4. Add new repository secret: Name=EXPO_TOKEN, Value=<token from step 2>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `expo/expo-github-action@v7` | `@v8` (8.2.1) | 2024 | v8 consolidates setup, adds eas-cache and packager inputs |
| `actions/checkout@v3` | `@v5` | 2024 | v5 is current; v3/v4 still work but v5 recommended |
| `actions/setup-node@v3` | `@v6` | 2025 | v6 adds more cache options; v4 also acceptable |
| `actions/create-release` (archived) | `gh release create` | 2022 | Official action was archived; `gh` CLI is the recommended replacement |
| Manual EAS CLI install (`npm i -g eas-cli`) | `expo/expo-github-action` with `eas-version` | 2023 | Action handles install + caching automatically |

**Deprecated/outdated:**
- `actions/create-release@v1`: Archived by GitHub. Use `gh release create` instead.
- `expo/expo-github-action@v7`: Superseded by v8 with better caching and packager support.

## Open Questions

1. **--auto-submit vs separate eas submit step**
   - What we know: `eas build --auto-submit` combines build + submit in one command. Alternatively, you can run `eas build` then separately `eas submit`.
   - What's unclear: Whether `--auto-submit` works reliably in CI without interactive prompts for App Store Connect review details.
   - Recommendation: Use `--auto-submit` with `--non-interactive` -- this is the documented CI approach and the `ascAppId` is already configured in `eas.json`.

2. **expo-env.d.ts in .gitignore**
   - What we know: The project gitignores `expo-env.d.ts` but `tsconfig.json` includes it. `tsc --noEmit` may fail in CI without it.
   - What's unclear: Whether `npx expo customize` or a prebuild step generates it in CI, or if Expo SDK 55 generates it automatically on `npm ci`.
   - Recommendation: Test locally with a clean checkout to see if `tsc --noEmit` passes without the file. If not, either remove from `.gitignore` and commit it, or add a generation step before `tsc`.

3. **Build duration and runner costs**
   - What we know: EAS Build runs remotely on Expo servers, so the GitHub Actions runner only waits. Build takes 15-30 minutes.
   - What's unclear: Whether the free GitHub Actions minutes budget is sufficient.
   - Recommendation: For a small friend-group project, free tier (2000 min/month) is more than adequate. Only ~3-4 builds per month expected.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | jest 29.7.0 + jest-expo 55.0.9 |
| Config file | package.json (`"test": "jest --bail"`) |
| Quick run command | `npm test -- --bail` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| N/A-1 | build-ios.yml triggers on v* tags and runs eas build | manual-only | Push v* tag to repo, verify GH Actions run | N/A - workflow validation |
| N/A-2 | ota-update.yml triggers on ota/* tags and runs eas update | manual-only | Push ota/* tag to repo, verify GH Actions run | N/A - workflow validation |
| N/A-3 | ci-checks.yml runs tsc and eslint on PRs | manual-only | Open PR, verify checks appear | N/A - workflow validation |
| N/A-4 | GitHub Release created on successful v* build | manual-only | After build completes, check Releases page | N/A - workflow validation |

### Sampling Rate
- **Per task commit:** `npm test -- --bail` (should pass -- no test changes expected)
- **Per wave merge:** `npm test`
- **Phase gate:** All three workflow YAML files exist and are syntactically valid. Manual push of a test tag to verify end-to-end.

### Wave 0 Gaps
- [ ] Add `"typecheck": "tsc --noEmit"` to package.json scripts
- [ ] Verify `tsc --noEmit` passes in clean checkout (expo-env.d.ts concern)
- [ ] Ensure `.github/workflows/` directory is created

## Sources

### Primary (HIGH confidence)
- [Expo - Trigger builds from CI](https://docs.expo.dev/build/building-on-ci/) - EAS Build GitHub Actions workflow, EXPO_TOKEN setup, --non-interactive flag
- [expo/expo-github-action GitHub](https://github.com/expo/expo-github-action) - v8 action inputs, caching, authentication details
- [Expo - GitHub Action for PR previews](https://docs.expo.dev/eas-update/github-actions/) - EAS Update workflow with preview action

### Secondary (MEDIUM confidence)
- [GitHub Marketplace - Expo GitHub Action](https://github.com/marketplace/actions/expo-github-action) - Action version 8.2.1 confirmed
- [GitHub - actions/create-release](https://github.com/actions/create-release) - Archived status confirmed, gh CLI is replacement

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Expo documentation and GitHub Action verified
- Architecture: HIGH - Standard three-workflow pattern well-documented by Expo
- Pitfalls: HIGH - Based on documented CI gotchas and verified project configuration

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable domain, GitHub Actions and EAS CLI are mature)
