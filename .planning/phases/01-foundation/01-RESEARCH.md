# Phase 1: Foundation - Research

**Researched:** 2026-03-09
**Domain:** Expo project scaffold, Supabase auth + schema, offline session persistence, PR baseline entry
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire project from zero: Expo SDK 55 scaffold with TypeScript, Expo Router v7 file-based routing, NativeWind v4 dark theme, Zustand + MMKV state persistence, Supabase auth with offline-safe session handling, a Phase 1 database schema (users profile + PR baselines with RLS), and a post-signup PR baseline entry flow. The key technical challenges are (1) configuring Supabase auth sessions to survive offline app opens without logging users out, (2) setting up RLS correctly from day one, and (3) structuring the Expo Router layout with proper auth guards using `Stack.Protected`.

**Primary recommendation:** Use the `expo-sqlite/localStorage` polyfill as the Supabase auth storage adapter (official current recommendation), implement `AppState` listener to stop/start auto-refresh, and guard against offline logouts by detecting connectivity before token refresh. Use MMKV for all app state persistence via Zustand middleware. Structure routes with `(auth)` and `(app)` layout groups protected by `Stack.Protected` guards.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single screen with toggle between sign-in and sign-up (not separate screens)
- Sign-up collects: email, password, display name, profile photo
- Profile photo: one default avatar available, plus camera/gallery picker
- After sign-up, flow routes directly to PR baseline entry
- After PR baseline (or skip), lands on empty state dashboard shell
- Empty state dashboard has placeholder sections that future phases fill in
- PR baseline entry: Big 3 only (bench press, squat, deadlift)
- PR baseline step is skippable
- Input: weight number field per lift
- Global unit selector (kg/lbs) that defaults all fields, but each lift can override to the other unit
- Sign-up requires internet (Supabase must create the account)
- First launch with no internet: friendly message "Connect to the internet to create your account" with manual retry button
- After signed in, everything works normally offline with sync queued in background
- Connectivity indicators: persistent cloud icon in header (check/X) + toast banner that slides in/out on connectivity change
- Phase 1 schema only: users table and PR baselines -- each future phase adds its own tables
- Supabase built-in migration system (supabase/migrations/) for all schema changes
- Simple RLS: users can only read/write their own rows
- Supabase project created manually beforehand -- app just needs connection URL/keys configured

### Claude's Discretion
- Empty state dashboard layout and placeholder design
- Auth screen visual design (within dark/bold aesthetic)
- Toast banner animation and timing
- Default avatar design/selection
- Migration file naming convention

### Deferred Ideas (OUT OF SCOPE)
- Friend workout/PR visibility -- future phase (social features)
- Coach role: friends can send plans to each other -- future phase
- OAuth login (Google, Apple) -- out of scope per REQUIREMENTS.md
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can create account with email and password | Supabase Auth email/password signup, LargeSecureStore or expo-sqlite/localStorage for session persistence |
| AUTH-02 | User can log in and stay logged in across app restarts | Supabase persistSession + AppState listener for auto-refresh management, MMKV for token caching |
| AUTH-03 | User can log out from any screen | Supabase signOut() + Expo Router Stack.Protected guard redirects to auth screen |
| AUTH-04 | User data syncs to Supabase cloud automatically | Supabase client auto-syncs on write; NetInfo connectivity detection gates sync attempts |
| AUTH-05 | All workout logging works offline and syncs when connected | MMKV local persistence + NetInfo + queued sync pattern; for Phase 1 this means the app opens and is usable offline |
| AUTH-06 | During account setup, user can enter current 1RM values for key lifts | PR baselines table with user_id FK, RLS policy, weight + unit fields per lift |
</phase_requirements>

## Standard Stack

