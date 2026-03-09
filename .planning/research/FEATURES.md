# Feature Research

**Domain:** Gym / Strength Training Workout Tracker (Mobile App)
**Researched:** 2026-03-09
**Confidence:** HIGH (cross-referenced across competitor analysis, user reviews, and fitness app development sources)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or unusable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Exercise library (pre-loaded) | Every major app ships with 100-400+ common exercises; users expect to pick from a list, not type everything | MEDIUM | Ship with bench press, squat, deadlift, OHP, row variants, isolation movements. Searchable by muscle group. |
| Custom exercise creation | Pre-loaded library never covers everyone's movements; users need escape hatch | LOW | Name + muscle group + equipment type. No video/instructions needed for MVP. |
| Set-by-set logging (weight + reps) | Core purpose of the app — if this is slow or buggy users leave immediately | LOW | Tap to log, pre-fill from previous session. Speed is the top UX metric during active workout. |
| Previous performance reference | Users need to see last session's numbers while logging current session | LOW | Show last set's weight/reps inline when logging. Critical for progressive overload. |
| Workout history log | Users need to review past sessions; blind logging without history is useless | LOW | Date, exercises, total volume. Searchable/filterable by date is nice-to-have. |
| Progress charts for lifts | Visual proof of strength gains over time; users need to see the trend | MEDIUM | Per-exercise charts (estimated 1RM, max weight, total volume over time). |
| Rest timer between sets | Every serious lifting app has this; gym WiFi is bad, manual timers are friction | LOW | Auto-start on set completion. Configurable duration per exercise. Sound/vibration alert. |
| Personal records (PR) detection | Auto-flag when a new max is hit; a core motivation hook | LOW | Track weight PR, rep PR, estimated 1RM PR. Surface at end of set or end of session. |
| Workout plan / program builder | Users want to plan their week, not improvise every session | HIGH | Assign exercises per day, target sets/reps/weight. This is the hardest table-stakes feature to build well. |
| User authentication | Account = persistent data, cross-device sync, data safety | MEDIUM | Email/password via Supabase. Apple/Google SSO is nice-to-have, not required for friends group. |
| Cloud sync | Data lives on multiple devices; local-only feels fragile | MEDIUM | Supabase handles this. Real-time sync less critical than reliability on save. |
| Offline functionality | Gym WiFi and basement cellular are notoriously unreliable | HIGH | All logging must work offline. Sync when connection restored. This is a known hard problem in mobile apps. |
| Body weight tracking | Users track scale weight alongside lifts; fundamental to fitness tracking | LOW | Date + weight. Chart over time. Simple. |

---

### Differentiators (Competitive Advantage)

