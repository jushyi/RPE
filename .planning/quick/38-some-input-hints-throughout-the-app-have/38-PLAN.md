---
phase: quick-38
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/social/components/HandleSetup.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - Handle setup hint text reads as a single clean sentence with no extra space between the two clauses
  artifacts:
    - path: src/features/social/components/HandleSetup.tsx
      provides: Fixed hint text without mid-sentence extra whitespace
  key_links: []
---

<objective>
Fix the handle setup hint text that renders with an unwanted space in the middle due to a JSX multiline string split across two lines inside a single `<Text>` element.

Purpose: The text "3-20 characters, lowercase letters, numbers and underscores only. Must start with a letter." currently renders as "...underscores only.  Must start with a letter." because React Native treats the line break + indentation as whitespace.
Output: Hint text reads cleanly as a single string with no extra space.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix multiline JSX hint text in HandleSetup</name>
  <files>src/features/social/components/HandleSetup.tsx</files>
  <action>
    In HandleSetup.tsx, locate the `<Text style={s.hintText}>` block at approximately line 257.
    It currently reads:

    ```
    <Text style={s.hintText}>
      3-20 characters, lowercase letters, numbers and underscores only.
      Must start with a letter.
    </Text>
    ```

    React Native renders the line break between the two lines as whitespace, producing:
    "3-20 characters, lowercase letters, numbers and underscores only.  Must start with a letter."

    Fix by combining into a single string on one line:

    ```
    <Text style={s.hintText}>
      {'3-20 characters, lowercase letters, numbers and underscores only. Must start with a letter.'}
    </Text>
    ```

    Using a JSX expression `{' ... '}` (or keeping it as a single unbroken text node) eliminates the whitespace injection.
  </action>
  <verify>
    Visual: render HandleSetup in step mode — the hint text below the handle input should show as a single clean paragraph with no double space between "only." and "Must".
    Code: confirm `src/features/social/components/HandleSetup.tsx` has no line break inside the hintText `<Text>` block.
  </verify>
  <done>Hint text displays as one continuous sentence with a single space between the two clauses.</done>
</task>

</tasks>

<verification>
Open the app to Settings > Handle, or the onboarding handle step.
The hint text beneath the @handle input should read:
"3-20 characters, lowercase letters, numbers and underscores only. Must start with a letter."
with exactly one space after the period — no double space or weird gap visible.
</verification>

<success_criteria>
- HandleSetup hint text renders with correct single-space separation between sentences.
- No other regressions introduced.
</success_criteria>

<output>
After completion, create `.planning/quick/38-some-input-hints-throughout-the-app-have/38-SUMMARY.md`
</output>
