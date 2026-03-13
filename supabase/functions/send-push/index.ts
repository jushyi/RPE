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
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Manually verify JWT (verify_jwt=false at gateway to support ES256 tokens)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await adminClient.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { recipient_ids, title, body, data } = await req.json() as {
      recipient_ids: string[];
      title: string;
      body: string;
      data?: Record<string, unknown>;
    };

    if (!recipient_ids?.length || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recipient_ids, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch push tokens for all recipients
    const { data: tokens, error: tokenError } = await adminClient
      .from('push_tokens')
      .select('token')
      .in('user_id', recipient_ids);

    if (tokenError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!tokens?.length) {
      return new Response(
        JSON.stringify({ sent: 0, reason: 'no_tokens' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build Expo push messages
    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      sound: 'default' as const,
      title,
      body,
      ...(data ? { data } : {}),
    }));

    // Send via Expo Push API
    const expoPushHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
    if (expoAccessToken) {
      expoPushHeaders['Authorization'] = `Bearer ${expoAccessToken}`;
    }

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: expoPushHeaders,
      body: JSON.stringify(messages),
    });

    const result = await expoResponse.json();

    // Persist notification records for each recipient (fire-and-forget, must not block delivery)
    try {
      const notificationRecords = recipient_ids.map((recipientId: string) => ({
        user_id: recipientId,
        type: (data as any)?.type ?? 'unknown',
        title,
        body,
        data: data ?? {},
      }));
      await adminClient.from('notifications' as any).insert(notificationRecords);
    } catch (insertErr) {
      console.warn('Failed to persist notification records:', insertErr);
    }

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