Features that set the product apart from commodity trackers. Aligned with the project's core value: *flawless tracking + accountability*.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Focus mode active workout screen | One exercise fills the screen with oversized tap targets — reduces cognitive load mid-set, eliminates logging errors under fatigue | MEDIUM | Unique to this project's explicit design intent. Strong/Hevy show all exercises at once. One-at-a-time focus is a meaningful UX differentiator. |
| RPE (Rate of Perceived Exertion) per set | Captures training intensity beyond just weight/reps; serious lifters use RPE for autoregulation | LOW | Log 1-10 RPE alongside weight/reps. Show RPE trend alongside strength charts. Hevy and many mass-market apps omit this. |
| Plan-day-tied alarm system | Alarm creation is integrated into plan setup — no separate reminders app needed, no friction between "I made a plan" and "I get woken up for it" | HIGH | Real alarms (sound + vibration + must-dismiss), not just push notifications. This is the project's most distinctive feature vs. competitors. Requires platform-level alarm permissions on both iOS and Android. |
| Missed workout nudge (inactivity detection) | Specific nudge when a planned day is skipped without logging — guilt-free but accountability-enforcing | MEDIUM | Trigger: planned day passes without session logged. Push notification with gentle message. Different from generic "log your workout" reminders competitors use. |
| Structured plan detail per exercise | Per-exercise plan entry captures sets, reps, target weight, RPE, and notes — more granular than most apps which only store sets + reps | LOW | The notes field per planned exercise is underappreciated; lifters track cues, form reminders, adjustments. |
| Body measurements + progress photos | Comprehensive body metrics beyond bodyweight: circumference measurements, body fat %, photo comparison | MEDIUM | Front/side/back photos with date stamps. Side-by-side comparison view is a strong retention hook. MacroFactor does this well as a reference. |
| Dark & bold design aesthetic | Most fitness apps are colorful/gamified; a tool-focused dark theme appeals to serious lifters who want signal over noise | LOW | Design decision, not engineering. Consistent dark theme, clean typography, accent colors. Functional tool feel. |
| Estimated 1RM calculation | Auto-calculate theoretical 1-rep max from logged sets using Epley formula — shows strength progression even when not testing true 1RM | LOW | Display inline when logging and on progress charts. Used by Strong, Hevy — but worth including as standard. |
| Plate calculator | Shows exactly which plates to put on the bar for a target weight — removes gym math friction | LOW | Input target weight + bar weight → output plate combination. Simple utility, high perceived value. |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem beneficial but create scope bloat, maintenance burden, or distract from the core.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Social feed / activity sharing | "Accountability to friends" is a real motivation driver | High complexity, content moderation surface, notification hell, distraction from logging purpose. The friend group already knows each other — a social feed recreates Instagram inside a workout app. | The missed workout nudge plus plan-tied alarms provides accountability without social infrastructure. If sharing is needed, standard iOS/Android share sheet on session summary is enough. |
| Pre-made program templates (GZCLP, 5/3/1, nSuns) | Power users want to load a proven program instantly | Licensing ambiguity for named programs, version drift when programs update, users want to customize anyway. Adds a library maintenance burden. | Custom plan builder covers this. Power users can recreate any program themselves. Keep templates as a future v2 feature once the builder is proven. |
| Video exercise demos | "How do I do this exercise?" is a real question | High storage cost, CDN complexity, content licensing, maintenance overhead. The target audience is a friends group who already know the exercises. | Text notes field in custom exercises. External link field pointing to YouTube is a future option. |
| AI-generated workout recommendations | Market trend; "smart" plans that adapt | Adds ML infrastructure, unpredictable outputs, scope far beyond a personal tracking tool. Adaptive AI needs significant data to be useful. | Manual progressive overload guidance: show previous session inline, calculate estimated 1RM, flag PRs. Let users decide their own progression. |
| Nutrition / calorie tracking | "Complete wellness" appeal | Entirely separate domain. Myfitnesspal and Cronometer already do this well. Adding food logging doubles the surface area without doubling value. | Out of scope. If users want nutrition tracking, recommend a dedicated app. |
| Apple Watch / wearable integration | "Log sets from my watch" sounds convenient | Platform-specific complexity (watchOS development), heart rate data pipelines, sync logic. Not needed for strength training where phone is accessible. | Mobile-first. Wearable integration is a v2 consideration after core tracking is proven. |
| Gamification (badges, streaks, XP) | Engagement/retention hook | For a small friends group, gamification feels juvenile and adds UI complexity. Streaks create anxiety when life interrupts training. | PR detection and progress charts provide the dopamine hit without artificial game mechanics. |
| Real-time sync / collaborative workout sessions | "Train together" use case | Requires WebSocket infrastructure, conflict resolution, significant complexity. No clear demand from the use case (friends training together, not simultaneously on the same session). | Each user logs their own session. Post-workout history is viewable if social features are added later. |
| In-app purchase / subscription paywall | Monetization | Explicitly out of scope — free for friends group. Adding a paywall creates friction and resentment in a personal project context. | Free forever for the target audience. |

---

## Feature Dependencies

```
[User Authentication]
    └──required by──> [Cloud Sync]
    └──required by──> [Workout History]
    └──required by──> [Body Metrics Tracking]

[Exercise Library]
    └──required by──> [Plan Builder]
    └──required by──> [Active Workout Screen]
    └──enhances────> [Custom Exercise Creation] (fallback when library is insufficient)

[Plan Builder]
    └──required by──> [Plan-Day-Tied Alarms]
    └──required by──> [Missed Workout Nudge]
    └──required by──> [Dashboard: Today's Planned Workout]

[Active Workout Screen]
    └──required by──> [Workout History Log]
    └──required by──> [PR Detection]
    └──required by──> [Progress Charts]
    └──enhances────> [Rest Timer] (auto-starts on set completion)

[Progress Charts]
    └──requires───> [Workout History Log] (needs historical data to chart)
    └──enhances────> [Estimated 1RM Calculation]

[Body Weight Tracking]
    └──enhances────> [Body Metrics Dashboard] (part of broader metrics)

[Offline Functionality]
    └──required by──> [Active Workout Screen] (gym connectivity is unreliable)
    └──required by──> [Cloud Sync] (sync must handle offline-first state)

[Push Notification Permission]
    └──required by──> [Missed Workout Nudge]
    └──required by──> [Plan-Day-Tied Alarms] (alarms need notification + alarm permissions)
```

