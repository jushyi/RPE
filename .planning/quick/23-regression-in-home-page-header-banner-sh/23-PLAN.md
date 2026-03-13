---
phase: quick-23
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/(tabs)/_layout.tsx
autonomous: true
requirements: [QUICK-23]

must_haves:
  truths:
    - "Home tab shows only the custom animated welcome-back header, not a 'Home' banner"
    - "Scrolling down hides the welcome-back header; scrolling up reveals it"
  artifacts:
    - path: "app/(app)/(tabs)/_layout.tsx"
      provides: "Tab layout with headerShown: false on dashboard tab"
  key_links:
    - from: "app/(app)/(tabs)/_layout.tsx"
      to: "app/(app)/(tabs)/dashboard.tsx"
      via: "headerShown: false lets dashboard manage its own header"
      pattern: "headerShown.*false"
---

<objective>
Remove the "Home" header banner that regressed onto the dashboard tab by disabling the Expo Router default tab header for the dashboard screen.

Purpose: The dashboard already renders its own custom animated header (the "Welcome back, [name]" banner with scroll-hide behavior). The `_layout.tsx` file was changed to include `headerShown: true` on the dashboard tab, which makes Expo Router render a second system header titled "Home" above the custom one.

Output: The dashboard shows only the animated custom header; the "Home" system header is gone.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md

Root cause: In `app/(app)/(tabs)/_layout.tsx`, the dashboard `Tabs.Screen` has:
```
headerShown: true,
headerStyle: { backgroundColor: colors.surface },
headerTintColor: colors.textPrimary,
```
This renders Expo Router's default tab header with the title "Home" on top of the dashboard's own animated header. The fix is to remove these three lines (or set `headerShown: false`). Other tabs (exercises, plans) correctly omit `headerShown`, defaulting to false per the `screenOptions` above.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove headerShown from dashboard tab options</name>
  <files>app/(app)/(tabs)/_layout.tsx</files>
  <action>
In `app/(app)/(tabs)/_layout.tsx`, find the `Tabs.Screen` for the `dashboard` route and remove the three lines that override the header:

```
headerShown: true,
headerStyle: { backgroundColor: colors.surface },
headerTintColor: colors.textPrimary,
```

After removal the dashboard options block should only contain the tab label and icon:

```typescript
<Tabs.Screen
  name="dashboard"
  options={{
    title: 'Home',
    tabBarIcon: ({ color }) => (
      <Ionicons name="home-outline" size={20} color={color} />
    ),
  }}
/>
```

Do NOT touch the `settings` tab — it legitimately uses `headerShown: true` for its system header. Do NOT touch any other file.
  </action>
  <verify>
    <automated>grep -n "headerShown" "app/(app)/(tabs)/_layout.tsx"</automated>
  </verify>
  <done>
    - The word "headerShown" only appears once in _layout.tsx, on the `settings` tab
    - The dashboard Tabs.Screen options block contains no headerShown, headerStyle, or headerTintColor keys
  </done>
</task>

</tasks>

<verification>
Confirm the regression is fixed:
1. `grep -n "headerShown" "app/(app)/(tabs)/_layout.tsx"` — must return only the settings tab line, not the dashboard tab
2. No "Home" banner appears above the dashboard welcome-back header at runtime
3. Scroll-hide behavior of the animated header is unaffected (no changes to dashboard.tsx)
</verification>

<success_criteria>
- Dashboard shows "Welcome back, [name]" animated header only — no "Home" system banner
- Scrolling down hides the welcome-back header; scrolling up reveals it
- Settings tab still shows its own system header (unchanged)
- No other tabs affected
</success_criteria>

<output>
After completion, create `.planning/quick/23-regression-in-home-page-header-banner-sh/23-SUMMARY.md` with what was changed and why.
</output>
