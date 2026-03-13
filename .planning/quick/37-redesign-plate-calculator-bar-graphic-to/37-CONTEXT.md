# Quick Task 37: Redesign plate calculator bar graphic — Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Task Boundary

Redesign the BarbellDiagram SVG component so the bar extends from the left edge of the container with plates pushed up against a visible collar. The current centered/floating layout wastes space and doesn't look like a real barbell.

</domain>

<decisions>
## Implementation Decisions

### Bar Extension Style
- Bar extends flush to the left edge of the container (x=0, no left padding), giving the impression the bar continues off-screen to the left

### Collar Appearance
- Replace the current subtle vertical line with a thick collar clamp rectangle (~28px tall, ~8px wide), slightly darker than the bar, clearly separating the sleeve area from the plate loading area

### Plate Stacking Direction
- Heaviest plates nearest the collar, lightest at the end — matches real-world loading order (current order is already correct)

### Claude's Discretion
- None — all areas discussed

</decisions>

<specifics>
## Specific Ideas

- Remove `alignItems: 'center'` from container so diagram is left-aligned
- Set bar x=0 with no left padding, extending full width
- Position collar clamp at a fixed offset from the left (~20px)
- Stack plates immediately after the collar, heaviest first
- Bar should extend past the last plate to the right for visual balance

</specifics>