### Dependency Notes

- **Plan Builder requires Exercise Library:** You cannot build a plan without exercises to assign to days. Exercise library (or custom creation) must ship before plan builder.
- **Alarms require Plan Builder:** The alarm system is only meaningful when tied to plan days. These ship together or alarms ship slightly after.
- **Progress Charts require Workout History:** Charts have nothing to render until sessions are logged. At least 2-3 sessions needed before charts become useful — this is expected behavior.
- **Active Workout Screen requires Offline support:** Users log workouts at the gym where connectivity is unreliable. If the active screen requires a network connection, it will fail at the worst possible time.
- **Missed Workout Nudge requires Plan Builder + Push Permissions:** The nudge logic checks: "does this user have a plan with today as a training day, and have they not logged a session?" Both plan structure and notification permission must exist.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed for the friends group to use this daily.

- [ ] **User auth (Supabase email/password)** — required for data ownership and sync
- [ ] **Exercise library + custom exercise creation** — foundation for everything else
- [ ] **Plan builder (days → exercises → sets/reps/weight/RPE/notes)** — core planning feature
- [ ] **Focus mode active workout screen** — the primary daily-use surface; must be fast and reliable
- [ ] **Set logging with previous performance reference** — critical for progressive overload
- [ ] **Rest timer (auto-start on set completion)** — essential UX quality-of-life
- [ ] **Workout history log** — users need to review sessions
- [ ] **PR detection** — motivation hook, surfaces on set completion
- [ ] **Progress charts per exercise** — validates that training is working
- [ ] **Body weight tracking + basic metrics** — bodyweight chart is quick to implement, high value
- [ ] **Plan-day-tied alarms** — the distinctive accountability feature; real alarms with sound/vibration
- [ ] **Missed workout nudge** — inactivity detection tied to plan days
- [ ] **Cloud sync via Supabase** — data safety and multi-device access
- [ ] **Offline-first active workout** — non-negotiable for gym use

### Add After Validation (v1.x)

Features to add once the core tracking loop is working and the friends group is using it daily.

- [ ] **Body measurements (circumference + body fat %)** — expand metrics beyond bodyweight; add after weight tracking is established
- [ ] **Progress photos** — high retention value but requires camera permission handling and storage; add after text metrics are solid
- [ ] **Plate calculator** — low complexity, add when a user requests it
- [ ] **Estimated 1RM display** — already calculable from logged data; surface in charts once chart infrastructure exists
- [ ] **Dashboard home screen** — summary of recent sessions and today's plan; add once there's data to summarize

### Future Consideration (v2+)

Features to defer until the core product is proven and the user group requests them.