### Core (Phase 1 Specific)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Expo SDK | 55.0.x | App framework | New Architecture mandatory, React Native 0.83, React 19.2 |
| Expo Router | v7 (SDK 55) | File-based navigation with auth guards | `Stack.Protected` component for declarative auth routing |
| TypeScript | 5.x (Expo default) | Type safety | Scaffolded by default with SDK 55 |
| @supabase/supabase-js | ^2.98.0 | Auth + database client | Single SDK for auth, PostgreSQL queries, session management |
| NativeWind | 4.1.23 | Tailwind CSS in React Native | Dark mode classes for dark/bold aesthetic; pin with tailwindcss@3.4.17 |
| Zustand | ^5.0.11 | Client state (auth state, user prefs) | 2.7KB, synchronous reads, persist middleware |
| react-native-mmkv | ^4.2.0 | Local persistent storage | 30x faster than AsyncStorage, synchronous, Zustand persistence target |
| @react-native-community/netinfo | SDK 55 compatible | Connectivity detection | `useNetInfo` hook + `addEventListener` for online/offline state |
| expo-image-picker | SDK 55 bundled | Profile photo capture | Camera + gallery access for sign-up profile photo |
| expo-secure-store | SDK 55 bundled | Secure key storage | AES encryption key storage for LargeSecureStore pattern |
| react-native-reanimated | v4 (SDK 55) | Toast banner animation | Slide-in/out connectivity toast; bundled with SDK 55 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-sqlite | SDK 55 bundled | localStorage polyfill for Supabase auth | `import 'expo-sqlite/localStorage/install'` -- official Supabase storage adapter |
| @react-native-async-storage/async-storage | latest | Encrypted session storage backend | Used by LargeSecureStore pattern as encrypted value storage |
| aes-js | ^3.x | AES-256 encryption | Encrypts Supabase session before storing in AsyncStorage |
| react-native-get-random-values | latest | Crypto random for AES key generation | Required by LargeSecureStore for encryption key creation |
| react-hook-form | ^7.x | Auth form state | Sign-in/sign-up form with validation |
| zod | ^3.x | Input validation | Email/password validation schemas |
| @hookform/resolvers | latest | Bridges zod + react-hook-form | Form validation resolver |
| expo-dev-client | SDK 55 bundled | Development builds | Required for MMKV native module (not available in Expo Go) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-sqlite/localStorage | LargeSecureStore (aes-js + AsyncStorage + SecureStore) | LargeSecureStore encrypts sessions at rest but adds complexity; expo-sqlite/localStorage is the newer official recommendation and simpler. For a friends-group app, expo-sqlite/localStorage is sufficient. |
| MMKV for auth tokens | expo-secure-store directly | SecureStore has 2048-byte limit; MMKV is unencrypted but faster. Use SecureStore only for encryption keys, not full sessions. |

**Installation (Phase 1 only):**
```bash
# Create project
npx create-expo-app@latest GymApp --template default@sdk-55

# Supabase + auth storage
npx expo install @supabase/supabase-js expo-sqlite expo-secure-store
npx expo install @react-native-async-storage/async-storage

# State management + storage
npx expo install zustand react-native-mmkv

# Connectivity
npx expo install @react-native-community/netinfo

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# NativeWind (pin exact versions)
npm install nativewind@4.1.23 tailwindcss@3.4.17

# Profile photo
npx expo install expo-image-picker

# Dev tools
npx expo install expo-dev-client
```

## Architecture Patterns

### Recommended Project Structure (Phase 1)

```
app/
├── _layout.tsx              # Root layout: providers, Stack.Protected auth guard
├── index.tsx                # Entry point, redirects based on auth state
├── (auth)/
│   ├── _layout.tsx          # Auth stack layout
│   └── login.tsx            # Single screen: sign-in/sign-up toggle
├── (app)/
│   ├── _layout.tsx          # Tab navigator layout
│   ├── (tabs)/
│   │   └── dashboard.tsx    # Empty state dashboard shell
│   └── onboarding/
│       └── pr-baseline.tsx  # PR baseline entry (post-signup)

src/
├── features/
│   └── auth/
│       ├── hooks/
│       │   ├── useAuth.ts           # Auth state, sign-in, sign-up, sign-out
│       │   └── useSession.ts        # Session persistence, offline handling
│       ├── components/
│       │   ├── AuthForm.tsx          # Sign-in/sign-up toggle form
│       │   ├── ProfilePhotoPicker.tsx # Camera/gallery + default avatar
│       │   └── PRBaselineForm.tsx    # Big 3 weight entry with unit toggle
│       └── types.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Singleton Supabase client with storage adapter
│   │   └── types/
│   │       └── database.ts   # Generated database types (supabase gen types)
│   └── query/
│       └── client.ts         # TanStack Query client (minimal for Phase 1)
│
├── stores/
│   └── authStore.ts          # Zustand: user session, auth state, unit preference
│
├── hooks/
│   └── useNetworkStatus.ts   # NetInfo wrapper: isConnected, connectivity toast
│
├── components/
│   ├── ui/                   # Button, Input, Card (dark/bold themed)
│   └── layout/
│       ├── ConnectivityBanner.tsx  # Toast banner for connectivity changes
│       └── HeaderCloudIcon.tsx    # Persistent cloud icon (check/X)
│
├── constants/
│   └── theme.ts              # Dark/bold color palette, spacing
│
└── types/
    └── database.ts           # Supabase schema types

supabase/
├── migrations/
│   ├── 20260309000000_create_profiles.sql
│   └── 20260309000001_create_pr_baselines.sql
└── seed.sql                  # Optional test data
```

