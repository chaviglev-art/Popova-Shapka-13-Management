# Supabase setup — Popova Shapka 13

This folder holds the database schema for making the portal's data live and
shared across everyone, instead of per-browser `localStorage`.

## 1. Create the project

See the main setup steps already covered in chat: create a free project at
[supabase.com](https://supabase.com), region close to Sofia (e.g. Frankfurt).

## 2. Run the schema

Dashboard → **SQL Editor** → New query → paste the contents of
[`schema.sql`](./schema.sql) → **Run**.

Then run [`seed.sql`](./seed.sql) the same way — it creates the 15
apartments, the room, the 7 garages, and the emergency contact so the app
isn't empty on first load.

## 3. Create the admin login

Dashboard → **Authentication** → **Users** → **Add user** (email + password,
"Auto Confirm User" checked). Then in **SQL Editor** run, replacing the UUID
with the new user's id (shown in the Users list) and the email:

```sql
insert into profiles (id, is_admin, display_name)
values ('<paste-the-user-uuid-here>', true, 'Admin')
on conflict (id) do update set is_admin = true;
```

## 4. Create resident logins (repeat per unit)

Same **Add user** step for each resident, then link their account to their
unit:

```sql
insert into profiles (id, unit_id, display_name)
values ('<user-uuid>', 'apt3', 'Owner 3')
on conflict (id) do update set unit_id = excluded.unit_id;
```

(`unit_id` must match one of the `id` values in the `units` table, e.g.
`apt1`…`apt15`, `room1`, `gar1`…`gar7`.)

## 5. Give me the connection details

Project Settings → API →
- **Project URL**
- **anon public** key

Both are safe to hardcode in the public front-end — access is enforced by
the Row Level Security policies in `schema.sql`, not by keeping these
secret. Never share the **service_role** key.

## What's NOT done yet

The front-end (`js/store.js`, `app.js`, `pages.js`) still reads/writes
`localStorage` — this schema is the backend groundwork. Wiring the app to
actually call Supabase (and switching login over to Supabase Auth) is the
next step, once the project exists and its URL/key are available.
