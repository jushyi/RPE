# GymApp

## What This Is

A React Native mobile gym companion app for a small group of friends to track workouts, body metrics, build custom workout plans, and stay accountable with smart alarms and reminders. Backed by Supabase for cloud sync and user accounts.

## Core Value

Users can log every workout session in detail and see their progress over time — if tracking doesn't work flawlessly, nothing else matters.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Dashboard home screen showing progress charts, stats, and today's planned workout
- [ ] Pre-loaded exercise library with common exercises (bench press, squat, deadlift, etc.)
- [ ] Custom exercise creation for exercises not in the library
- [ ] Day-by-day workout plan builder: name plan → assign days → add exercises per day
- [ ] Per-exercise plan detail: sets, reps, target weight, RPE, and notes
- [ ] Focus-mode active workout screen: one exercise at a time, big inputs for weight/reps, advance when done
- [ ] Workout history log with past sessions viewable
- [ ] Body metrics tracking: bodyweight, measurements, body fat %, progress photos
- [ ] Progress charts showing trends over time (strength gains, body metrics)
- [ ] Alarm system tied to plan days: when you assign training days, app prompts for alarm times
- [ ] Full alarm notifications with sound/vibration that must be dismissed
- [ ] Missed workout nudges: notification if you skip a planned day without logging
- [ ] User authentication via Supabase (email/password)
- [ ] Cloud data sync across devices via Supabase

### Out of Scope

- Social/sharing features — not MVP, revisit after core tracking works
- Pre-made workout templates — users build from scratch for v1
- Video exercise demos — adds complexity, not needed for friends who know exercises
- Apple Watch / wearable integration — mobile-first, wearables later
- In-app purchases or monetization — free for friends group

## Context

- Target audience is a small friend group, not mass market — polish matters less than function
- Dark & bold aesthetic inspired by Claude Code: dark backgrounds, clean typography, structured layouts, accent colors that pop — functional tool feel, not flashy fitness brand
- Active workout screen uses focus mode: one exercise fills the screen with large tap targets for logging
- Plan creation flow: name → assign weekdays → add exercises per day with full detail (sets/reps/weight/RPE/notes)
- Alarms are real alarms (sound + vibration + dismiss required), not just push notifications
- Inactivity nudges trigger specifically when a planned workout day is missed

## Constraints

- **Tech stack**: React Native (cross-platform iOS + Android)
- **Backend**: Supabase (PostgreSQL, auth, real-time)
- **Audience**: Small group — no need for scale optimization
- **Exercise data**: Ship with pre-loaded exercise database + custom creation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Native over Flutter/PWA | Cross-platform with single JS/TS codebase, large ecosystem | — Pending |
| Supabase over Firebase | SQL-based — better for progress tracking queries, relational workout data, open source | — Pending |
| Focus mode for active workouts | One exercise at a time reduces cognitive load at the gym, big touch targets | — Pending |
| Alarms tied to plan days | Natural UX — setting alarm is part of plan creation, not a separate concern | — Pending |
| Dark & bold aesthetic | User preference, functional tool feel inspired by Claude Code's design language | — Pending |

---
*Last updated: 2026-03-09 after initialization*
