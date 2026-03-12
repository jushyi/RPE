# Requirements: GymApp

**Defined:** 2026-03-09
**Core Value:** Users can log every workout session in detail and see their progress over time

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Infrastructure

- [x] **AUTH-01**: User can create account with email and password
- [x] **AUTH-02**: User can log in and stay logged in across app restarts
- [x] **AUTH-03**: User can log out from any screen
- [x] **AUTH-04**: User data syncs to Supabase cloud automatically
- [x] **AUTH-05**: All workout logging works offline and syncs when connected
- [x] **AUTH-06**: During account setup, user can enter current 1RM personal records for key lifts to establish PR baselines

### Exercise Library

- [x] **EXER-01**: App ships with pre-loaded library of common exercises (searchable by muscle group)
- [x] **EXER-02**: User can create custom exercises with name, muscle group, and equipment type

### Workout Planning

- [x] **PLAN-01**: User can create a named workout plan
- [x] **PLAN-02**: User can assign training days (Mon/Tue/Wed etc.) to a plan
- [x] **PLAN-03**: User can add exercises to each training day from the exercise library
- [x] **PLAN-04**: User can set target sets, reps, weight, RPE, and notes per exercise in the plan
- [x] **PLAN-05**: User can edit and delete existing plans

### Active Workout

- [x] **WORK-01**: User can start a workout session from a plan or as a freestyle session
- [x] **WORK-02**: Active workout shows one exercise at a time in focus mode with large tap targets
- [x] **WORK-03**: User can log weight and reps for each set
- [x] **WORK-04**: Previous session's weight/reps shown inline while logging
- [x] **WORK-05**: App auto-detects and flags personal records during a session (compared against baselines from AUTH-06 and historical logs)

### History & Progress

- [x] **HIST-01**: User can view list of past workout sessions with date, exercises, and total volume
- [x] **HIST-02**: User can view per-exercise progress charts (max weight, estimated 1RM, volume over time)
- [x] **HIST-03**: User can log bodyweight and view bodyweight chart over time
- [x] **HIST-04**: User can log body measurements (circumference, body fat %)
- [x] **HIST-05**: User can take and view progress photos (front/side/back with date)
- [x] **HIST-06**: Estimated 1RM auto-calculated from logged sets using Epley formula

### Dashboard

- [x] **DASH-01**: Home screen shows progress summary (recent stats, streaks, PRs)
- [x] **DASH-02**: Home screen shows today's planned workout with quick-start button

### Reminders & Accountability

- [x] **ALRM-01**: When creating a plan with training days, user is prompted to set alarm times
- [x] **ALRM-02**: Alarms fire with sound and vibration and must be dismissed
- [x] **ALRM-03**: User receives notification if a planned workout day passes without a logged session

### Set Videos

- [x] **VID-01**: User can record a video during an active workout and attach it to a specific set
- [x] **VID-02**: User can choose a video from gallery and attach it to a specific set
- [x] **VID-03**: Videos upload to Supabase Storage in background (offline-first queue)
- [x] **VID-04**: Camera button appears on each logged SetCard during active workout
- [x] **VID-05**: User can replace or delete an attached video on a set
- [x] **VID-06**: Video thumbnails with play icon appear on sets in workout history detail
- [x] **VID-07**: Tapping thumbnail opens fullscreen native video player
- [x] **VID-08**: Settings has "My Videos" gallery screen showing all videos chronologically with storage usage and delete capability

### Coaching

- [x] **COACH-01**: Coach can generate an invite code to connect with a trainee
- [x] **COACH-02**: Trainee can enter an invite code to establish a coaching relationship
- [x] **COACH-03**: Users can be both coach and trainee simultaneously
- [x] **COACH-04**: Either party can disconnect the coaching relationship unilaterally
- [x] **COACH-05**: Push notification infrastructure exists (token registration, server-side dispatch via Edge Function)
- [x] **COACH-06**: Coach UI toggle in Plans tab: "My Plans" vs "Trainees"
- [x] **COACH-07**: Coach-assigned plans are visually distinguished in trainee's plan list
- [x] **COACH-08**: Trainee cannot edit coach-assigned plans (read-only)
- [x] **COACH-09**: Coach can create workout plans targeting a specific trainee
- [x] **COACH-10**: Coach can see trainee's last-week performance inline while editing plans
- [x] **COACH-11**: Coach can attach a text note when saving plan changes
- [x] **COACH-12**: Coach can see trainee's workout logs (sets/reps/weight) but NOT body metrics
- [x] **COACH-13**: Coach receives push notification when trainee completes a workout
- [x] **COACH-14**: Coach receives push notification when trainee achieves a PR
- [x] **COACH-15**: Trainee receives push notification when coach updates their plan
- [x] **COACH-16**: Coach receives weekly adherence summary (Sunday evening) for all trainees