### Pattern 1: Supabase Client with Offline-Safe Auth

**What:** Initialize Supabase client with `expo-sqlite/localStorage` polyfill and an `AppState` listener that stops token auto-refresh when backgrounded and restarts on foreground. This prevents offline logouts.

**When to use:** Always -- this is the app entry point configuration.

**Example:**
```typescript
// src/lib/supabase/client.ts
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Stop auto-refresh when backgrounded to prevent offline logout
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
```
**Source:** [Supabase Expo React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native), [Expo Supabase Guide](https://docs.expo.dev/guides/using-supabase/)

### Pattern 2: Expo Router Auth Guard with Stack.Protected

**What:** Use `Stack.Protected` to declaratively guard routes based on auth state. Unauthenticated users see the `(auth)` group; authenticated users see the `(app)` group.

**When to use:** Root layout file.

**Example:**
```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <SplashScreen />;

  return (
    <Stack>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
```
**Source:** [Expo Router Protected Routes](https://docs.expo.dev/router/advanced/protected/)

### Pattern 3: Zustand + MMKV Persistence

**What:** Zustand store with MMKV storage adapter for instant synchronous reads on app launch (no flicker).

**When to use:** Any client state that must survive app restarts (user preferences, unit selection, onboarding completion).

**Example:**
```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

interface AuthState {
  hasCompletedOnboarding: boolean;
  preferredUnit: 'kg' | 'lbs';
  setOnboardingComplete: () => void;
  setPreferredUnit: (unit: 'kg' | 'lbs') => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      preferredUnit: 'lbs',
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      setPreferredUnit: (unit) => set({ preferredUnit: unit }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```
**Source:** [react-native-mmkv Zustand middleware docs](https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_ZUSTAND_PERSIST_MIDDLEWARE.md)

### Pattern 4: Connectivity Detection with Toast Banner

**What:** `@react-native-community/netinfo` provides `useNetInfo()` hook for real-time connectivity state. Combine with Reanimated for a slide-in/out toast.

**When to use:** Global layout wrapping all screens.

**Example:**
```typescript
// src/hooks/useNetworkStatus.ts
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';

export function useNetworkStatus() {
  const netInfo = useNetInfo();
  const wasConnected = useRef(netInfo.isConnected);

  // Track transitions for toast
  const justWentOffline = wasConnected.current === true && netInfo.isConnected === false;
  const justCameOnline = wasConnected.current === false && netInfo.isConnected === true;

  useEffect(() => {
    wasConnected.current = netInfo.isConnected;
  }, [netInfo.isConnected]);

  return {
    isConnected: netInfo.isConnected ?? true,
    justWentOffline,
    justCameOnline,
  };
}
```
**Source:** [@react-native-community/netinfo Expo docs](https://docs.expo.dev/versions/latest/sdk/netinfo/)

### Anti-Patterns to Avoid

- **Storing auth tokens in plain AsyncStorage:** Use `expo-sqlite/localStorage` (Supabase official) or LargeSecureStore with AES encryption. Never plain unencrypted AsyncStorage.
- **Calling `supabase.auth.getSession()` without checking connectivity:** This triggers a token refresh that fails offline and may clear the session. Check `NetInfo.isConnected` first or rely on `onAuthStateChange` listener.
- **Creating separate login and signup screens:** User decision is a single screen with toggle. Route file is one: `login.tsx`.
- **Skipping RLS during development:** Enable RLS on every table immediately at creation. Test via app client, not SQL Editor (which runs as superuser).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session encryption | Custom encryption with crypto | LargeSecureStore pattern (aes-js + SecureStore + AsyncStorage) or expo-sqlite/localStorage | Crypto is hard; the official pattern handles key rotation, size limits |
| Auth routing guards | Manual `useEffect` + `router.replace()` on auth change | `Stack.Protected` from Expo Router v7 | Declarative, handles edge cases (deep links, back navigation) |
| Connectivity detection | Manual `fetch('https://google.com')` polling | `@react-native-community/netinfo` `useNetInfo()` | OS-level network state, battery efficient, no polling overhead |
| Form validation | Manual `if/else` chains on form fields | react-hook-form + zod schemas | Type-safe, minimal re-renders, reusable validation |
| Local persistence | Raw `AsyncStorage.setItem` for JSON blobs | Zustand + MMKV persist middleware | Synchronous reads (no flicker), structured state, automatic serialization |
| UUID generation | `Math.random()` or timestamp-based IDs | PostgreSQL `gen_random_uuid()` + Supabase | Database-generated UUIDs avoid client-side collision; consistent format |

**Key insight:** Phase 1 is foundation-setting. Every shortcut here (plain AsyncStorage, missing RLS, manual auth guards) compounds as a rewrite cost in later phases.

## Common Pitfalls

### Pitfall 1: Supabase Auth Session Lost When App Opens Offline
**What goes wrong:** User opens app in the gym (no signal). Supabase auto-refresh attempts token refresh, fails, and clears the session -- user is logged out.
**Why it happens:** `autoRefreshToken: true` fires on a timer. Network failure during refresh can clear session state in some configurations.
**How to avoid:** Implement `AppState` listener that calls `supabase.auth.stopAutoRefresh()` when backgrounded and `startAutoRefresh()` on foreground. The session persisted in localStorage survives the app restart. Only clear session on explicit 401 from server, never on network timeout.
**Warning signs:** Users reporting logout when opening app without WiFi.

### Pitfall 2: RLS Not Enabled on PR Baselines Table
**What goes wrong:** Any authenticated user can read/write any other user's PR data via the Supabase API.
**Why it happens:** Supabase creates tables with RLS disabled by default. Developer tests with one user, it works, moves on.
**How to avoid:** Enable RLS and add policies in the same migration that creates the table. Never commit a migration without RLS.
**Warning signs:** RLS toggle OFF in Supabase dashboard; SQL Editor queries work but app queries return empty results.

### Pitfall 3: SecureStore 2048-Byte Limit Exceeded
**What goes wrong:** Supabase session JWT is larger than 2048 bytes. Storing it directly in `expo-secure-store` throws an error. App crashes or silently fails to persist session.
**Why it happens:** SecureStore has a documented size limit. Supabase sessions routinely exceed it.
**How to avoid:** Use `expo-sqlite/localStorage` polyfill (simpler) or the LargeSecureStore pattern (encrypts with AES, stores key in SecureStore, stores encrypted blob in AsyncStorage). Do NOT try to store the full session in SecureStore directly.
**Warning signs:** Session persistence works in development but fails sporadically in production.

### Pitfall 4: NativeWind v5 Instead of v4
**What goes wrong:** Installing latest NativeWind gets v5 (pre-release), which has breaking API changes and is not production stable.
**Why it happens:** `npm install nativewind` installs latest by default.
**How to avoid:** Pin exact versions: `nativewind@4.1.23` + `tailwindcss@3.4.17`. Add to package.json with exact version, not caret.
**Warning signs:** NativeWind styles not applying; console warnings about deprecated APIs.

### Pitfall 5: Testing RLS in SQL Editor (Bypasses Security)
**What goes wrong:** Developer verifies RLS policies using the Supabase SQL Editor, which runs as `postgres` superuser and bypasses all RLS. Policies appear to work but are actually broken.
**Why it happens:** SQL Editor is the most convenient way to run queries. But it does not respect RLS.
**How to avoid:** Test RLS from the app client (which connects as authenticated user via anon key). Or use the Supabase Table Editor's "View as user" feature. Verify cross-user isolation by creating two test accounts and confirming one cannot see the other's data.
**Warning signs:** "RLS is working" based solely on SQL Editor testing.

### Pitfall 6: Profile Photo Upload Blocking Sign-Up
**What goes wrong:** User takes a large photo, upload to Supabase Storage takes 10+ seconds on slow connection, sign-up flow appears frozen.
**Why it happens:** Photo upload is in the critical path of account creation.
**How to avoid:** Create the account first (fast), then upload photo in background. Store a local URI immediately, upload async, update profile when done. If upload fails, use default avatar -- user can retry from settings later.
**Warning signs:** Sign-up takes > 3 seconds; users on slow connections abandon sign-up.

## Code Examples

### Supabase Schema: Profiles Table
```sql
-- supabase/migrations/20260309000000_create_profiles.sql

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  preferred_unit TEXT NOT NULL DEFAULT 'lbs' CHECK (preferred_unit IN ('kg', 'lbs')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Supabase Schema: PR Baselines Table
```sql
-- supabase/migrations/20260309000001_create_pr_baselines.sql

CREATE TABLE public.pr_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,  -- 'bench_press', 'squat', 'deadlift'
  weight NUMERIC(6,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'lbs' CHECK (unit IN ('kg', 'lbs')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_name)
);

ALTER TABLE public.pr_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own PR baselines"
  ON public.pr_baselines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PR baselines"
  ON public.pr_baselines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PR baselines"
  ON public.pr_baselines FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for RLS performance
CREATE INDEX idx_pr_baselines_user_id ON public.pr_baselines(user_id);
```

### Sign-Up with Profile Photo (Non-Blocking Upload)
```typescript
// src/features/auth/hooks/useAuth.ts
import { supabase } from '@/lib/supabase/client';

export function useAuth() {
  const signUp = async ({
    email, password, displayName, photoUri
  }: SignUpParams) => {
    // 1. Create account (requires internet -- checked before calling)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) throw error;

    // 2. Upload photo in background (non-blocking)
    if (photoUri && data.user) {
      uploadProfilePhoto(data.user.id, photoUri).catch(console.warn);
    }

    return data;
  };

  // ...
}

async function uploadProfilePhoto(userId: string, uri: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filePath = `${userId}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

  if (!uploadError) {
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', userId);
  }
}
```

### NativeWind Configuration
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark/bold palette
        background: '#0a0a0a',
        surface: '#1a1a1a',
        'surface-elevated': '#252525',
        accent: '#3b82f6',       // Blue accent
        'accent-bright': '#60a5fa',
        'text-primary': '#f5f5f5',
        'text-secondary': '#a3a3a3',
        'text-muted': '#737373',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
    },
  },
  plugins: [],
};
```

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Environment Variables
```
# .env (add to .gitignore)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AsyncStorage for Supabase auth | expo-sqlite/localStorage polyfill | 2025 | Simpler setup, official recommendation, no size limits |
| LargeSecureStore with aes-js | expo-sqlite/localStorage (or LargeSecureStore for high-security) | Late 2025 | LargeSecureStore still valid but expo-sqlite/localStorage is simpler for most apps |
| Manual redirect-based auth guards | Stack.Protected declarative guards | Expo Router v7 (SDK 55) | Eliminates race conditions, handles deep links automatically |
| Expo Go for development | expo-dev-client | SDK 55 | MMKV, notifications, and other native modules require dev client |
| NativeWind v2 with babel plugin | NativeWind v4 with metro plugin | 2024 | Better performance, CSS-based, Tailwind v3 support |
| Reanimated v3 | Reanimated v4 (SDK 55 mandatory) | Feb 2026 | New Architecture required; v3 does not work with SDK 55 |

**Deprecated/outdated:**
- NativeWind v5: Pre-release, do not use
- AsyncStorage for auth sessions: Works but has performance and security disadvantages
- Manual `useEffect` + `router.replace` auth guards: Replaced by `Stack.Protected`

## Open Questions

1. **expo-sqlite/localStorage vs LargeSecureStore for auth storage**
   - What we know: expo-sqlite/localStorage is the current official Supabase recommendation (simpler). LargeSecureStore encrypts at rest (more secure). Both work.
   - What's unclear: Whether expo-sqlite/localStorage data is encrypted at rest on iOS (iOS has file-level encryption by default) and Android (varies by device).
   - Recommendation: Use expo-sqlite/localStorage for simplicity. The app stores workout data, not financial data. iOS encrypts at rest by default. Android encryption depends on device but risk is low for a friends-group app.

2. **Profile photo storage bucket: public vs private**
   - What we know: Private buckets require signed URLs. Public buckets allow anyone with the URL to access the photo.
   - What's unclear: Whether avatar photos need privacy (they are profile photos, inherently semi-public).
   - Recommendation: Use a public bucket for avatars (simpler). Progress photos (Phase 7) will use a private bucket. Avatar URLs are stored in the profiles table which is already RLS-protected.

3. **Supabase CLI for local development vs direct remote**
   - What we know: Supabase CLI provides local Postgres + auth via Docker. CONTEXT.md says Supabase project is created manually beforehand.
   - What's unclear: Whether the developer has Docker installed for local development.
   - Recommendation: Write migrations as SQL files in `supabase/migrations/`. They can be applied via `supabase db push` to the remote project directly. Local Docker setup is optional but recommended.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (Expo default) + React Native Testing Library |
| Config file | None -- Wave 0 will create jest.config.js |
| Quick run command | `npx jest --testPathPattern=test_name -x` |
| Full suite command | `npx jest` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Sign up creates account + profile | integration | `npx jest tests/auth/signup.test.ts -x` | No -- Wave 0 |
| AUTH-02 | Session persists across restarts | unit | `npx jest tests/auth/session-persistence.test.ts -x` | No -- Wave 0 |
| AUTH-03 | Sign out clears session and redirects | unit | `npx jest tests/auth/signout.test.ts -x` | No -- Wave 0 |
| AUTH-04 | Data syncs to Supabase when online | integration | `npx jest tests/sync/auto-sync.test.ts -x` | No -- Wave 0 |
| AUTH-05 | App usable offline (no crash, no forced logout) | manual-only | Manual: enable airplane mode, open app, verify no crash | N/A |
| AUTH-06 | PR baseline entry saves to database | integration | `npx jest tests/auth/pr-baseline.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --bail --testPathPattern=<relevant_test>`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `jest.config.js` -- Jest configuration for Expo + TypeScript
- [ ] `tests/setup.ts` -- Test setup file (mock MMKV, mock Supabase, mock NetInfo)
- [ ] `tests/auth/signup.test.ts` -- AUTH-01 coverage
- [ ] `tests/auth/session-persistence.test.ts` -- AUTH-02 coverage
- [ ] `tests/auth/signout.test.ts` -- AUTH-03 coverage
- [ ] `tests/sync/auto-sync.test.ts` -- AUTH-04 coverage
- [ ] `tests/auth/pr-baseline.test.ts` -- AUTH-06 coverage
- [ ] Framework install: `npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo`

## Sources

### Primary (HIGH confidence)
- [Supabase Expo React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) -- client setup, localStorage adapter, AppState listener
- [Supabase Expo Tutorial with SecureStore](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native?auth-store=secure-store) -- LargeSecureStore pattern, AES encryption
- [Expo Router Protected Routes](https://docs.expo.dev/router/advanced/protected/) -- Stack.Protected API, auth guard pattern
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) -- SDK version, Router v7, New Architecture mandatory
- [Expo Supabase Guide](https://docs.expo.dev/guides/using-supabase/) -- expo-sqlite/localStorage official recommendation
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- policy syntax, testing guidance
- [@react-native-community/netinfo Expo Docs](https://docs.expo.dev/versions/latest/sdk/netinfo/) -- useNetInfo hook, connectivity detection
- [Supabase CLI Migration Reference](https://supabase.com/docs/reference/cli/supabase-migration-new) -- timestamp naming, migration workflow

### Secondary (MEDIUM confidence)
- [react-native-mmkv Zustand Middleware](https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_ZUSTAND_PERSIST_MIDDLEWARE.md) -- MMKV + Zustand persist pattern
- [NativeWind v4 Installation](https://www.nativewind.dev/docs/getting-started/installation) -- metro config, tailwind setup, TypeScript types
- [Supabase Auth Offline Discussion](https://github.com/orgs/supabase/discussions/36906) -- session loss when offline, community workarounds

### Tertiary (LOW confidence)
- [Expo-sqlite localStorage web polyfill behavior](https://www.amarjanica.com/expo-sqlite-on-the-web-localstorage-indexeddb-and-sql-js/) -- localStorage polyfill internals, needs validation for SDK 55

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified via official docs and Expo SDK 55 changelog
- Architecture: HIGH -- patterns from official Supabase + Expo documentation
- Auth + offline: HIGH -- verified via official Supabase quickstart and community discussions
- Pitfalls: HIGH -- verified across multiple sources, some from project-level research
- Schema design: MEDIUM -- follows Supabase RLS patterns, trigger-based profile creation is standard but needs testing
- NativeWind setup: MEDIUM -- v4 installation docs verified, but SDK 55 specific combo needs build validation

**Research date:** 2026-03-09
**Valid until:** 2026-04-08 (30 days -- stack is stable)
