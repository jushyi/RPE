---
phase: quick
plan: 28
subsystem: tooling
tags: [metro, bundler, cache, devtools]
dependency_graph:
  requires: []
  provides: [working-metro-bundler]
  affects: [development-workflow]
tech_stack:
  added: []
  patterns: [metro-cache-clear]
key_files:
  created: []
  modified: []
decisions:
  - "Cache clear alone resolved nullthrows error; no code changes needed"
metrics:
  duration: 1min
  completed: "2026-03-12T17:42:43Z"
---

# Quick Task 28: Fix Metro Bundler nullthrows Error Summary

Metro cache corruption from quick-27 file reorganization resolved by clearing temp cache and node_modules/.cache.

## What Was Done

### Task 1: Clear Metro cache and rebuild [COMPLETED]

- Deleted `node_modules/.cache` directory
- Deleted Metro temp cache files at `/tmp/metro-cache` and `/tmp/metro-file-map-*`
- Verified Metro bundles successfully via `npx expo export --platform android` (2801 modules bundled in 16310ms)
- No nullthrows error after cache clear

### Task 2: Diagnose and fix broken imports [SKIPPED - Not needed]

- Task 2 was conditional on Task 1 failing to resolve the issue
- Cache clear in Task 1 fully resolved the nullthrows error
- No broken imports detected; export completed cleanly

## Root Cause

Metro's dependency graph cache had stale entries from quick-27's file reorganization (moving exercises into plans tab). The `_recursivelyCommitModule` nullthrows error occurs when Metro's cached module graph references files that have been moved or renamed, causing an undefined module entry lookup.

## Deviations from Plan

None - plan executed as written. Cache clearing (the most common fix per the plan) resolved the issue.

## Verification

- `npx expo export --platform android` completed successfully
- 2801 modules bundled without errors
- No broken import warnings in Metro output

## Self-Check: PASSED

- No source files were modified (cache-only fix)
- No commits needed for this task (runtime operation only)
