---
phase: quick
plan: 1
subsystem: dashboard
tags: [avatar, upload, storage, bug-fix]
dependency_graph:
  requires: [supabase-storage, expo-image-picker]
  provides: [working-avatar-upload]
  affects: [dashboard]
tech_stack:
  patterns: [FormData-file-URI-upload, cache-bust-query-param]
key_files:
  modified:
    - app/(app)/(tabs)/dashboard.tsx
decisions:
  - "Used FormData with file URI object (standard RN pattern) instead of fetch/blob which silently fails"
  - "Cache-bust with ?t=Date.now() query param to force Image component reload"
metrics:
  duration: 1min
  completed: 2026-03-09
---

# Quick Task 1: Fix Dashboard Avatar Upload Summary

**One-liner:** FormData file URI upload replacing broken fetch/blob, with Alert error feedback and cache-bust URL

## What Was Done

### Task 1: Fix avatar upload with FormData, error feedback, and cache-busting
**Commit:** `fdaa13f`

Replaced the `handlePhotoChanged` function in `dashboard.tsx`:

1. **Saved previous avatar URL** before optimistic update for rollback on failure
2. **Replaced `fetch(uri).blob()`** with `FormData` containing a file URI object -- the standard React Native pattern that actually works (fetch/blob silently fails in RN)
3. **Added upload error checking** -- if Supabase storage returns an error, the avatar reverts to the previous image and an Alert notifies the user
4. **Added cache-bust query param** (`?t=Date.now()`) to the public URL so React Native's Image component doesn't serve a stale cached version
5. **Added outer catch handler** that also reverts and alerts on unexpected errors

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript compiles without errors (`npx tsc --noEmit` shows zero dashboard-related errors)
- All done criteria met:
  - handlePhotoChanged uses FormData with file URI object (not fetch/blob)
  - Upload failure shows Alert and reverts avatarUrl to previous value
  - Successful upload sets cache-busted URL with ?t=timestamp
  - No new dependencies added

## Self-Check: PASSED

- [x] `app/(app)/(tabs)/dashboard.tsx` exists
- [x] Commit `fdaa13f` exists in git log
