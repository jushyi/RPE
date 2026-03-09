# Requirements: GymApp

**Defined:** 2026-03-09
**Core Value:** Users can log every workout session in detail and see their progress over time

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Infrastructure

- [ ] **AUTH-01**: User can create account with email and password
- [ ] **AUTH-02**: User can log in and stay logged in across app restarts
- [ ] **AUTH-03**: User can log out from any screen
- [ ] **AUTH-04**: User data syncs to Supabase cloud automatically
- [ ] **AUTH-05**: All workout logging works offline and syncs when connected
- [ ] **AUTH-06**: During account setup, user can enter current 1RM personal records for key lifts to establish PR baselines

### Exercise Library

- [ ] **EXER-01**: App ships with pre-loaded library of common exercises (searchable by muscle group)
- [ ] **EXER-02**: User can create custom exercises with name, muscle group, and equipment type

### Workout Planning

- [ ] **PLAN-01**: User can create a named workout plan
- [ ] **PLAN-02**: User can assign training days (Mon/Tue/Wed etc.) to a plan
- [ ] **PLAN-03**: User can add exercises to each training day from the exercise library
- [ ] **PLAN-04**: User can set target sets, reps, weight, RPE, and notes per exercise in the plan
- [ ] **PLAN-05**: User can edit and delete existing plans

### Active Workout

- [ ] **WORK-01**: User can start a workout session from a plan or as a freestyle session
- [ ] **WORK-02**: Active workout shows one exercise at a time in focus mode with large tap targets
- [ ] **WORK-03**: User can log weight and reps for each set
- [ ] **WORK-04**: Previous session's weight/reps shown inline while logging
- [ ] **WORK-05**: App auto-detects and flags personal records during a session (compared against baselines from AUTH-06 and historical logs)

### History & Progress

- [ ] **HIST-01**: User can view list of past workout sessions with date, exercises, and total volume
- [ ] **HIST-02**: User can view per-exercise progress charts (max weight, estimated 1RM, volume over time)
- [ ] **HIST-03**: User can log bodyweight and view bodyweight chart over time
- [ ] **HIST-04**: User can log body measurements (circumference, body fat %)
- [ ] **HIST-05**: User can take and view progress photos (front/side/back with date)
- [ ] **HIST-06**: Estimated 1RM auto-calculated from logged sets using Epley formula

### Dashboard

- [ ] **DASH-01**: Home screen shows progress summary (recent stats, streaks, PRs)
- [ ] **DASH-02**: Home screen shows today's planned workout with quick-start button

### Reminders & Accountability

- [ ] **ALRM-01**: When creating a plan with training days, user is prompted to set alarm times
- [ ] **ALRM-02**: Alarms fire with sound and vibration and must be dismissed
- [ ] **ALRM-03**: User receives notification if a planned workout day passes without a logged session

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
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| AUTH-05 | — | Pending |
| AUTH-06 | — | Pending |
| EXER-01 | — | Pending |
| EXER-02 | — | Pending |
| PLAN-01 | — | Pending |
| PLAN-02 | — | Pending |
| PLAN-03 | — | Pending |
| PLAN-04 | — | Pending |
| PLAN-05 | — | Pending |
| WORK-01 | — | Pending |
| WORK-02 | — | Pending |
| WORK-03 | — | Pending |
| WORK-04 | — | Pending |
| WORK-05 | — | Pending |
| HIST-01 | — | Pending |
| HIST-02 | — | Pending |
| HIST-03 | — | Pending |
| HIST-04 | — | Pending |
| HIST-05 | — | Pending |
| HIST-06 | — | Pending |
| DASH-01 | — | Pending |
| DASH-02 | — | Pending |
| ALRM-01 | — | Pending |
| ALRM-02 | — | Pending |
| ALRM-03 | — | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 0
- Unmapped: 29

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after initial definition*
