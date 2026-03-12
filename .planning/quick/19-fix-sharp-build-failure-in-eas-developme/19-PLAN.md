---
phase: quick-19
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [package.json]
autonomous: true
requirements: [QUICK-19]
must_haves:
  truths:
    - "EAS build no longer fails on sharp native module compilation"
    - "Icon generation script remains available but does not block builds"
  artifacts:
    - path: "package.json"
      provides: "Dependencies without sharp"
    - path: "scripts/generate-icons.js"
      provides: "Icon generation script preserved with usage note"
  key_links: []
---

<objective>
Remove sharp from devDependencies to fix EAS build failure.

Purpose: sharp@0.34.5 tries to compile native code via node-gyp during EAS builds, which fails because node-addon-api is not available in the EAS build environment. sharp is only used by scripts/generate-icons.js, a one-time icon generation script whose output (PNG files in assets/images/) is already committed. It does not need to be installed during builds.

Output: package.json without sharp, working EAS build
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@package.json
@scripts/generate-icons.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove sharp from devDependencies and add usage comment to generate-icons.js</name>
  <files>package.json, scripts/generate-icons.js</files>
  <action>
1. Remove "sharp" from devDependencies in package.json. Do NOT run npm install yet.

2. Add a comment at the top of scripts/generate-icons.js (before the existing doc comment) noting that sharp must be installed locally before running:
   ```
   // NOTE: Requires sharp (npm install sharp) — intentionally not in devDependencies
   // to avoid native compilation failures in EAS cloud builds.
   // Icons are pre-generated; only re-run if design changes.
   ```

3. Run `npm install` to regenerate package-lock.json without sharp.

4. Verify sharp is gone: confirm "sharp" does not appear in package.json dependencies or devDependencies (it will still appear in scripts/ which is fine).
  </action>
  <verify>
    <automated>node -e "const p = require('./package.json'); if (p.devDependencies?.sharp || p.dependencies?.sharp) { console.error('FAIL: sharp still in package.json'); process.exit(1); } console.log('PASS: sharp removed from package.json')"</automated>
  </verify>
  <done>sharp removed from devDependencies, package-lock.json regenerated, generate-icons.js has usage note about manual sharp install</done>
</task>

</tasks>

<verification>
- `node -e "const p = require('./package.json'); console.log('sharp in deps:', !!p.dependencies?.sharp, 'sharp in devDeps:', !!p.devDependencies?.sharp)"` prints `false false`
- package-lock.json does not contain sharp as a direct dependency
- scripts/generate-icons.js still exists and has the sharp usage note
</verification>

<success_criteria>
- sharp is not in package.json dependencies or devDependencies
- package-lock.json is regenerated without sharp
- EAS build will no longer attempt to compile sharp from source
- Icon generation script preserved with clear instructions for future use
</success_criteria>

<output>
After completion, create `.planning/quick/19-fix-sharp-build-failure-in-eas-developme/19-SUMMARY.md`
</output>
