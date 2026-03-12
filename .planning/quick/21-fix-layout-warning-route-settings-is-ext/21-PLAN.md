---
phase: quick-21
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/_layout.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "No layout warning about extraneous 'settings' route appears in console"
  artifacts:
    - path: "app/(app)/_layout.tsx"
      provides: "App stack layout without duplicate settings route"
  key_links: []
---

<objective>
Remove the extraneous Stack.Screen entry for "settings" in the app-level layout.

Purpose: The settings screen is defined as a tab in `app/(app)/(tabs)/_layout.tsx` with its file at `app/(app)/(tabs)/settings.tsx`. There is also a `Stack.Screen name="settings"` in `app/(app)/_layout.tsx` that has no corresponding file at the app level — this causes the "Route 'settings' is extraneous" layout warning. Removing the stack entry eliminates the warning while keeping the tab-based settings screen fully functional.

Output: Clean app layout with no extraneous route warnings.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(app)/_layout.tsx
@app/(app)/(tabs)/_layout.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove extraneous settings Stack.Screen from app layout</name>
  <files>app/(app)/_layout.tsx</files>
  <action>
    In `app/(app)/_layout.tsx`, delete lines 76-79 — the Stack.Screen entry for "settings":

    ```
    <Stack.Screen
      name="settings"
      options={{ title: 'Settings' }}
    />
    ```

    This route is already handled by the tabs layout at `app/(app)/(tabs)/settings.tsx` and does not need a separate stack entry. No other file references a stack-level settings route (verified: no router.push/navigate calls target a non-tab settings path).
  </action>
  <verify>
    <automated>npx expo export --platform web --output-dir /tmp/expo-check 2>&1 | grep -i "settings" || echo "No settings warnings"</automated>
  </verify>
  <done>The "Route 'settings' is extraneous" warning no longer appears. The settings tab continues to work as before via the tabs layout.</done>
</task>

</tasks>

<verification>
- No "extraneous" warnings related to settings route in console output
- Settings tab still accessible and functional in the app
</verification>

<success_criteria>
- The layout warning "Route 'settings' is extraneous" is eliminated
- Settings screen remains accessible as a bottom tab
</success_criteria>

<output>
After completion, create `.planning/quick/21-fix-layout-warning-route-settings-is-ext/21-SUMMARY.md`
</output>
