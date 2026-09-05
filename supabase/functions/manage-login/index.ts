// Edge Function: manage-login
//
// The only place resident/admin *logins* (Supabase Auth users) get created,
// password-reset, or removed. It runs on Supabase's servers, not in the
// browser, specifically so it can hold the service_role key — that key can
// create/delete any user and bypasses every Row Level Security policy, so it
// must never reach client-side code. This function is the one narrow,
// admin-checked door to that power.
//
// Deploy via the Supabase dashboard (Edge Functions → Deploy a new function,
// paste this file in) — see supabase/README.md for the exact steps.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically to
// every Edge Function; nothing to configure.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Who is calling? Verify their own JWT (passed through by supabase-js's
    // functions.invoke as the Authorization header) before trusting anything.
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer /i, '');
    if (!token) return json({ error: 'Not authenticated' }, 401);
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) return json({ error: 'Not authenticated' }, 401);

    const { data: callerProfile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!callerProfile || !callerProfile.is_admin) return json({ error: 'Admin only' }, 403);

    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      const { unitId, email, password, displayName } = body;
      if (!unitId || !email || !password) return json({ error: 'Missing fields' }, 400);
      if (password.length < 6) return json({ error: 'Password too short' }, 400);
      const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (createErr) return json({ error: createErr.message }, 400);
      const { error: profErr } = await admin.from('profiles').upsert({ id: created.user.id, unit_id: unitId, is_admin: false, display_name: displayName || null });
      if (profErr) { await admin.auth.admin.deleteUser(created.user.id); return json({ error: profErr.message }, 400); }
      return json({ userId: created.user.id });
    }

    if (action === 'reset_password') {
      const { userId, password } = body;
      if (!userId || !password) return json({ error: 'Missing fields' }, 400);
      if (password.length < 6) return json({ error: 'Password too short' }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === 'remove') {
      const { userId } = body;
      if (!userId) return json({ error: 'Missing fields' }, 400);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 500);
  }
});
