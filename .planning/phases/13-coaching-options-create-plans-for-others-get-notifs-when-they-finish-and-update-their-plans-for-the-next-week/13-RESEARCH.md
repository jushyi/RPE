# Phase 13: Coaching Options - Research

**Researched:** 2026-03-12
**Domain:** Multi-user coaching relationships, push notifications, cross-user plan management
**Confidence:** MEDIUM

## Summary

Phase 13 introduces the first multi-user interaction in the app: a coach-trainee relationship system. A coach generates invite codes to connect with trainees, creates/edits workout plans targeting trainee accounts, receives push notifications on workout completion and PRs, and gets weekly adherence summaries. This requires new Supabase tables (coaching_relationships, push_tokens, coach_notes), new RLS policies allowing cross-user data access through coaching relationships, Expo push notification infrastructure (token registration + server-side dispatch), and Supabase Edge Functions for push delivery and scheduled weekly summaries.

The app already has `expo-notifications` installed (used for alarms), a working Edge Function pattern (delete-account), and a complete plan builder UI that can be parameterized for coach-mode. The primary complexity is in RLS policy design for cross-user access and reliable push notification delivery.

**Primary recommendation:** Use application-level notification dispatch (Edge Function called from client after workout finish) for workout/PR notifications, and pg_cron-scheduled Edge Function for weekly summaries. Invite codes should be 6-character alphanumeric with 24-hour expiry.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Invite code system: coach generates a short code, trainee enters it to connect
- Users can be both coach AND trainee simultaneously
- No limit on number of trainees per coach
- Either side can disconnect the relationship unilaterally
- Coach-created plans are read-only for the trainee (coach has full edit control)
- Trainee keeps their own personal plans alongside coach-assigned plans
- Coach plans visually distinguished from personal plans in trainee's view
- Coach UI lives in the Plans tab with a toggle/section: "My Plans" vs "Trainees"
- Coach builds trainee plans using the same plan builder UI, targeting a different user
- Coach can see trainee's workout logs (sets/reps/weight) but NOT body metrics or photos
- Push notifications via Supabase Edge Function + Expo push service
- Notification triggers: workout completed, PR achieved, weekly adherence summary (Sunday evening)
- Requires new infrastructure: Expo Push Token storage, Edge Function, DB triggers
- Trainee gets push notification when coach updates their plan
- Coach edits trainee's plan directly in-place (no versioning/duplication)
- Inline performance view: each exercise shows what trainee actually lifted last week next to plan targets
- Coach can attach optional text note when saving plan changes
- Note shows to trainee alongside the plan update notification

### Claude's Discretion
- Invite code format and expiry duration
- Push notification Edge Function architecture details
- DB trigger vs application-level notification dispatch
- Weekly summary format and content
- How coach-created plans interact with alarm scheduling (trainee sets own alarms, or coach sets them)
- RLS policy design for cross-user plan access

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-notifications | ~55.0.11 | Push token registration + notification receipt | Already installed, handles both local alarms and push |
| @supabase/supabase-js | ^2.99.0 | Client-side DB operations + RLS | Already the project's backend client |
| Supabase Edge Functions (Deno) | Latest | Push notification dispatch + weekly cron | Existing pattern from delete-account function |
| pg_cron + pg_net | Supabase built-in | Schedule weekly summary Edge Function | Official Supabase approach for scheduled tasks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-constants | Already installed | Access projectId for push token | Token registration |
| expo-device | Already installed | Guard push token registration to physical devices | Token registration |
| zustand + react-native-mmkv | Already installed | coachingStore for relationship state | Client state management |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Application-level dispatch | DB trigger + webhook | DB triggers are harder to debug; application-level gives more control over notification content and timing |
| pg_cron weekly summary | Client-side scheduled check | pg_cron is reliable server-side; client might not be open Sunday evening |
| Expo Push Service | Direct FCM/APNs | Expo Push Service abstracts both platforms with a single API; no reason to use raw FCM/APNs |

## Architecture Patterns

