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
- [ ] **WORK-02**: Active workout shows one exercise at a time in focus mode with large tap targets
- [x] **WORK-03**: User can log weight and reps for each set
- [ ] **WORK-04**: Previous session's weight/reps shown inline while logging
- [x] **WORK-05**: App auto-detects and flags personal records during a session (compared against baselines from AUTH-06 and historical logs)

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
| WORK-02 | Phase 4 | Pending |
| WORK-03 | Phase 4 | Complete |
| WORK-04 | Phase 4 | Pending |
| WORK-05 | Phase 4 | Complete |
| HIST-01 | Phase 5 | Pending |
| HIST-06 | Phase 5 | Pending |
| HIST-02 | Phase 6 | Pending |
| HIST-03 | Phase 6 | Pending |
| DASH-01 | Phase 6 | Pending |
| DASH-02 | Phase 6 | Pending |
| HIST-04 | Phase 7 | Pending |
| HIST-05 | Phase 7 | Pending |
| ALRM-01 | Phase 8 | Pending |
| ALRM-02 | Phase 8 | Pending |
| ALRM-03 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after roadmap creation — all 29 requirements mapped*
