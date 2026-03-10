---
phase: quick
plan: 8
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(app)/plans/[id].tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Active Plan badge appears directly under the plan name inside the header bar"
    - "Badge is not rendered as a separate element below the header"
    - "Non-active plans show no badge, header remains unchanged"
    - "Edit mode hides the badge (existing behavior preserved)"
  artifacts:
    - path: "app/(app)/plans/[id].tsx"
      provides: "Plan detail screen with badge in header"
  key_links: []
---

<objective>
Move the "Active Plan" badge from its current position (a separate row below the header) into the header itself, positioned directly under the plan name text.

Purpose: Cleaner visual hierarchy — the active status is a property of the plan name, not a separate content section.
Output: Updated plan detail screen with badge in header.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(app)/plans/[id].tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move active badge into header under plan name</name>
  <files>app/(app)/plans/[id].tsx</files>
  <action>
In `app/(app)/plans/[id].tsx`, restructure the header to place the active badge under the plan name:

1. **Wrap the plan name + badge in a column container** — In the header's center section (where `headerTitle` text is), replace the bare `Text` element with a `View` (flex: 1, alignItems: 'center') containing:
   - The plan name `Text` (keep existing `headerTitle` style but remove `flex: 1` from it since the wrapper will have flex: 1)
   - Conditionally, the active badge row (only when `!isEditing && plan.is_active`)

2. **Remove the standalone active badge block** — Delete lines 221-227 (the `{!isEditing && plan.is_active && (...)}` block that sits between the header and content sections).

3. **Update styles:**
   - Add `headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 12 }` style
   - Update `headerTitle`: remove `flex: 1` and `marginHorizontal: 12` (parent handles these now), keep fontSize/fontWeight/color/textAlign
   - Update `activeBadge`: remove `paddingHorizontal: 16` (no longer full-width), keep flexDirection row, alignItems center, gap 4. Change paddingVertical to 2 for tighter spacing within header.
   - Keep `headerTitleInput` as-is (it's used in edit mode and already has flex: 1 + marginHorizontal)

4. The resulting JSX for the non-editing header center should look like:
   ```jsx
   <View style={s.headerCenter}>
     <Text style={s.headerTitle} numberOfLines={1}>{plan.name}</Text>
     {plan.is_active && (
       <View style={s.activeBadge}>
         <Ionicons name="checkmark-circle" size={14} color={colors.success} />
         <Text style={s.activeBadgeText}>Active Plan</Text>
       </View>
     )}
   </View>
   ```
   Note: No need for `!isEditing` check here since this whole branch is already inside the `!isEditing` ternary.
  </action>
  <verify>npx expo export --platform web --output-dir /tmp/expo-check 2>&1 | tail -5 || echo "Check TypeScript manually"; cd "C:/Users/maser/Desktop/Gym-App" && npx tsc --noEmit --pretty 2>&1 | tail -20</verify>
  <done>Active Plan badge renders inside the header directly under the plan name. No standalone badge section exists between header and content. Non-active plans and edit mode unaffected.</done>
</task>

</tasks>

<verification>
- Open a plan marked as active: badge with checkmark icon and "Active Plan" text appears under the plan name within the header bar
- Open a non-active plan: no badge shown, header displays only the plan name
- Enter edit mode on active plan: badge hidden, name input shown
- Badge does not appear as a separate row between header and content area
</verification>

<success_criteria>
- Active badge is visually nested under the plan name inside the header
- No layout regression in edit mode or non-active plan views
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/8-move-active-plan-badge-under-plan-name-i/8-SUMMARY.md`
</output>