### Recommended Project Structure
```
src/
  features/
    coaching/
      types.ts                    # CoachingRelationship, InviteCode, CoachNote types
      hooks/
        useCoaching.ts            # Relationship CRUD, invite code generation/redemption
        useCoachPlans.ts          # Coach-mode plan management (create/edit for trainee)
        useTraineePerformance.ts  # Fetch trainee's last-week actuals for inline display
      components/
        CoachTraineeToggle.tsx    # "My Plans" / "Trainees" section toggle in Plans tab
        TraineeCard.tsx           # Card showing trainee name, status, last workout
        InviteCodeModal.tsx       # Generate / enter invite code
        CoachPlanBadge.tsx        # Visual badge on coach-assigned plans in trainee view
        InlinePerformance.tsx     # Last-week actuals next to plan targets
        CoachNoteInput.tsx        # Text input for coach note on plan save
      utils/
        inviteCode.ts             # Code generation logic (6-char alphanumeric)
    notifications/
      hooks/
        usePushToken.ts           # Register push token on login, store in Supabase
      utils/
        pushTokenRegistration.ts  # getExpoPushTokenAsync wrapper
  stores/
    coachingStore.ts              # Zustand + MMKV for coaching relationships
supabase/
  functions/
    send-push/index.ts            # Generic push notification dispatch
    weekly-summary/index.ts       # Cron-triggered weekly adherence summary
  migrations/
    20260317000000_create_coaching.sql  # coaching_relationships, push_tokens, invite_codes, coach_notes
```

### Pattern 1: Invite Code Connection Flow
**What:** Coach generates a short alphanumeric code stored in DB with expiry. Trainee enters code to create a coaching_relationship row.
**When to use:** Connection establishment between coach and trainee.
**Example:**
```typescript
// Invite code generation (6-char alphanumeric, 24h expiry)
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 for readability
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// DB schema for invite_codes
// id, coach_id, code (unique), expires_at (now + 24h), redeemed_by, created_at
```

### Pattern 2: Cross-User Plan Creation (Coach Mode)
**What:** Coach uses the existing plan builder UI but targets a trainee's user_id. Plans are owned by the trainee (user_id = trainee_id) but have a coach_id column indicating the coach created them.
**When to use:** Coach creating/editing plans for a trainee.
**Example:**
```typescript
// Extended Plan type
interface Plan {
  // ... existing fields
  coach_id: string | null;  // null = personal plan, UUID = coach-created
}

// Coach creates plan: same createPlan flow but with trainee's userId
// RLS allows INSERT when auth.uid() has a coaching_relationship with the target user_id
```

### Pattern 3: Application-Level Push Notification Dispatch
**What:** After workout finish (or plan update), client calls the send-push Edge Function with notification details. Edge Function looks up recipient's push token and sends via Expo Push API.
**When to use:** Workout completion, PR detection, plan update notifications.
**Example:**
```typescript
// Client-side after workout completion
async function notifyCoach(traineeId: string, workoutTitle: string, hasPR: boolean) {
  // Find coaches for this trainee
  const { data: relationships } = await supabase
    .from('coaching_relationships')
    .select('coach_id')
    .eq('trainee_id', traineeId);

  if (!relationships?.length) return;

  await supabase.functions.invoke('send-push', {
    body: {
      recipient_ids: relationships.map(r => r.coach_id),
      title: hasPR ? 'PR Alert' : 'Workout Complete',
      body: `${traineeName} finished ${workoutTitle}`,
      data: { type: 'workout_complete', trainee_id: traineeId },
    },
  });
}
```

### Pattern 4: Push Token Registration
**What:** On app launch (after auth), register Expo push token and store in Supabase push_tokens table. Update on each launch in case token changes.
**When to use:** App startup, after authentication.
**Example:**
```typescript
// Source: Expo docs + Supabase push notifications guide
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

async function registerPushToken(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  // Upsert to push_tokens table
  await supabase.from('push_tokens').upsert({
    user_id: userId,
    token: token,
    platform: Platform.OS,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return token;
}
```

