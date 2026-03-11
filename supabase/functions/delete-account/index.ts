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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Verify the calling user
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Service role client for admin operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { action } = await req.json();

    if (action === 'schedule') {
      const deletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ deletion_scheduled_at: deletionDate.toISOString() })
        .eq('id', user.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to schedule deletion' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({ deletion_date: deletionDate.toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'cancel') {
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ deletion_scheduled_at: null })
        .eq('id', user.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to cancel deletion' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({ cancelled: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'execute') {
      // Clean up avatar from storage before deleting user
      await adminClient.storage
        .from('avatars')
        .remove([`${user.id}/avatar.jpg`]);

      // Delete auth user (CASCADE handles all data tables)
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: 'Failed to delete account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({ deleted: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: schedule, cancel, or execute' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
