---
status: resolved
trigger: "Manually set PRs are not being used in the week-to-week PR calculation. User hit a 200kg squat during an exercise day but the app flagged it as a PR even though they have 227.5kg set as their squat PR."
created: 2026-03-16T00:00:00Z
updated: 2026-03-18T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Two-part mismatch between save and load paths causes manually-set PRs to be invisible to PR detection.
test: Unit tests pass. Fix applied and self-verified.
expecting: Human verification that the original issue (false PR flags on lower weights) no longer occurs.
next_action: Await human verification.

## Symptoms

expected: When a user performs a set (e.g., 200kg squat), the app should compare it against the user's set/saved PRs (227.5kg for squat) and NOT flag it as a new PR since 200kg < 227.5kg.
actual: The app flagged a 200kg squat as a new PR despite the user having 227.5kg already set as their squat PR.
errors: No error messages - the logic is silently using incorrect comparison data.
reproduction: Set a PR for an exercise (e.g., 227.5kg squat), then log a workout with a lower weight (e.g., 200kg). The app incorrectly flags the lower weight as a PR.
started: Has been the behavior - set PRs are not factored into PR detection.

## Eliminated

## Evidence

- timestamp: 2026-03-16T00:00:30Z
  checked: savePRBaselines (src/features/auth/hooks/usePRBaselines.ts)
  found: Upserts rows with exercise_name only (e.g., 'squat'), never sets exercise_id. Uses onConflict 'user_id,exercise_name'.
  implication: Manually-set PR rows have exercise_id = NULL in the database.

- timestamp: 2026-03-16T00:00:40Z
  checked: loadBaselines in usePRDetection (src/features/workout/hooks/usePRDetection.ts:68-74)
  found: Queries select('exercise_id, weight, unit') - loads rows keyed by exercise_id. Does NOT load exercise_name.
  implication: Rows with exercise_id = NULL are loaded but cannot be matched.

- timestamp: 2026-03-16T00:00:45Z
  checked: checkForPR (src/features/workout/hooks/usePRDetection.ts:40)
  found: baselines.find(b => b.exercise_id === exerciseId) - matches by UUID exercise_id only.
  implication: NULL exercise_id rows NEVER match. The manually-set 227.5kg PR is invisible to detection.

- timestamp: 2026-03-16T00:00:50Z
  checked: detectPR upsert (src/features/workout/hooks/usePRDetection.ts:130-141)
  found: Workout-time upsert sets exercise_id and uses onConflict 'user_id,exercise_id'. Different conflict key than savePRBaselines.
  implication: Two parallel upsert paths can create duplicate rows (one by exercise_name, one by exercise_id) for the same exercise.

- timestamp: 2026-03-16T00:00:55Z
  checked: Migration 20260312000001_update_pr_baselines_exercise_id.sql
  found: Backfills exercise_id for existing Big 3 rows at migration time. Only runs once.
  implication: Any PR baselines saved after migration via savePRBaselines still have NULL exercise_id.

- timestamp: 2026-03-16T00:01:00Z
  checked: PRBaselineForm and PRBaselineStep
  found: Both use savePRBaselines hook with hardcoded exercise_name slugs ('bench_press', 'squat', 'deadlift'). No exercise_id resolution.
  implication: The manual PR entry forms are the source of the NULL exercise_id rows.

- timestamp: 2026-03-16T00:02:00Z
  checked: Fix implementation and unit tests
  found: All 13 PR-related tests pass (7 in pr-detection.test.ts, 6 in pr-baseline.test.ts). Pre-existing sync-queue test failure confirmed unrelated.
  implication: Fix is correct and introduces no regressions.

## Resolution

root_cause: Two-part key mismatch between save and load paths. (1) savePRBaselines writes rows with exercise_name but NULL exercise_id. (2) loadBaselines/checkForPR matches only by exercise_id (UUID). Since NULL !== any UUID, manually-set PRs are invisible to detection, causing false PR flags on every tracked exercise.
fix: Two-part fix: (A) loadBaselines now also fetches exercise_name from the DB and resolves exercise_id from the exercise store using a slug-to-display-name mapping when exercise_id is NULL; deduplicates by keeping the higher weight. (B) savePRBaselines now resolves and includes exercise_id when upserting, so future saves produce properly-keyed rows.
verification: All 13 PR-related unit tests pass. New test added confirming that resolved baselines correctly prevent false PR flags when logged weight < manually-set PR.
files_changed:
  - src/features/workout/hooks/usePRDetection.ts
  - src/features/auth/hooks/usePRBaselines.ts
  - tests/workout/pr-detection.test.ts
