---
status: resolved
trigger: "PR celebration not working - no celebration overlay or acknowledgement in summary"
created: 2026-03-10T00:00:00Z
updated: 2026-03-10T14:00:00Z
---

## Current Focus

hypothesis: is_pr flag is hardcoded to false in handleLogSet; PR detection result is never written back to the set
test: trace data flow from PR detection through set logging to summary
expecting: is_pr should reflect detectPR result but it does not
next_action: return diagnosis

## Symptoms

expected: Full-screen PR celebration overlay on PR detection; PR badge on logged sets; PRs acknowledged in summary
actual: No celebration, no PR acknowledgement in summary, PRs always show 0
errors: none (silent logic bug)
reproduction: Log a set that exceeds previous best weight
started: Likely since initial implementation

## Eliminated

(none needed - root cause identified on first pass)

## Evidence

- timestamp: 2026-03-10
  checked: workout/index.tsx handleLogSet (line 67)
  found: is_pr is hardcoded to `false` on every logged set
  implication: Even when detectPR returns isPR=true, the set stored in workoutStore always has is_pr=false

- timestamp: 2026-03-10
  checked: SessionSummary.tsx computeSessionSummary (line 35)
  found: prs_hit counter increments only when set.is_pr === true
  implication: Since is_pr is always false, summary always shows 0 PRs

- timestamp: 2026-03-10
  checked: ExercisePage.tsx handleLog (lines 29-46)
  found: PR detection IS called and celebration state IS set correctly
  implication: The celebration overlay SHOULD appear - but there may be a race/ordering issue

- timestamp: 2026-03-10
  checked: ExercisePage.tsx handleLog ordering (lines 31-46)
  found: onDetectPR is awaited, then onLogSet is called synchronously after
  implication: Celebration should work if detectPR resolves correctly - the wiring from index->pager->page is correct

- timestamp: 2026-03-10
  checked: summary.tsx (lines 80-94)
  found: Summary renders SessionSummaryCard which shows prs_hit count, but no special PR celebration/callout section
  implication: Even if is_pr were correct, summary only shows a number - no special acknowledgement

## Resolution

root_cause: |
  PRIMARY BUG: In app/(app)/workout/index.tsx line 67, handleLogSet hardcodes `is_pr: false` for every set.
  The PR detection result from usePRDetection is never fed back into the set data stored in workoutStore.
  This means:
  1. The summary screen's computeSessionSummary counts is_pr flags -> always 0
  2. Any PR badge logic depending on is_pr in stored sets would fail

  SECONDARY ISSUE: The celebration overlay in ExercisePage.tsx appears to be wired correctly
  (detectPR is called, result checked, celebration state set). However, the handleLogSet in
  index.tsx does not participate in PR detection at all - it just stores the set with is_pr:false.
  The actual PR detection happens in ExercisePage's handleLog wrapper, which calls onDetectPR
  (threaded correctly through the component tree). So the celebration MAY work for the overlay,
  but the persisted data is always wrong.

  TERTIARY ISSUE: The summary screen has no special PR acknowledgement section beyond the
  numeric "PRs" stat box (which always shows 0 due to the primary bug).

fix: not yet applied
verification: not yet done
files_changed: []