- [ ] **Social feed / workout sharing** — explicitly out of scope per PROJECT.md; revisit only if the friend group requests it
- [ ] **Pre-made program templates** — useful once plan builder UX is validated and users want shortcuts
- [ ] **Apple Watch / wearable integration** — mobile-first first; wearables after core is stable
- [ ] **AI workout recommendations** — requires significant training data and infrastructure; premature for v1
- [ ] **Video exercise demos** — storage/CDN complexity; text notes + external links are sufficient for now

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Exercise library (pre-loaded) | HIGH | MEDIUM | P1 |
| Custom exercise creation | HIGH | LOW | P1 |
| Set-by-set logging (weight/reps) | HIGH | LOW | P1 |
| Previous performance reference | HIGH | LOW | P1 |
| Plan builder (days/exercises) | HIGH | HIGH | P1 |
| Focus mode active workout screen | HIGH | MEDIUM | P1 |
| Workout history log | HIGH | LOW | P1 |
| Rest timer | HIGH | LOW | P1 |
| PR detection | HIGH | LOW | P1 |
| User authentication | HIGH | MEDIUM | P1 |
| Cloud sync | HIGH | MEDIUM | P1 |
| Offline-first active workout | HIGH | HIGH | P1 |
| Plan-day-tied alarms | HIGH | HIGH | P1 |
| Missed workout nudge | MEDIUM | MEDIUM | P1 |
| Progress charts | HIGH | MEDIUM | P1 |
| Body weight tracking | MEDIUM | LOW | P1 |
| RPE per set | MEDIUM | LOW | P2 |
| Estimated 1RM | MEDIUM | LOW | P2 |
| Body measurements | MEDIUM | MEDIUM | P2 |
| Progress photos | MEDIUM | HIGH | P2 |
| Dashboard home screen | MEDIUM | MEDIUM | P2 |
| Plate calculator | LOW | LOW | P2 |
| Dark & bold theme | MEDIUM | LOW | P2 |
| Pre-made program templates | LOW | HIGH | P3 |
| Social feed | LOW | HIGH | P3 |
| Wearable integration | LOW | HIGH | P3 |
| AI recommendations | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Strong (benchmark) | Hevy (modern) | Our Approach |
|---------|-------------------|---------------|--------------|
| Exercise library | 300+ exercises | 400+ exercises | Pre-loaded common lifts; custom creation for anything missing |
| Workout logging | Set-by-set, inline previous | Set-by-set, inline previous | Same, plus focus mode one-exercise-at-a-time screen |
| RPE tracking | No | No | Yes — per set RPE logging |
| Rest timer | Yes, manual start | Yes, auto-start | Yes, auto-start on set completion |
| PR detection | Yes (end of workout) | Yes (inline + summary) | Yes — inline during active workout |
| Plan builder | Yes | Yes | Yes — with per-exercise sets/reps/weight/RPE/notes |
| Alarms tied to plans | No | No | Yes — real alarms integrated into plan creation |
| Missed workout nudge | No | No | Yes — inactivity detection against plan days |
| Progress charts | Per lift, 1RM, volume | Per lift, 1RM, volume | Per lift, 1RM, volume — same baseline |
| Body metrics | Bodyweight only | Bodyweight + measurements | Bodyweight + measurements + progress photos |
| Social features | None | Full social feed | None (out of scope) |
| Offline support | Yes | Partial | Yes — offline-first required |
| AI features | None | None | None (out of scope for v1) |
| Design | Functional, dated | Clean, modern, light | Dark & bold, tool-focused |

---

## Sources

- [Best Workout Tracker Apps in 2026 — Stronger](https://www.strongermobileapp.com/blog/best-workout-tracker-apps)
- [Strong vs Hevy Comparison 2026 — GymGod](https://gymgod.app/blog/strong-vs-hevy)
- [Strong vs Hevy: Which is Better in 2026? — PRPath](https://www.prpath.app/blog/strong-vs-hevy-2026.html)
- [Hevy App Features: Body Measurements](https://www.hevyapp.com/features/track-body-measurements/)
- [Hevy App Features: Rest Timer](https://www.hevyapp.com/features/workout-rest-timer/)
- [Hevy App Features: Progress Tracking](https://www.hevyapp.com/features/gym-progress/)
- [15 Must-Have Features for Fitness App in 2026 — CodeTheorem](https://codetheorem.co/blogs/features-for-fitness-app/)
- [Fitness App Development 2026: Key Features — Attract Group](https://attractgroup.com/blog/fitness-app-development-in-2026-key-features-monetization-models-and-cost-estimates/)
- [13 Strategies for Fitness App Engagement and Retention — Orangesoft](https://orangesoft.co/blog/strategies-to-increase-fitness-app-engagement-and-retention)
- [15 Must-Have Fitness App Features to Boost Engagement — Stormotion](https://stormotion.io/blog/fitness-app-features/)
- [7 Things People Hate in Fitness Apps — Ready4S](https://www.ready4s.com/blog/7-things-people-hate-in-fitness-apps)
- [Best Workout Tracker Apps 2026 — Fitbod](https://fitbod.me/blog/best-workout-tracker-apps-for-2026/)
- [Best App to Log Workout 2025 — Setgraph](https://setgraph.app/ai-blog/best-app-to-log-workout-tested-by-lifters)
- [MacroFactor: Progress Photos and Body Measurement Tracker](https://macrofactorapp.com/progress-photos-and-body-measurement-tracker/)
- [Strong App Review 2026 — PRPath](https://www.prpath.app/blog/strong-app-review-2026.html)

---
*Feature research for: Gym / Strength Training Workout Tracker (React Native + Supabase)*
*Researched: 2026-03-09*