### Notification Inbox & Deep Linking

- [ ] **NOTIF-01**: Bell icon in dashboard header with numeric unread badge, opens full-screen notification inbox
- [ ] **NOTIF-02**: Tapping inbox items deep links to relevant screen (session detail, progress chart, plan detail, or active workout)
- [ ] **NOTIF-03**: Notifications persisted in Supabase table with RLS and 30-day retention
- [ ] **NOTIF-04**: Push notification taps (cold-start and foreground) deep link to correct screen
- [ ] **NOTIF-05**: Developer test screen with trigger buttons for all 6 notification types and debug log
- [ ] **NOTIF-06**: Local alarm/nudge notifications write records to notifications table for inbox consistency

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Active Workout

- **WORK-V2-01**: Rest timer that auto-starts on set completion with configurable duration and sound/vibration alert
- **WORK-V2-02**: RPE logging per set (1-10 scale) alongside weight/reps

### Utility

- **UTIL-V2-01**: Plate calculator showing which plates to load for a target weight

### Social

- **SOCL-V2-01**: Social feed / workout sharing between friends

### Templates

- **TMPL-V2-01**: Pre-made workout program templates (PPL, 5x5, Upper/Lower)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Video exercise demos | Storage/CDN complexity; target audience knows exercises |
| AI workout recommendations | Requires ML infrastructure; premature for personal tracker |
| Nutrition / calorie tracking | Separate domain; use dedicated apps |
| Apple Watch / wearable integration | Mobile-first; wearables after core is proven |
| Gamification (badges, streaks, XP) | Artificial; PR detection and charts provide natural motivation |
| Real-time collaborative sessions | WebSocket complexity; no clear demand for friend group |
| In-app purchases / paywall | Free for friends group |
| OAuth login (Google, Apple) | Email/password sufficient for small group |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Complete |
| EXER-01 | Phase 2 | Complete |
| EXER-02 | Phase 2 | Complete |
| PLAN-01 | Phase 3 | Complete |
| PLAN-02 | Phase 3 | Complete |
| PLAN-03 | Phase 3 | Complete |
| PLAN-04 | Phase 3 | Complete |
| PLAN-05 | Phase 3 | Complete |
| WORK-01 | Phase 4 | Complete |
| WORK-02 | Phase 4 | Complete |
| WORK-03 | Phase 4 | Complete |
| WORK-04 | Phase 4 | Complete |
| WORK-05 | Phase 4 | Complete |
| HIST-01 | Phase 5 | Complete |
| HIST-06 | Phase 5 | Complete |
| HIST-02 | Phase 6 | Complete |
| HIST-03 | Phase 6 | Complete |
| DASH-01 | Phase 6 | Complete |
| DASH-02 | Phase 6 | Complete |
| HIST-04 | Phase 7 | Complete |
| HIST-05 | Phase 7 | Complete |
| ALRM-01 | Phase 8 | Complete |
| ALRM-02 | Phase 8 | Complete |
| ALRM-03 | Phase 8 | Complete |
| COACH-01 | Phase 13 | Planned |
| COACH-02 | Phase 13 | Planned |
| COACH-03 | Phase 13 | Planned |
| COACH-04 | Phase 13 | Planned |
| COACH-05 | Phase 13 | Planned |
| COACH-06 | Phase 13 | Planned |
| COACH-07 | Phase 13 | Planned |
| COACH-08 | Phase 13 | Planned |
| COACH-09 | Phase 13 | Planned |
| COACH-10 | Phase 13 | Planned |
| COACH-11 | Phase 13 | Planned |
| COACH-12 | Phase 13 | Planned |
| COACH-13 | Phase 13 | Planned |
| COACH-14 | Phase 13 | Planned |
| COACH-15 | Phase 13 | Planned |
| COACH-16 | Phase 13 | Planned |
| VID-01 | Phase 14 | Planned |
| VID-02 | Phase 14 | Planned |
| VID-03 | Phase 14 | Planned |
| VID-04 | Phase 14 | Planned |
| VID-05 | Phase 14 | Planned |
| VID-06 | Phase 14 | Planned |
| VID-07 | Phase 14 | Planned |
| VID-08 | Phase 14 | Planned |
| NOTIF-01 | Phase 16 | Planned |
| NOTIF-02 | Phase 16 | Planned |
| NOTIF-03 | Phase 16 | Planned |
| NOTIF-04 | Phase 16 | Planned |
| NOTIF-05 | Phase 16 | Planned |
| NOTIF-06 | Phase 16 | Planned |

**Coverage:**
- v1 requirements: 29 total (all complete)
- Coaching requirements: 16 total (planned)
- Video requirements: 8 total (planned)
- Notification requirements: 6 total (planned)
- Mapped to phases: 59
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-12 after Phase 16 planning -- 6 notification requirements added*