### Pattern 5: Weekly Summary via pg_cron
**What:** A pg_cron job runs Sunday at 6pm (user's timezone or UTC) calling the weekly-summary Edge Function, which aggregates each coach's trainees' adherence and sends a single push notification.
**When to use:** Weekly adherence summary to coach.
**Example:**
```sql
-- Schedule weekly summary Edge Function (Sunday 6pm UTC)
select cron.schedule(
  'weekly-coaching-summary',
  '0 18 * * 0',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/weekly-summary',
    headers := jsonb_build_object(
      'Content-type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{"trigger": "cron"}'::jsonb
  ) as request_id;
  $$
);
```

### Anti-Patterns to Avoid
- **Storing coach plans in a separate table:** Use the existing workout_plans table with an added coach_id column. Separate tables would fragment plan logic and require duplicating the entire plan builder.
- **Real-time subscriptions for notifications:** Overkill for this use case. Push notifications are fire-and-forget; the trainee does not need to be watching a channel.
- **Versioning coach plans:** User explicitly decided against versioning. Edit in-place with optional notes.
- **Building a messaging system:** Coach notes on plan updates are a lightweight alternative. Do not scope-creep into chat.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Push notification delivery | Custom FCM/APNs integration | Expo Push Service API (`exp.host/--/api/v2/push/send`) | Handles both platforms, manages tokens, provides delivery receipts |
| Scheduled jobs | setTimeout/setInterval on client | Supabase pg_cron + pg_net | Reliable server-side scheduling even if no client is active |
| Push token management | Custom token refresh logic | expo-notifications getExpoPushTokenAsync + upsert on launch | Token is stable across upgrades, just upsert each launch |
| Cross-user authorization | Custom middleware | Supabase RLS policies with coaching_relationships JOIN | Database-level security, cannot be bypassed from client |
| Invite code uniqueness | Retry loop on collision | DB UNIQUE constraint + ON CONFLICT retry | Database handles race conditions |

**Key insight:** The existing plan builder UI, Edge Function pattern, and expo-notifications infrastructure can all be reused. The main new work is database schema (relationships + push tokens + RLS) and the push dispatch Edge Function.

## Common Pitfalls

### Pitfall 1: RLS Policy Complexity for Coach Access
**What goes wrong:** RLS policies for coach access to trainee data are complex -- coach needs SELECT on trainee's workout_sessions/session_exercises/set_logs, INSERT/UPDATE/DELETE on trainee's plans (but only coach-created ones), and SELECT on trainee's profiles.
**Why it happens:** The existing RLS policies only allow `auth.uid() = user_id`. Adding coach access requires JOIN-based policies through coaching_relationships.
**How to avoid:** Create a helper function `is_coach_of(trainee_id UUID)` that checks coaching_relationships, then use it in all coach RLS policies. This keeps policies DRY and debuggable.
**Warning signs:** Coach gets empty results when fetching trainee data, or 403 errors on plan insert.

### Pitfall 2: Coach Plan Ownership Confusion
**What goes wrong:** If coach_id is on workout_plans but user_id is the trainee, the existing deactivate_other_plans trigger may interfere (setting is_active based on user_id). Coach-created plans should probably not use the is_active trigger.
**Why it happens:** The existing trigger deactivates all other plans for the same user_id when one is set active. A trainee might have one personal active plan AND one coach active plan.
**How to avoid:** Either exempt coach plans from the is_active exclusion trigger, or scope is_active separately for personal vs coach plans (e.g., both can be active simultaneously since they serve different purposes).
**Warning signs:** Setting a coach plan active deactivates the trainee's personal plan.

### Pitfall 3: Push Token Not Available
**What goes wrong:** Push token registration fails on emulators, or user denies notification permission.
**Why it happens:** getExpoPushTokenAsync requires a physical device and granted permissions.
**How to avoid:** Guard registration with Device.isDevice check. Handle permission denial gracefully -- coach features work without push, just no notifications. Show a prompt explaining why push is needed.
**Warning signs:** push_tokens table is empty for a user; Edge Function tries to send to null token.

### Pitfall 4: Notification Spam
**What goes wrong:** Coach with 10 trainees gets bombarded with notifications throughout the day.
**Why it happens:** Each workout completion fires a separate push notification.
**How to avoid:** Keep notifications concise. Group PR notifications into the workout-complete notification. Weekly summary batches adherence data. Consider a simple "mute notifications" toggle per trainee.
**Warning signs:** Coach disables app notifications entirely because of volume.

### Pitfall 5: Trainee Alarm Scheduling for Coach Plans
**What goes wrong:** Coach creates a plan with weekdays assigned but no alarms are scheduled because the alarm system is local to the trainee's device.
**Why it happens:** Alarm scheduling happens in usePlans.createPlan on the local device. Coach creates plans from their own device.
**How to avoid:** Trainee sets their own alarms for coach-assigned plans. When trainee receives a plan update notification and opens the plan, prompt them to set alarm times. Coach does NOT set alarms for trainees.
**Warning signs:** Trainee has a coach plan but never gets alarm reminders.

### Pitfall 6: Edge Function Auth for Cron-Triggered Calls
**What goes wrong:** The weekly-summary Edge Function needs service_role access to query all coaching relationships and push tokens, but cron calls use different auth than user-initiated calls.
**Why it happens:** Database webhook/cron calls don't have a user JWT.
**How to avoid:** Use service_role_key in the cron job's Authorization header. The Edge Function should verify the source (check for service role or a shared secret).
**Warning signs:** 401 errors in Edge Function logs from cron jobs.

## Code Examples

### Database Schema: Coaching Tables
```sql
-- Source: Designed for this project based on CONTEXT.md decisions

-- Push token storage (one token per user per device, simplified to one per user)
CREATE TABLE public.push_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token   TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push token"
  ON public.push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Invite codes for coach-trainee connection
CREATE TABLE public.invite_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code       TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Coach can create and view own codes
CREATE POLICY "Coach can manage own invite codes"
  ON public.invite_codes FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Anyone can redeem a code (SELECT to find it, then UPDATE to set redeemed_by)
CREATE POLICY "Anyone can view unexpired codes for redemption"
  ON public.invite_codes FOR SELECT
  USING (redeemed_by IS NULL AND expires_at > now());

CREATE POLICY "Anyone can redeem a code"
  ON public.invite_codes FOR UPDATE
  USING (redeemed_by IS NULL AND expires_at > now())
  WITH CHECK (auth.uid() = redeemed_by);

-- Coaching relationships
CREATE TABLE public.coaching_relationships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coach_id, trainee_id),
  CHECK(coach_id != trainee_id)
);

ALTER TABLE public.coaching_relationships ENABLE ROW LEVEL SECURITY;

-- Both parties can see the relationship
CREATE POLICY "Participants can view relationships"
  ON public.coaching_relationships FOR SELECT
  USING (auth.uid() = coach_id OR auth.uid() = trainee_id);

-- Only via invite code redemption (handled by application logic)
CREATE POLICY "Users can insert relationships"
  ON public.coaching_relationships FOR INSERT
  WITH CHECK (auth.uid() = trainee_id); -- trainee creates by redeeming code

-- Either side can disconnect
CREATE POLICY "Either party can delete relationship"
  ON public.coaching_relationships FOR DELETE
  USING (auth.uid() = coach_id OR auth.uid() = trainee_id);

-- Coach notes on plan updates
CREATE TABLE public.coach_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id    UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  coach_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;

-- Helper function for RLS
CREATE OR REPLACE FUNCTION public.is_coach_of(target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coaching_relationships
    WHERE coach_id = auth.uid() AND trainee_id = target_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Add coach_id column to workout_plans
ALTER TABLE public.workout_plans ADD COLUMN coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- New RLS policies for coach access to plans
CREATE POLICY "Coaches can view trainee plans they created"
  ON public.workout_plans FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert plans for trainees"
  ON public.workout_plans FOR INSERT
  WITH CHECK (
    coach_id = auth.uid()
    AND public.is_coach_of(user_id)
  );

CREATE POLICY "Coaches can update plans they created"
  ON public.workout_plans FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete plans they created"
  ON public.workout_plans FOR DELETE
  USING (auth.uid() = coach_id);

-- Coach can view trainee's workout sessions (read-only)
CREATE POLICY "Coaches can view trainee sessions"
  ON public.workout_sessions FOR SELECT
  USING (public.is_coach_of(user_id));

-- Cascade: coach can view trainee's session_exercises and set_logs
CREATE POLICY "Coaches can view trainee session exercises"
  ON public.session_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = session_exercises.session_id
      AND public.is_coach_of(ws.user_id)
    )
  );

CREATE POLICY "Coaches can view trainee set logs"
  ON public.set_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.session_exercises se
      JOIN public.workout_sessions ws ON ws.id = se.session_id
      WHERE se.id = set_logs.session_exercise_id
      AND public.is_coach_of(ws.user_id)
    )
  );

-- Coach can view trainee profile (display_name only, for UI)
CREATE POLICY "Coaches can view trainee profile"
  ON public.profiles FOR SELECT
  USING (public.is_coach_of(id));
```

### Edge Function: Send Push Notification
```typescript
// Source: Based on Supabase push notifications guide + project Edge Function pattern
// supabase/functions/send-push/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { recipient_ids, title, body, data } = await req.json();

    // Fetch push tokens for all recipients
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', recipient_ids);

    if (!tokens?.length) {
      return new Response(
        JSON.stringify({ sent: 0, reason: 'no_tokens' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Send via Expo Push API
    const messages = tokens.map((t: any) => ({
      to: t.token,
      sound: 'default',
      title,
      body,
      data,
    }));

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`,
      },
      body: JSON.stringify(messages),
    });

    const result = await res.json();

    return new Response(
      JSON.stringify({ sent: messages.length, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
```

### Inline Performance Display
```typescript
// Fetch trainee's last-week actuals for a specific plan day's exercises
async function fetchTraineePerformance(
  traineeId: string,
  exerciseIds: string[],
): Promise<Map<string, { weight: number; reps: number; sets: number }>> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('session_exercises')
    .select(`
      exercise_id,
      set_logs(weight, reps, unit),
      session:workout_sessions!inner(user_id, ended_at)
    `)
    .in('exercise_id', exerciseIds)
    .eq('session.user_id', traineeId)
    .gte('session.ended_at', oneWeekAgo)
    .not('session.ended_at', 'is', null)
    .order('session.ended_at', { ascending: false });

  // Aggregate: most recent session's data per exercise
  const performanceMap = new Map();
  // ... aggregate logic
  return performanceMap;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firebase Cloud Messaging directly | Expo Push Service (wraps FCM/APNs) | Expo SDK 47+ | Single API for both platforms, no separate FCM/APNs setup |
| Database webhooks for notifications | Application-level dispatch + cron for scheduled | 2024+ | More control, easier debugging, webhook timeouts can cause missed notifications |
| Supabase Realtime for live updates | Push notifications for async events | N/A | Push is better for "notify when app is closed" use cases |

**Deprecated/outdated:**
- expo-notifications `getDevicePushTokenAsync` -- use `getExpoPushTokenAsync` for Expo-managed push
- Supabase `supabase.functions.invoke` auth -- uses the current user's JWT by default, which is correct for user-initiated calls

## Open Questions

1. **Timezone handling for weekly summary**
   - What we know: pg_cron runs in UTC. "Sunday evening" is timezone-dependent.
   - What's unclear: Whether to send at a fixed UTC time or per-user timezone.
   - Recommendation: Send at Sunday 18:00 UTC (roughly evening in US timezones). For a friend group app, this is sufficient. Per-user timezone adds significant complexity.

2. **Coach plan alarm scheduling**
   - What we know: Alarms are local (expo-notifications scheduled notifications). Coach cannot schedule on trainee's device.
   - What's unclear: Should coach-assigned plans auto-prompt trainee for alarm setup?
   - Recommendation: Trainee sets own alarms. When a coach plan is first received or updated, show a prompt: "Your coach updated your plan. Set alarm reminders?" This keeps the alarm UX trainee-controlled.

3. **Push notification when app is in foreground**
   - What we know: expo-notifications can be configured to show/hide notifications when app is in foreground.
   - What's unclear: Should coach notifications show as banner when trainee is actively using app?
   - Recommendation: Use `setNotificationHandler` with `shouldShowAlert: true` for coaching notifications. The user should see plan updates even if app is open.

4. **Expo Access Token for push**
   - What we know: The Expo Push API now supports (and recommends) an access token for enhanced security.
   - What's unclear: Whether the current Expo project has this configured.
   - Recommendation: Generate an Expo Access Token in the Expo dashboard and store as Supabase secret. This is a one-time setup step.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + @testing-library/react-native 13 |
| Config file | jest.config.js (exists) |
| Quick run command | `npx jest --bail --testPathPattern coaching` |
| Full suite command | `npx jest --bail` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COACH-01 | Invite code generation (6-char, no ambiguous chars) | unit | `npx jest tests/inviteCode.test.ts -x` | No - Wave 0 |
| COACH-02 | Coaching relationship CRUD | unit | `npx jest tests/coaching.test.ts -x` | No - Wave 0 |
| COACH-03 | Coach plan creation targets trainee user_id | unit | `npx jest tests/coachPlans.test.ts -x` | No - Wave 0 |
| COACH-04 | is_coach_of helper function correctness | unit | `npx jest tests/coachRLS.test.ts -x` | No - Wave 0 |
| COACH-05 | Push token registration flow | unit | `npx jest tests/pushToken.test.ts -x` | No - Wave 0 |
| COACH-06 | send-push Edge Function dispatches correctly | manual-only | Manual: deploy + test with curl | N/A |
| COACH-07 | Weekly summary cron fires and aggregates | manual-only | Manual: verify cron job in Supabase dashboard | N/A |
| COACH-08 | Inline performance data fetch | unit | `npx jest tests/traineePerformance.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --bail --testPathPattern coaching`
- **Per wave merge:** `npx jest --bail`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/coaching/__tests__/inviteCode.test.ts` -- covers COACH-01
- [ ] `src/features/coaching/__tests__/useCoaching.test.ts` -- covers COACH-02
- [ ] `src/features/coaching/__tests__/coachPlans.test.ts` -- covers COACH-03
- [ ] `src/features/notifications/__tests__/pushToken.test.ts` -- covers COACH-05

## Sources

### Primary (HIGH confidence)
- [Supabase Push Notifications Guide](https://supabase.com/docs/guides/functions/examples/push-notifications) - Edge Function pattern, database webhook setup
- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) - Token registration, API endpoint, request format
- [Supabase Schedule Functions](https://supabase.com/docs/guides/functions/schedule-functions) - pg_cron + pg_net for Edge Function scheduling
- [Expo Notifications SDK](https://docs.expo.dev/versions/latest/sdk/notifications/) - getExpoPushTokenAsync API, Android channel requirement

### Secondary (MEDIUM confidence)
- [Supabase pg_cron Docs](https://supabase.com/docs/guides/database/extensions/pg_cron) - Cron expression format, vault secret storage
- [Supabase Cron Module](https://supabase.com/modules/cron) - Job scheduling capabilities

### Tertiary (LOW confidence)
- Weekly summary format/content -- designed for this project, no external source (needs user feedback)
- Invite code expiry duration (24h) -- reasonable default, no strong source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, Expo push is well-documented
- Architecture: MEDIUM - Multi-user RLS is complex, patterns are sound but implementation may surface edge cases
- Pitfalls: MEDIUM - Based on common patterns but specific to this project's schema
- Push notifications: HIGH - Official Supabase + Expo documentation covers the exact use case
- Weekly cron: MEDIUM - pg_cron is well-documented but timezone handling is a simplification

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (30 days - stable technologies)
