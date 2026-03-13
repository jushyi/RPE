---
phase: quick-40
plan: 40
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
autonomous: false
requirements: [QUICK-40]

must_haves:
  truths:
    - "Running `npm run update:production` publishes a JS bundle to the production OTA channel"
    - "The eas.json production build profile channel matches the OTA publish target"
  artifacts:
    - path: "package.json"
      provides: "update:production and update:preview npm scripts"
      contains: "eas update --channel production"
  key_links:
    - from: "eas.json build.production.channel"
      to: "eas update --channel production"
      via: "channel name must match exactly"
      pattern: "\"channel\": \"production\""
---

<objective>
Add convenience npm scripts for publishing OTA updates and push the first JS bundle to the production channel so TestFlight users receive updates automatically on next launch.

Purpose: The EAS Update infrastructure (expo-updates, runtimeVersion, updates URL, channel config) is already wired in. The missing piece is a reliable way to publish updates and a first bundle published to the production channel.
Output: npm scripts for OTA publishing, production channel populated with initial bundle.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@app.json
@eas.json
@package.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add OTA update npm scripts to package.json</name>
  <files>package.json</files>
  <action>
    Add two npm scripts to the "scripts" section in package.json:

    ```json
    "update:production": "eas update --channel production --message",
    "update:preview": "eas update --channel preview --message"
    ```

    These wrap `eas update` with the correct channel. The `--message` flag is intentional — the caller appends the message string (e.g., `npm run update:production "Fix chat bug"`). This is idiomatic for EAS Update workflows.

    Note: The existing production build profile in eas.json already has `"channel": "production"` — no changes needed there. The app.json already has `runtimeVersion: { policy: "appVersion" }` and the EAS project update URL — no changes needed there either.

    Verify the scripts were added correctly with: `node -e "const p = require('./package.json'); console.log(p.scripts['update:production'])"`
  </action>
  <verify>
    <automated>node -e "const p = require('./package.json'); if (!p.scripts['update:production']) process.exit(1); console.log('OK:', p.scripts['update:production'])"</automated>
  </verify>
  <done>package.json has update:production and update:preview scripts that invoke `eas update --channel {name} --message`</done>
</task>

<task type="checkpoint:human-action">
  <name>Task 2: Publish initial OTA bundle to production channel</name>
  <what-built>npm scripts are in place; eas update channel wiring is verified correct</what-built>
  <how-to-verify>
    Run this command in a terminal (requires EAS CLI authentication — must be interactive):

    ```bash
    eas update --channel production --message "Initial OTA bundle for production"
    ```

    Expected output:
    - "Bundle build successful" or similar build confirmation
    - "Published!" with a URL like https://expo.dev/accounts/spoodsjs/projects/gym-app/updates/...
    - Two platforms shown (iOS + Android) if publishing for both, or iOS only if that is the target

    After publishing, verify in EAS dashboard:
    ```bash
    eas update:list --channel production --limit 3
    ```
    Should show at least one update entry with the message "Initial OTA bundle for production".

    If you see an error about runtimeVersion mismatch: this is expected until a production binary is installed. The update is still correctly published — it will apply when the matching runtime is installed from TestFlight.
  </how-to-verify>
  <resume-signal>Type "published" when the eas update command succeeds, or describe any error</resume-signal>
</task>

</tasks>

<verification>
- package.json scripts include update:production and update:preview
- eas.json production build profile channel is "production" (already confirmed)
- app.json runtimeVersion policy is "appVersion" and updates.url is set (already confirmed)
- EAS update published to production channel (human confirmed)
</verification>

<success_criteria>
- `npm run update:production "message"` is a valid, documented way to ship JS-only fixes to TestFlight users without a new App Store build
- Production channel has at least one published update bundle
</success_criteria>

<output>
After completion, create `.planning/quick/40-set-up-ota-updates-for-production-profil/40-SUMMARY.md`
</output>
