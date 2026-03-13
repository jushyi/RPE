---
phase: quick-39
plan: 39
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/calculator/components/BarbellDiagram.tsx
autonomous: true
requirements: [QUICK-39]
must_haves:
  truths:
    - "The collar is visibly taller than both bar sections"
    - "The right bar (sleeve, to the right of the collar) is slightly taller than the left bar stub"
    - "Both bar sections and the collar remain vertically centered"
  artifacts:
    - path: "src/features/calculator/components/BarbellDiagram.tsx"
      provides: "Updated barbell diagram with differentiated bar section heights"
  key_links:
    - from: "BarbellDiagram.tsx"
      to: "SVG Rect elements"
      via: "Two separate bar Rect elements with different heights replacing the single unified bar"
---

<objective>
Adjust the BarbellDiagram visual proportions: make the collar taller, and render the right bar sleeve (to the right of the collar where plates sit) slightly taller than the left bar stub (to the left of the collar).

Purpose: More realistic barbell appearance — real barbells have a thicker knurled sleeve and a distinct collar.
Output: Updated BarbellDiagram.tsx with two separate bar Rects (left stub, right sleeve) at different heights plus a taller collar.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/features/calculator/components/BarbellDiagram.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Split bar into left stub + right sleeve with differentiated heights</name>
  <files>src/features/calculator/components/BarbellDiagram.tsx</files>
  <action>
    Replace the single unified bar `Rect` with two separate `Rect` elements:

    1. **Left bar stub** (x=0 to COLLAR_X): Keep at current `BAR_HEIGHT = 36`. This is the handle end.
    2. **Right bar sleeve** (x = COLLAR_X + COLLAR_WIDTH to TOTAL_WIDTH): Use `SLEEVE_HEIGHT = 42` (slightly taller than 36). This is where plates sit.
    3. **Collar**: Increase `COLLAR_HEIGHT` from 57 to 70 (noticeably taller than both bar sections). Recompute `COLLAR_Y = (DIAGRAM_HEIGHT - COLLAR_HEIGHT) / 2`.

    All three elements (left bar, right bar, collar) must remain vertically centered using `(DIAGRAM_HEIGHT - height) / 2` for their Y values.

    Rename the existing single bar constants:
    - Keep `BAR_HEIGHT = 36` for the left stub
    - Add `SLEEVE_HEIGHT = 42` for the right bar section
    - Update `BAR_Y` to `LEFT_BAR_Y = (DIAGRAM_HEIGHT - BAR_HEIGHT) / 2`
    - Add `SLEEVE_Y = (DIAGRAM_HEIGHT - SLEEVE_HEIGHT) / 2`
    - Change `COLLAR_HEIGHT` from 57 to 70
    - Recompute `COLLAR_Y = (DIAGRAM_HEIGHT - COLLAR_HEIGHT) / 2`

    In the SVG render block, replace the single bar Rect with:
    ```
    {/* Left bar stub */}
    <Rect x={0} y={LEFT_BAR_Y} width={COLLAR_X} height={BAR_HEIGHT} rx={0} fill={BAR_COLOR} />
    {/* Right sleeve */}
    <Rect x={COLLAR_X + COLLAR_WIDTH} y={SLEEVE_Y} width={TOTAL_WIDTH - COLLAR_X - COLLAR_WIDTH} height={SLEEVE_HEIGHT} rx={0} fill={BAR_COLOR} />
    {/* Collar clamp */}
    <Rect x={COLLAR_X} y={COLLAR_Y} width={COLLAR_WIDTH} height={COLLAR_HEIGHT} rx={1} fill={COLLAR_COLOR} />
    ```

    Note: Collar must be rendered AFTER the bar sections so it draws on top and covers any gap between the two bar segments.
  </action>
  <verify>
    File compiles without TypeScript errors: `npx tsc --noEmit --project tsconfig.json 2>&1 | grep BarbellDiagram`

    Visually: In the calculator tab, the collar is taller than both bar sections, and the right sleeve section is slightly thicker than the left stub.
  </verify>
  <done>
    BarbellDiagram renders three distinct SVG Rect elements (left stub height 36, right sleeve height 42, collar height 70), all vertically centered. No TypeScript errors.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no new errors in BarbellDiagram.tsx
- Diagram shows left stub shorter than right sleeve, both shorter than collar
- Collar visually covers the join between left and right bar sections
</verification>

<success_criteria>
Collar height increased to 70, sleeve height set to 42, left bar stub remains 36. All three vertically centered. Single file change, no regressions.
</success_criteria>

<output>
After completion, create `.planning/quick/39-bar-diagram-collar-taller-and-right-bar-/39-SUMMARY.md`
</output>
