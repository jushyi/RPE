---
phase: quick-37
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/calculator/components/BarbellDiagram.tsx
autonomous: true
requirements: [QUICK-37]
must_haves:
  truths:
    - "Bar extends from left edge of container flush (x=0, no gap)"
    - "Thick collar clamp rectangle is visible between bar shaft and plate loading area"
    - "Plates stack against collar with heaviest nearest collar, lightest at end"
    - "Bar extends past last plate to the right for visual balance"
  artifacts:
    - path: "src/features/calculator/components/BarbellDiagram.tsx"
      provides: "Redesigned barbell diagram with left-flush bar and collar clamp"
  key_links:
    - from: "BarbellDiagram.tsx"
      to: "PlateCalculator parent"
      via: "same props interface (plates, unit)"
      pattern: "BarbellDiagramProps"
---

<objective>
Redesign the BarbellDiagram SVG so the bar extends from the left edge of the container with a thick collar clamp rectangle, and plates stacked against the collar in real-world loading order.

Purpose: Current centered layout with a thin line collar wastes space and looks unrealistic. The redesign should look like a real barbell viewed from one side.
Output: Updated BarbellDiagram.tsx with left-flush bar and thick collar clamp.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/features/calculator/components/BarbellDiagram.tsx
@.planning/quick/37-redesign-plate-calculator-bar-graphic-to/37-CONTEXT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Redesign BarbellDiagram with left-flush bar and collar clamp</name>
  <files>src/features/calculator/components/BarbellDiagram.tsx</files>
  <action>
Modify BarbellDiagram.tsx with these specific changes:

1. **Container style:** Remove `alignItems: 'center'` from the container StyleSheet so the SVG is left-aligned within its parent.

2. **Bar positioning:** Keep `x=0` for the bar rect (already correct). Remove `BAR_LEFT_PAD` constant (no longer needed). The bar rect should span the full `totalWidth` as it does now — this gives the impression the bar continues off-screen to the left. Remove `rx` from the left side of the bar by either using `rx={0}` or keeping a small rx on the right end only (SVG Rect applies rx to both sides, so use `rx={0}` for a clean left edge).

3. **Collar clamp:** Replace the current `Line` element with a `Rect` element for the collar clamp:
   - Position: x = approximately 20px from left edge (this is where the sleeve meets the loading area)
   - Width: 8px
   - Height: 28px (taller than the bar but not as tall as plates)
   - Y: centered vertically `(DIAGRAM_HEIGHT - 28) / 2`
   - Fill: use a color slightly darker than BAR_COLOR. Since BAR_COLOR is `colors.surfaceElevated`, use `colors.textMuted` or a hardcoded `'#555'` — whichever contrasts better against the bar
   - rx: 1 for very slight rounding

4. **Plate positioning:** Update plate x-coordinate calculation so plates start immediately after the collar clamp (collar_x + collar_width + small gap of ~3px). Heaviest plates nearest the collar (current sort order is already correct — plates come in descending weight from the parent).

5. **Total width calculation:** Recalculate `totalWidth` as: `COLLAR_X + COLLAR_WIDTH + plateAreaWidth + 20` where the trailing 20px is the bar extending past the last plate for visual balance. `plateAreaWidth` remains `expandedPlates.length * (PLATE_WIDTH + PLATE_GAP)`.

6. **ViewBox:** Keep `viewBox="0 0 ${totalWidth} ${DIAGRAM_HEIGHT}"` with `width="100%"` so the diagram scales to container width.

Do NOT change the props interface, plate colors, plate heights, or plate rendering logic (labels, sizing). Only change positioning and the collar element.
  </action>
  <verify>
    <automated>cd C:/Users/maser/Projects/Gym-App && npx tsc --noEmit src/features/calculator/components/BarbellDiagram.tsx 2>&1 | head -20</automated>
  </verify>
  <done>
  - Bar starts at x=0 with no left padding or rounded left corner
  - Collar is a thick 8x28px rectangle at ~20px from left, darker than the bar
  - Plates stack immediately after collar, heaviest first
  - Bar extends ~20px past the last plate
  - Container no longer centers the SVG
  - Props interface unchanged
  </done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors
- Visual inspection: bar extends from left edge, thick collar clamp visible, plates stacked correctly
</verification>

<success_criteria>
BarbellDiagram renders with left-flush bar, visible collar clamp rectangle, and plates pushed against collar in correct order.
</success_criteria>

<output>
After completion, create `.planning/quick/37-redesign-plate-calculator-bar-graphic-to/37-SUMMARY.md`
</output>
