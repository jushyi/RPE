# Stack Research

**Domain:** React Native fitness/gym tracking mobile app with Supabase backend
**Researched:** 2026-03-09
**Confidence:** MEDIUM-HIGH (core stack HIGH, supporting libs MEDIUM)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo SDK | 55.0.x | App framework and build system | SDK 55 (Feb 2026) ships React Native 0.83 + React 19.2. New Architecture is now mandatory — no opt-in required. Managed workflow eliminates native build complexity for a small-team project. EAS Build handles iOS/Android distribution without a Mac. |
| React Native | 0.83 (via Expo) | Cross-platform mobile runtime | Bundled with Expo SDK 55. New Architecture (Fabric renderer + JSI) is the default. Do not pin separately — let Expo manage the version to avoid compatibility breaks. |
| TypeScript | 5.x (Expo default) | Type safety across entire codebase | Expo SDK 55 scaffolds TypeScript by default. Catches workout schema mismatches at compile time (sets/reps/weight/RPE types). All recommended libraries have first-class TS support. |
| Expo Router | v7 (bundled with SDK 55) | File-based navigation | Ships with SDK 55. File-based routing matches the tab+stack layout this app needs (tabs: Dashboard, Workout, History, Metrics). Typed routes eliminate string-based navigation bugs. Built on React Navigation under the hood so RN Navigation APIs remain accessible. |
| Supabase JS | ^2.98.0 | Database, auth, storage, real-time | Official client. v2 provides typed DB queries, Auth helpers, Storage SDK, and Realtime subscriptions. Works in React Native with AsyncStorage as the session store. Single SDK covers all backend needs: auth, PostgreSQL queries, file uploads for progress photos, and real-time sync. |

### State Management

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zustand | ^5.0.11 | Global client state (active workout session, UI state) | 2.7KB bundle. Synchronous reads — critical for a focus-mode workout screen where every tap must feel instant. No boilerplate. Persists to MMKV via middleware. v5 uses native `useSyncExternalStore` for correct concurrent rendering with React 19. |
| React Query (TanStack Query) | ^5.x | Server state (fetching plans, history, metrics from Supabase) | Separates server state from client state. Caches Supabase responses, handles loading/error states, deduplicates requests. Pair with Supabase: React Query fetches, Zustand holds active session. Do NOT use Zustand for server state — it creates a manual cache you'll regret. |

