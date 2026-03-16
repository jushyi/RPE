---
phase: quick-44
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/plans/create.tsx
  - app/(app)/plans/[id].tsx
autonomous: true
requirements: [QUICK-44]
must_haves:
  truths:
    - "Keyboard does not cover input fields when editing plan name on create screen"
    - "Keyboard does not cover input fields when editing plan name or day names on plan detail edit screen"
    - "Inputs near the bottom of the screen remain visible and accessible when focused"
  artifacts:
    - path: "app/(app)/plans/create.tsx"
      provides: "KeyboardAvoidingView wrapping ScrollView"
      contains: "KeyboardAvoidingView"
    - path: "app/(app)/plans/[id].tsx"
      provides: "KeyboardAvoidingView wrapping edit mode ScrollView"
      contains: "KeyboardAvoidingView"
  key_links:
    - from: "app/(app)/plans/create.tsx"
      to: "react-native KeyboardAvoidingView"
      via: "import and wrap"
      pattern: "KeyboardAvoidingView.*behavior.*padding"
    - from: "app/(app)/plans/[id].tsx"
      to: "react-native KeyboardAvoidingView"
      via: "import and wrap"
      pattern: "KeyboardAvoidingView.*behavior.*padding"
---

<objective>
Fix keyboard covering input fields on plan create and plan edit screens.

Purpose: When editing plan names or day names near the bottom of the screen, the keyboard covers the input field making it impossible to see what is being typed. This is a usability bug.
Output: Both plan screens properly avoid keyboard occlusion using KeyboardAvoidingView.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(app)/plans/create.tsx
@app/(app)/plans/[id].tsx
@app/(app)/plans/coach-create.tsx (reference pattern — already has KeyboardAvoidingView)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add KeyboardAvoidingView to plan create and plan detail edit screens</name>
  <files>app/(app)/plans/create.tsx, app/(app)/plans/[id].tsx</files>
  <action>
Follow the pattern already established in coach-create.tsx:

**create.tsx:**
1. Add `KeyboardAvoidingView` and `Platform` to the react-native import (Platform may already be imported, check first).
2. Wrap the ScrollView with `<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>`.
3. Increase `paddingBottom` in `scrollContent` style from 60 to 120 to give more breathing room at the bottom when keyboard is open.

**[id].tsx:**
1. Add `KeyboardAvoidingView` and `Platform` to the react-native import.
2. In the edit mode branch (the `isEditing ? (...)` ternary, lines 244-258), wrap the `Animated.View` containing the ScrollView with `<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>`. The KeyboardAvoidingView should be OUTSIDE the Animated.View so it doesn't interfere with enter/exit animations. Alternatively, place it inside the Animated.View wrapping just the ScrollView.
3. Actually, the cleaner approach: wrap the ENTIRE content area (both the isEditing and !isEditing branches) with a single KeyboardAvoidingView. Place it after the header View and before the closing SafeAreaView tag, wrapping the entire ternary. Give it `style={{ flex: 1 }}`.
4. Increase `paddingBottom` in `scrollContent` style from 40 to 120 for adequate bottom spacing when keyboard is open.

Both files should use `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` — on Android, the default `windowSoftInputMode` (adjustResize) handles keyboard avoidance automatically. On iOS, 'padding' mode pushes content up.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Projects/Gym-App && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Both create.tsx and [id].tsx have KeyboardAvoidingView wrapping their scrollable content areas. TypeScript compiles without errors. Inputs near the bottom of the screen are no longer covered by the keyboard.</done>
</task>

</tasks>

<verification>
- Both files import and use KeyboardAvoidingView from react-native
- Platform.OS check used for iOS-specific 'padding' behavior
- Pattern matches existing coach-create.tsx implementation
- TypeScript compiles cleanly
</verification>

<success_criteria>
- KeyboardAvoidingView present in create.tsx wrapping ScrollView
- KeyboardAvoidingView present in [id].tsx wrapping edit/view content
- paddingBottom increased for adequate bottom spacing
- No TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/44-fix-keyboard-covering-input-fields-on-pl/44-SUMMARY.md`
</output>
