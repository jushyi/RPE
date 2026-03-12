// Run in Supabase SQL Editor to schedule weekly summary (Sunday 6pm UTC):
// select cron.schedule('weekly-coaching-summary', '0 18 * * 0', $$
//   select net.http_post(
//     url := '<SUPABASE_URL>/functions/v1/weekly-summary',
//     headers := '{"Content-type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
//     body := '{"trigger":"cron"}'::jsonb
//   ) as request_id;
// $$);

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth: verify service_role key (pg_cron calls with service_role, no user JWT)
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Service role client for cross-user queries
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceRoleKey,
    );

    // Get all coaching relationships grouped by coach
    const { data: relationships, error: relError } = await adminClient
      .from('coaching_relationships')
      .select('coach_id, trainee_id');

    if (relError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch coaching relationships' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!relationships?.length) {
      return new Response(
        JSON.stringify({ coaches_notified: 0, reason: 'no_relationships' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Group trainees by coach
    const coachTrainees = new Map<string, string[]>();
    for (const rel of relationships) {
      const trainees = coachTrainees.get(rel.coach_id) ?? [];
      trainees.push(rel.trainee_id);
      coachTrainees.set(rel.coach_id, trainees);
    }

    // Calculate date range: past 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Collect all unique trainee IDs
    const allTraineeIds = [...new Set(relationships.map((r: { trainee_id: string }) => r.trainee_id))];

    // Fetch trainee profiles for display names
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, display_name')
      .in('id', allTraineeIds);

    const nameMap = new Map<string, string>();
    for (const p of (profiles ?? [])) {
      nameMap.set(p.id, p.display_name ?? 'Trainee');
    }

    // Fetch workout sessions for all trainees in the past 7 days
    const { data: sessions } = await adminClient
      .from('workout_sessions')
      .select('user_id, id, exercises')
      .in('user_id', allTraineeIds)
      .gte('ended_at', sevenDaysAgoISO);

    // Fetch plan days for planned session count
    const { data: planDays } = await adminClient
      .from('plan_days')
      .select('plan_id, weekday, workout_plans!inner(user_id, is_active)')
      .in('workout_plans.user_id', allTraineeIds)
      .eq('workout_plans.is_active', true);

    // Compute per-trainee stats
    interface TraineeStats {
      sessionsCompleted: number;
      totalExercises: number;
      prCount: number;
      plannedDays: number;
    }

    const traineeStats = new Map<string, TraineeStats>();

    // Initialize stats for all trainees
    for (const traineeId of allTraineeIds) {
      traineeStats.set(traineeId, {
        sessionsCompleted: 0,
        totalExercises: 0,
        prCount: 0,
        plannedDays: 0,
      });
    }

    // Count sessions and exercises
    for (const session of (sessions ?? [])) {
      const stats = traineeStats.get(session.user_id);
      if (!stats) continue;
      stats.sessionsCompleted++;

      // Count exercises and PRs from session data
      const exercises = session.exercises as any[] ?? [];
      stats.totalExercises += exercises.length;
      for (const ex of exercises) {
        const sets = ex.logged_sets ?? [];
        for (const s of sets) {
          if (s.is_pr) stats.prCount++;
        }
      }
    }

    // Count planned days per trainee (unique weekdays with active plans)
    for (const pd of (planDays ?? [])) {
      const plan = (pd as any).workout_plans;
      if (!plan?.user_id) continue;
      const stats = traineeStats.get(plan.user_id);
      if (stats && pd.weekday !== null) {
        stats.plannedDays++;
      }
    }

    // Build and send summary per coach
    let coachesNotified = 0;

    const expoPushHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
    if (expoAccessToken) {
      expoPushHeaders['Authorization'] = `Bearer ${expoAccessToken}`;
    }

    for (const [coachId, traineeIds] of coachTrainees.entries()) {
      // Build summary lines per trainee
      const summaryLines: string[] = [];

      for (const traineeId of traineeIds) {
        const stats = traineeStats.get(traineeId);
        if (!stats) continue;

        const name = nameMap.get(traineeId) ?? 'Trainee';
        const planned = stats.plannedDays || 1; // avoid division by zero
        const pct = Math.min(100, Math.round((stats.sessionsCompleted / planned) * 100));
        let line = `${name}: ${stats.sessionsCompleted}/${stats.plannedDays || '?'} sessions (${pct}%)`;
        if (stats.prCount > 0) {
          line += `, ${stats.prCount} PR${stats.prCount > 1 ? 's' : ''}`;
        }
        summaryLines.push(line);
      }

      if (summaryLines.length === 0) continue;

      // Truncate body to ~200 chars
      let body = summaryLines.join('. ');
      if (body.length > 200) {
        body = body.substring(0, 197) + '...';
      }

      // Fetch push tokens for this coach
      const { data: tokens } = await adminClient
        .from('push_tokens')
        .select('token')
        .eq('user_id', coachId);

      if (!tokens?.length) continue;

      // Build Expo push messages
      const messages = tokens.map((t: { token: string }) => ({
        to: t.token,
        sound: 'default' as const,
        title: 'Weekly Training Summary',
        body,
        data: { type: 'weekly_summary' },
      }));

      // Dispatch to Expo Push API directly
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: expoPushHeaders,
          body: JSON.stringify(messages),
        });
        coachesNotified++;
      } catch (err) {
        console.warn(`Failed to send weekly summary to coach ${coachId}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ coaches_notified: coachesNotified }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