### Data & Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-native-mmkv | ^4.2.0 | Local persistent storage (offline-first, session persistence) | 30x faster than AsyncStorage. Synchronous reads mean no flickering on app load. Required for Zustand persistence middleware. SDK 55 uses New Architecture — MMKV v3+ is a pure C++ TurboModule and works natively. Use for: auth token cache, last workout state, offline queue. |
| @supabase/supabase-js AsyncStorage adapter | (bundled with supabase-js) | Supabase Auth session persistence | Supabase Auth requires a storage adapter in React Native. Use `@react-native-async-storage/async-storage` specifically for the Supabase client init (Supabase's official recommendation) — MMKV for app state, AsyncStorage only for Supabase Auth sessions. |

### UI & Styling

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| NativeWind | ^4.1.23 | Tailwind CSS utility classes in React Native | v4 is production-stable. The dark & bold aesthetic from the project brief maps directly to Tailwind's dark mode classes (`dark:bg-zinc-950`, `dark:text-white`). Eliminates StyleSheet boilerplate. Stable combo: `nativewind@4.1.23` + `tailwindcss@3.4.17`. Do NOT use v5 — still pre-release as of March 2026. |
| react-native-reanimated | ^4.x (SDK 55 bundled) | Smooth animations (focus mode transitions, chart animations) | v4 ships with SDK 55 and requires New Architecture (which SDK 55 mandates). Use for: slide transitions between exercises in focus mode, chart entry animations. Do NOT use RN's built-in `Animated` API — runs on JS thread, causes dropped frames during workout logging. |
| react-native-gesture-handler | SDK 55 bundled | Touch interactions, swipe gestures | Required peer dependency of Reanimated and Victory Native XL. Enables native-thread gesture handling. Expo SDK 55 bundles a compatible version — do not install separately. |
| @shopify/react-native-skia | SDK 55 bundled | Canvas rendering for charts | Required peer dependency of Victory Native XL. GPU-accelerated canvas. Bundled with Expo SDK 55. |

### Charts

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| victory-native (Victory Native XL) | ^41.20.2 | Progress charts (strength trends, body metrics over time) | The XL rewrite uses Skia + Reanimated for GPU-accelerated rendering — no SVG slowdowns. Supports line charts (weight over time), bar charts (volume per session). Composable API: build exactly the chart needed without wrestling a monolithic component. Maintained by Nearform. All peer deps (Reanimated, Gesture Handler, Skia) are already in the SDK 55 stack. |

### Notifications & Alarms

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| expo-notifications | SDK 55 bundled | Local notifications, scheduled workout reminders, missed workout nudges | Official Expo SDK. Handles both local (alarm-style) and push notifications. Supports custom sound, vibration patterns, and sticky (must-dismiss) notifications on Android. Requires `SCHEDULE_EXACT_ALARM` permission on Android 12+ for precise alarm timing. This is the only viable choice in the Expo managed workflow. |

### Forms & Validation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-hook-form | ^7.x | Form state for workout logging, plan builder, metrics entry | Minimal re-renders — critical when a user is entering reps/weight with a sweaty finger. Controlled inputs without performance cost. |
| Zod | ^3.x | Schema validation for all user inputs | Type-safe validation that mirrors the Supabase database schema. Define once, validate on form and on Supabase insert. `@hookform/resolvers` bridges both. |

### Media

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| expo-image-picker | SDK 55 bundled | Progress photo capture and library selection | Official Expo SDK. Accesses camera and photo library. Supabase Storage integration is well-documented with this pairing. Supports compression before upload to keep storage costs low for a friends-group app. |
| expo-image | SDK 55 bundled | Displaying progress photos efficiently | Replaces the default RN `<Image>` component. Handles caching, progressive loading, and memory management — important when displaying a timeline of progress photos. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| EAS Build | Cloud builds for iOS and Android | Required for production `.ipa`/`.apk`. Free tier supports small teams. Handles code signing without a Mac for Android. |
| EAS Update | OTA updates post-ship | Push bug fixes without App Store review. SDK 55's Hermes bytecode diffing reduces update download size by ~75%. |
| Expo Dev Client | Development builds with native modules | Required for `expo-notifications` and `react-native-mmkv` (not available in Expo Go). Run `npx expo install expo-dev-client`. |
| TypeScript strict mode | Compile-time safety | Enable `"strict": true` in `tsconfig.json`. Expo SDK 55 scaffolds this by default. |
| ESLint + `eslint-config-expo` | Linting | Expo's official ESLint config covers RN-specific rules. |

---

## Installation

```bash
# Create project with SDK 55 template (includes Expo Router v7, TypeScript, NativeWind)
npx create-expo-app@latest GymApp --template default@sdk-55

# Backend
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage

# State management
npx expo install zustand @tanstack/react-query

# Fast local storage
npx expo install react-native-mmkv

# Charts (peer deps bundled with SDK 55, but declare explicitly)
npx expo install victory-native react-native-reanimated react-native-gesture-handler @shopify/react-native-skia

# Forms
npx expo install react-hook-form zod @hookform/resolvers

# NativeWind (pin stable versions)
npm install nativewind@4.1.23 tailwindcss@3.4.17

# Dev tools
npx expo install expo-dev-client
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Expo Router v7 | React Navigation 7 standalone | If you need extremely complex nested navigation patterns or are not using Expo. For this app, Expo Router is the right default. |
| Zustand | Redux Toolkit | Only when you have a large team needing strict unidirectional data flow, time-travel debugging, or complex middleware pipelines. Overkill for a friends-group app. |
| TanStack Query | SWR | SWR is simpler but less featured. TanStack Query's offline mutation queuing is valuable for workout logging at the gym with poor connectivity. |
| NativeWind v4 | StyleSheet API | Use plain StyleSheet for one-off components or third-party library overrides. NativeWind for all app UI. |
| Victory Native XL | react-native-gifted-charts | Gifted Charts is simpler but SVG-based and slower. Victory Native XL's Skia renderer is meaningfully faster for animated charts. |
| MMKV | AsyncStorage | AsyncStorage is fine for Supabase Auth session (as Supabase officially recommends it there). Do not use AsyncStorage for anything performance-sensitive. |
| expo-notifications | react-native-push-notification | The RN library requires ejecting from Expo managed workflow. Not worth it for this project. expo-notifications handles everything needed. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| React Navigation 5/6 standalone | SDK 55's default is Expo Router v7 which wraps React Navigation 7. Using an older standalone version creates version conflicts and loses typed routes. | Expo Router v7 (bundled) |
| Redux / Redux Toolkit | 15KB+ bundle, extensive boilerplate for no benefit at this scale. A fitness tracker for friends is not a Redux use case. | Zustand + TanStack Query |
| AsyncStorage (for app state) | Async reads cause UI flicker on app launch. Slow for frequent read/write during workout logging. | react-native-mmkv |
| react-native-chart-kit | SVG-based, poor performance on animated data. Last meaningful update was years ago. Community has moved to Victory Native XL and react-native-gifted-charts. | victory-native (Victory Native XL) |
| Firebase / Firestore | Project explicitly chose Supabase for SQL-based relational queries. Workout progress tracking queries (e.g., "max weight for bench press over last 90 days") are far cleaner in PostgreSQL than Firestore's document model. | Supabase |
| Expo Go (for production testing) | expo-notifications push and MMKV require native modules unavailable in Expo Go. You'll hit silent failures. | Expo Dev Client (`expo-dev-client`) |
| NativeWind v5 | Pre-release as of March 2026. Breaking API changes expected. | NativeWind v4.1.23 |
| Reanimated v3 | SDK 55 mandates New Architecture. Reanimated v3 is the old-architecture version. v4 ships with SDK 55. | react-native-reanimated v4 (SDK 55 bundled) |
| Custom alarm/sound system | Building a true alarm (persistent sound + required dismiss) from scratch in React Native is extremely fragile across iOS/Android versions. | expo-notifications with sticky notifications + `SCHEDULE_EXACT_ALARM` permission |

---

## Stack Patterns by Variant

**For the active workout focus screen (performance-critical):**
- Read sets/reps from MMKV (synchronous, no flicker)
- Write completed sets to MMKV immediately (offline buffer)
- Flush to Supabase via TanStack Query mutation after set is confirmed
- Use Reanimated for slide-to-next-exercise transitions
- Do NOT call Supabase on every rep entry

**For progress charts:**
- Fetch history data via TanStack Query (cached, background refresh)
- Pass to Victory Native XL line/bar charts
- Use Skia-powered rendering — no SVG

**For alarm system:**
- Schedule with `expo-notifications` `scheduleNotificationAsync` with `CalendarTrigger`
- Set `SCHEDULE_EXACT_ALARM` in `app.json` Android permissions
- Use sticky + high-priority channel for the "real alarm" feel
- Missed workout nudge: schedule a follow-up notification at end-of-day if no workout log exists for that day

**For progress photos:**
- Capture with `expo-image-picker`
- Upload to Supabase Storage bucket (one bucket per user, path: `{userId}/photos/{timestamp}.jpg`)
- Store only the Supabase Storage URL in the database row
- Display with `expo-image` for cached rendering

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Expo SDK 55.0.x | React Native 0.83, React 19.2 | New Architecture is mandatory — cannot be disabled in SDK 55 |
| react-native-reanimated v4 | Expo SDK 55, New Architecture only | v3 does NOT work with SDK 55 |
| react-native-mmkv ^4.2.0 | Expo SDK 55, New Architecture | v4 is a pure C++ TurboModule; requires New Architecture |
| NativeWind 4.1.23 | tailwindcss 3.4.17 | This exact combo is the stable production pairing; do not use NativeWind v5 |
| @supabase/supabase-js ^2.98.0 | Node.js 20+ (dev), React Native current | Node 18 support dropped in supabase-js v2.79.0 |
| victory-native 41.20.2 | react-native-reanimated v4, @shopify/react-native-skia, react-native-gesture-handler | All three peer deps required; all bundled with Expo SDK 55 |
| Zustand ^5.0.11 | React 18+, React Native New Architecture | v5.0.4+ fixes module resolution issues for React Native specifically |

---

## Sources

- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) — SDK version, RN 0.83, Expo Router v7, New Architecture mandatory (HIGH confidence)
- [Expo SDK 55 Upgrade Guide](https://expo.dev/blog/upgrading-to-sdk-55) — Breaking changes, Reanimated v4 requirement (HIGH confidence)
- [Supabase Expo React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) — Official Supabase + Expo setup (HIGH confidence)
- [supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — v2.98.0 current version (HIGH confidence)
- [react-native-mmkv GitHub](https://github.com/mrousavy/react-native-mmkv) — v4.2.0, New Architecture requirement (HIGH confidence)
- [NativeWind v4 Announcement](https://www.nativewind.dev/blog/announcement-nativewind-v4) — v4 stable, v5 pre-release status (MEDIUM confidence)
- [Victory Native XL GitHub](https://github.com/FormidableLabs/victory-native-xl) — v41.20.2, Skia + Reanimated peer deps (MEDIUM confidence)
- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/) — SCHEDULE_EXACT_ALARM, sticky notifications (HIGH confidence)
- [Zustand GitHub Releases](https://github.com/pmndrs/zustand/releases) — v5.0.11, React Native compatibility (HIGH confidence)
- [TanStack Query v5 Docs](https://tanstack.com/query/latest) — v5 current, React Native support (MEDIUM confidence)
- [React Navigation 7 vs Expo Router Comparison](https://viewlytics.ai/blog/react-navigation-7-vs-expo-router) — Navigation choice rationale (MEDIUM confidence, WebSearch)
- [MMKV vs AsyncStorage 2025](https://reactnativeexpert.com/blog/mmkv-vs-asyncstorage-in-react-native/) — Performance comparison (MEDIUM confidence, WebSearch)

---

*Stack research for: React Native gym tracking app with Supabase*
*Researched: 2026-03-09*
