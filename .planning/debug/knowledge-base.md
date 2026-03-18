# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## trainee-pr-deep-link — Coach PR notification deep link navigates to wrong screen
- **Date:** 2026-03-18
- **Error patterns:** pr_achieved, deep link, wrong screen, trainee, coach, notification, trainee_id ignored, progress chart
- **Root cause:** The deep link router in deepLinkRouter.ts treated all pr_achieved notifications identically, routing them to the current user's own exercise progress chart. When a coach tapped a PR notification for a trainee, the trainee_id in the payload was ignored, so the coach was shown their own progress data instead of the trainee's workout history. Additionally, trainee_name was not included in the notification payload.
- **Fix:** Three-part fix: (1) deepLinkRouter.ts - when pr_achieved has a trainee_id (coach context), route to trainee-history screen instead of progress chart; (2) notifyCoach.ts - added trainee_name to the PR notification data payload; (3) types.ts - added trainee_name as optional field to NotificationData interface.
- **Files changed:** src/features/notifications/utils/deepLinkRouter.ts, src/features/coaching/utils/notifyCoach.ts, src/features/notifications/types.ts, tests/notifications/deepLinkRouter.test.ts
---

## pr-calculation-ignores-set-prs — Manually set PRs invisible to PR detection causing false flags
- **Date:** 2026-03-18
- **Error patterns:** false PR flag, manually set PR ignored, exercise_id NULL, key mismatch, exercise_name vs exercise_id, PR baseline, savePRBaselines, loadBaselines, checkForPR, pr_baselines
- **Root cause:** Two-part key mismatch between save and load paths. savePRBaselines wrote rows with exercise_name but NULL exercise_id. loadBaselines/checkForPR matched only by exercise_id (UUID). Since NULL !== any UUID, manually-set PRs were invisible to detection, causing false PR flags on every tracked exercise.
- **Fix:** Two-part fix: (A) loadBaselines now also fetches exercise_name from the DB and resolves exercise_id from the exercise store using a slug-to-display-name mapping when exercise_id is NULL; deduplicates by keeping the higher weight. (B) savePRBaselines now resolves and includes exercise_id when upserting, so future saves produce properly-keyed rows.
- **Files changed:** src/features/workout/hooks/usePRDetection.ts, src/features/auth/hooks/usePRBaselines.ts, tests/workout/pr-detection.test.ts
---
