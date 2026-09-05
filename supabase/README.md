# Supabase setup — Popova Shapka 13

The portal's data is live in Supabase (shared across everyone, with realtime
sync) instead of per-browser `localStorage`. This file covers what's already
been done and the one remaining piece: deploying the `manage-login` function
that powers the in-app "create/reset/remove login" buttons.

## Already done

- `schema.sql` — tables + Row Level Security, run in the SQL Editor
- `seed.sql` — starting units (15 apartments, room, 7 garages) + emergency contact
- Admin login created (Authentication → Users) and linked via `profiles`
- The app is wired up with the project's URL + publishable key

If you ever spin up a fresh project, redo those in order (`schema.sql` then
`seed.sql`, both idempotent — safe to re-run), then create the admin login:

```sql
insert into profiles (id, is_admin, display_name)
values ('<paste-the-user-uuid-here>', true, 'Admin')
on conflict (id) do update set is_admin = true;
```

## Deploy the `manage-login` Edge Function

This is what lets you create, reset, or remove a resident's login **from
inside the app** (Units → open a unit → Access), instead of doing it by hand
in the dashboard. It has to run as a Supabase Edge Function rather than
being called directly from the browser, because creating/deleting a login
requires the `service_role` key — a key that must never reach client-side
code (it bypasses every Row Level Security rule in `schema.sql`). The
function holds that key safely on Supabase's side and only acts after
checking the caller is really an admin.

**Via the dashboard (no command line needed):**
1. Supabase dashboard → **Edge Functions** (left sidebar)
2. **Deploy a new function** → name it exactly `manage-login`
3. Paste in the contents of [`functions/manage-login/index.ts`](./functions/manage-login/index.ts)
4. Deploy

That's it — `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to
every Edge Function automatically, nothing else to configure.

**Via the CLI**, if you'd rather (needs the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and logged in):
```
supabase link --project-ref pnszxtcphifqprrpmbiy
supabase functions deploy manage-login
```

Once deployed, admin → Units → open any unit → **Access** section → **Create
login** works end to end from the app — with "Send an email invite" checked
(the default), it emails the resident a link to set their own password;
unchecked, it falls back to the old "set a password yourself" flow.

## Making the invite email actually arrive

Two things to configure in the Supabase dashboard, both one-time, under
**Authentication**:

1. **URL Configuration → Site URL**: set this to your live site,
   `https://chaviglev-art.github.io/Popova-Shapka-13-Management/` — this is
   the link the invite email points residents to. Also add it under
   **Redirect URLs** on the same page.
2. **Email sending**: Supabase's built-in email sender works for a handful of
   emails but is explicitly meant only for testing — it's rate-limited and
   not guaranteed to arrive for real use. For actual residents to reliably
   get their invite, add your own SMTP under **Authentication → Emails →
   SMTP Settings**. Free options with a generous enough allowance for a
   ~23-unit building: [Resend](https://resend.com) (100/day free) or
   [Brevo](https://www.brevo.com) (300/day free) both work in a few minutes —
   sign up, verify a sender address, paste their SMTP host/port/user/pass in.
   Gmail SMTP also works for this volume if you'd rather use the address
   already on this account.

Optional polish: **Authentication → Email Templates → Invite user** lets you
customize the subject/body residents see (uses `{{ .ConfirmationURL }}` for
the link).

## Creating a login by hand (fallback, or for the admin account itself)

Dashboard → **Authentication** → **Users** → **Add user** (email + password,
"Auto Confirm User" checked), then link it to a unit:

```sql
insert into profiles (id, unit_id, display_name)
values ('<user-uuid>', 'apt3', 'Owner 3')
on conflict (id) do update set unit_id = excluded.unit_id;
```

(`unit_id` must match one of the `id` values in the `units` table, e.g.
`apt1`…`apt15`, `room1`, `gar1`…`gar7`.)

## Connection details

Project Settings → API → **Project URL** and **anon public** (now called
**publishable**) key — both are safe to hardcode in the public front-end;
access is enforced by the RLS policies in `schema.sql`, not by keeping these
secret. **Never** put the **service_role** key in the front-end — it only
ever belongs in an Edge Function's environment, where Supabase manages it
for you.
