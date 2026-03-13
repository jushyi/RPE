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

    const body = await req.json() as Record<string, unknown>;

    // ── Chat message path: resolve recipients from group_members ────────
    if (body.type === 'chat_message') {
      const { group_id, sender_id, sender_name, group_name, message_preview } = body as {
        group_id: string;
        sender_id: string;
        sender_name: string;
        group_name: string;
        message_preview: string;
      };

      if (!group_id || !sender_id) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields for chat_message: group_id, sender_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Fetch non-muted group members excluding sender
      const { data: members, error: membersError } = await adminClient
        .from('group_members' as any)
        .select('user_id, muted')
        .eq('group_id', group_id)
        .neq('user_id', sender_id);

      if (membersError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch group members' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      if (!members?.length) {
        return new Response(
          JSON.stringify({ sent: 0, reason: 'no_members' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const recipientIds: string[] = (members as { user_id: string; muted: boolean }[])
        .filter((m) => !m.muted)
        .map((m) => m.user_id);

      if (recipientIds.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, reason: 'all_muted' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const preview = message_preview
        ? message_preview.slice(0, 100)
        : 'sent a message';

      return await deliverPushMessages(adminClient, {
        recipient_ids: recipientIds,
        title: group_name ?? 'Group Chat',
        body: `${sender_name ?? 'Someone'}: ${preview}`,
        data: { type: 'chat_message', group_id },
      });
    }

    // ── Direct recipient path (existing callers: group_share, etc.) ───────
    const { recipient_ids, title, body: msgBody, data } = body as {
      recipient_ids: string[];
      title: string;
      body: string;
      data?: Record<string, unknown>;
    };

    if (!recipient_ids?.length || !title || !msgBody) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recipient_ids, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return await deliverPushMessages(adminClient, {
      recipient_ids,
      title,
      body: msgBody,
      data,
    });

  } catch (err) {
    console.error('send-push: internal error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

// ─── Shared delivery helper ────────────────────────────────────────────────

async function deliverPushMessages(
  adminClient: ReturnType<typeof createClient>,
  payload: {
    recipient_ids: string[];
    title: string;
    body: string;
    data?: Record<string, unknown>;
  },
): Promise<Response> {
  const { recipient_ids, title, body, data } = payload;

  // Fetch push tokens for all recipients
  const { data: tokens, error: tokenError } = await adminClient
    .from('push_tokens' as any)
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
  const messages = (tokens as { token: string }[]).map((t) => ({
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
}
