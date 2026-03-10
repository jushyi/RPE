# Phase 7: Body Metrics - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can track body composition changes — measurements and progress photos — with photos stored privately in Supabase Storage accessible only to the owning user. Bodyweight logging is already handled on the dashboard (Phase 6). No workout tracking, no charts for exercises — those are other phases.

</domain>

<decisions>
## Implementation Decisions

### Measurement set
- Extended set of 9 measurements: chest, waist, hips, body fat %, arms, thighs, neck, shoulders, calves
- All circumference measurements support inches or cm via per-input unit selector (consistent with Phase 6 bodyweight pattern)
- Body fat % is unitless (percentage)

### Measurement entry form
- All-at-once scrollable form showing all 9 measurement fields
- User fills in whichever fields they want, leaves others blank
- Date picker for entry date (defaults to today)
- Unit selector shown on every numeric input

### Measurement history
- Default view: reverse-chronological list of entries showing date and filled measurements
- Tap entry to see full detail
- Per-measurement mini chart view available — each measurement gets its own trend chart (reuses Phase 6 chart patterns)
- Both list and chart views accessible via toggle/switch

### Progress photo capture
- Camera and gallery both supported via expo-image-picker
- Required pose tag before saving: front, side, or back
- No camera overlay or silhouette guide — plain camera view
- Photos compressed before upload to Supabase Storage (save bandwidth and storage)

### Progress photo timeline
- Scrollable vertical timeline, most recent at top
- Each date entry shows pose photos inline side by side
- Filterable by pose type via tabs/chips: All / Front / Side / Back
- Side-by-side comparison feature: user picks two dates, sees same pose compared
- Individual photo delete with confirmation dialog (consistent with Phase 5 session delete pattern)

### Navigation & access
- New bottom tab: "Body" with body/person icon from Ionicons
- Two swipeable sub-pages within the tab: "Measurements" and "Photos" (same pattern as Plans/History in Phase 5)
- No dashboard summary card — body metrics lives exclusively in the Body tab

### Claude's Discretion
- Specific Ionicons icon choice for Body tab
- Compression algorithm and quality level for photo uploads
- Supabase Storage bucket naming and path structure
- Chart library reuse from Phase 6 for measurement trend charts
- Measurement form field ordering and grouping
- Photo thumbnail size in timeline
- Side-by-side comparison UI implementation details
- Signed URL caching strategy for photo display
- Empty state illustrations and copy

</decisions>

<specifics>
## Specific Ideas

- Unit selector on every measurement input — same pattern as bodyweight in Phase 6, never infer units
- Two sub-pages (Measurements | Photos) mirrors the Plans | History swipeable pattern from Phase 5
- Side-by-side photo comparison is a key motivational feature — seeing visual progress over time
- Pose tagging is required (not optional) to enable meaningful comparison and filtering

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/Card.tsx`: Card component for measurement entries and photo timeline items
- `src/components/ui/Button.tsx`: Button for add measurement, take photo CTAs
- `src/components/ui/Input.tsx`: Numeric input for measurement values
- `src/constants/theme.ts`: Dark theme colors (background #0a0a0a, surface #1a1a1a, accent #3b82f6)
- Bottom sheet pattern (Phase 2): potential use for measurement entry or photo pose selection
- Phase 5 swipeable sub-tab pattern: reuse for Measurements | Photos navigation
- Phase 6 chart patterns: reuse for per-measurement trend charts

### Established Patterns
- StyleSheet.create for all styling (no NativeWind className)
- Expo Router file-based routing: `app/(app)/(tabs)/` for tab screens
- Zustand + MMKV for state management
- Supabase migrations in `supabase/migrations/` for schema changes
- Card-based list UI pattern throughout app
- useFocusEffect for refreshing data when screen gains focus
- Ionicons for tab bar icons (Phase 3+)

### Integration Points
- New bottom tab: add `body.tsx` to `app/(app)/(tabs)/` and update tab layout
- New Supabase tables: `body_measurements` and `progress_photos`
- New Supabase Storage bucket: private bucket for progress photos with RLS
- New store: `bodyMetricsStore.ts` following Zustand + MMKV pattern
- expo-image-picker: new dependency for camera/gallery access

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-body-metrics*
*Context gathered: 2026-03-10*
