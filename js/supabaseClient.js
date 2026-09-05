/* ============================================================
   Supabase connection — shared live backend
   ============================================================ */
const SUPABASE_URL = 'https://pnszxtcphifqprrpmbiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TnGPjlvIUOyRqCwfzleVBg_-kRIL5qH';
// Safe to keep public: access is enforced by Row Level Security policies
// (see supabase/schema.sql), not by keeping this key secret.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});
