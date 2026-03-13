# Deferred Items - Phase 16

## Pre-existing Test Failures

- `tests/settings/csvExport.test.ts`: 2 tests failing - expected "Hips" column in CSV header but Hips was dropped in Phase 7 migration. Test assertions need updating to match current schema (Biceps, Quad instead of Hips).
