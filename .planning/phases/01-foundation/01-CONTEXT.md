# Phase 1: Foundation - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Expo project scaffold, Supabase schema (users + PRs only), RLS policies, auth screens with session persistence, offline-safe token handling, and PR baseline entry flow. No exercise library, plans, or workout logging — those are later phases.

</domain>

<decisions>
## Implementation Decisions

### Auth screen flow
- Single screen with toggle between sign-in and sign-up (not separate screens)
- Sign-up collects: email, password, display name, profile photo
- Profile photo: one default avatar available, plus camera/gallery picker
- After sign-up, flow routes directly to PR baseline entry
- After PR baseline (or skip), lands on empty state dashboard shell
- Empty state dashboard has placeholder sections that future phases fill in

### PR baseline entry
- Key lifts: Big 3 only — bench press, squat, deadlift
- Step is skippable (users may not know their 1RM yet)
- Input: weight number field per lift
- Global unit selector (kg/lbs) that defaults all fields, but each lift can override to the other unit

### Offline behavior & sync
- Sign-up requires internet (Supabase must create the account)
- First launch with no internet: friendly message "Connect to the internet to create your account" with manual retry button
- After signed in, everything works normally offline with sync queued in background
- Connectivity indicators: persistent cloud icon in header (check/X) + toast banner that slides in/out on connectivity change

### Schema design
- Phase 1 schema only: users table and PR baselines — each future phase adds its own tables
- Supabase built-in migration system (supabase/migrations/) for all schema changes
- Simple RLS: users can only read/write their own rows
- Supabase project created manually beforehand — app just needs connection URL/keys configured

### Claude's Discretion
- Empty state dashboard layout and placeholder design
- Auth screen visual design (within dark/bold aesthetic)
- Toast banner animation and timing
- Default avatar design/selection
- Migration file naming convention

</decisions>

<specifics>
## Specific Ideas

- Dark & bold aesthetic inspired by Claude Code: dark backgrounds, clean typography, accent colors that pop
- Dashboard shell should feel like a real screen with "coming soon" placeholders, not a blank page
- Friend visibility for workouts/PRs and coach plan-sharing planned for future — RLS should be simple now but schema shouldn't make this impossible later

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no code exists yet

### Established Patterns
- None yet — Phase 1 establishes the patterns (Expo Router file-based routing, Zustand stores, NativeWind styling, TanStack Query for data fetching)

### Integration Points
- Supabase project (manually created) provides auth and database
- MMKV for local persistence (session tokens, offline data)
- expo-secure-store for sensitive credential storage

</code_context>

<deferred>
## Deferred Ideas

- Friend workout/PR visibility — future phase (social features)
- Coach role: friends can send plans to each other — future phase
- OAuth login (Google, Apple) — out of scope per REQUIREMENTS.md

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-09*
