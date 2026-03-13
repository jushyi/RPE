---
phase: quick-29
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/onboarding/index.tsx
autonomous: true
requirements: [QUICK-29]
must_haves:
  truths:
    - "Onboarding screen uses SafeAreaView from react-native-safe-area-context, not the deprecated react-native version"
    - "App compiles without SafeAreaView deprecation warnings"
  artifacts:
    - path: "app/(app)/onboarding/index.tsx"
      provides: "Onboarding screen with correct SafeAreaView import"
      contains: "from 'react-native-safe-area-context'"
  key_links: []
---

<objective>
Replace the deprecated SafeAreaView import from react-native with the correct import from react-native-safe-area-context in the onboarding screen.

Purpose: The onboarding/index.tsx file is the only file in the codebase still importing SafeAreaView from react-native (deprecated). All other screens already use react-native-safe-area-context correctly.
Output: Updated onboarding/index.tsx with correct import.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(app)/onboarding/index.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace deprecated SafeAreaView import in onboarding screen</name>
  <files>app/(app)/onboarding/index.tsx</files>
  <action>
    In app/(app)/onboarding/index.tsx:
    1. Change line 2 from `import { SafeAreaView, StyleSheet } from 'react-native';` to two separate imports:
       - `import { StyleSheet } from 'react-native';`
       - `import { SafeAreaView } from 'react-native-safe-area-context';`
    2. No other changes needed. The SafeAreaView usage in the JSX is already correct and compatible with the react-native-safe-area-context API.

    Note: react-native-safe-area-context (~5.6.2) is already installed in the project.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Projects/Gym-App && npx tsc --noEmit --pretty 2>&1 | head -20</automated>
  </verify>
  <done>app/(app)/onboarding/index.tsx imports SafeAreaView from react-native-safe-area-context. No file in the codebase imports SafeAreaView from react-native.</done>
</task>

</tasks>

<verification>
grep -r "SafeAreaView" app/ src/ --include="*.tsx" --include="*.ts" | grep "from 'react-native'" | grep -v "safe-area-context" should return no results.
</verification>

<success_criteria>
- Zero files import SafeAreaView from react-native (only from react-native-safe-area-context)
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/29-replace-deprecated-safeareaview-with-rea/29-SUMMARY.md`
</output>
