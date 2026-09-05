-- ============================================================
-- Popova Shapka 13 — Supabase schema
-- Paste this whole file into Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS guards.
-- ============================================================

-- ---------- profiles: links a Supabase Auth user to a unit or to admin ----------
-- Every login (admin or resident) is a real Supabase Auth user (email + password).
-- profiles.is_admin = true  -> full access to everything
-- profiles.unit_id  = 'apt3' -> a resident, scoped to that unit's private data
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  unit_id text,
  is_admin boolean not null default false,
  display_name text,
  created_at timestamptz not null default now()
);

-- ---------- building: single settings row (id fixed to 1) ----------
create table if not exists building (
  id int primary key default 1,
  name text default '',
  address text default '',
  manager_name text default '',
  manager_phone text default '',
  manager_email text default '',
  currency text default 'EUR',
  show_dual boolean default true,
  default_fee numeric default 40,
  iban text default '',
  bank text default '',
  beneficiary text default '',
  opening_balance numeric default 0,
  fees_since text default '',
  banner text default '',
  constraint building_singleton check (id = 1)
);
insert into building (id) values (1) on conflict (id) do nothing;

-- ---------- units ----------
create table if not exists units (
  id text primary key,
  num text not null,
  type text not null default 'apartment',      -- apartment | room | garage
  floor int,
  size numeric,
  owner text default '',
  tenant text default '',
  phone text default '',
  email text default '',
  share_phone boolean default false,
  fee numeric default 0,
  fee_since text default ''
);

-- ---------- payments ----------
create table if not exists payments (
  id text primary key,
  unit_id text not null references units(id) on delete cascade,
  amount numeric not null,
  period text not null,        -- 'YYYY-MM'
  date date,
  note text default '',
  method text default 'bank',  -- cash | bank
  created_at timestamptz not null default now()
);

-- ---------- expenses ----------
create table if not exists expenses (
  id text primary key,
  date date not null,
  amount numeric not null,
  category text default 'other',
  note text default '',
  vendor text default '',
  url text default ''
);

-- ---------- news ----------
create table if not exists news (
  id text primary key,
  title text not null,
  body text default '',
  date date default current_date,
  pinned boolean default false,
  banner boolean default false
);

-- ---------- works (building projects) ----------
create table if not exists works (
  id text primary key,
  title text not null,
  desc text default '',
  status text default 'planned',  -- planned | in_progress | done
  progress int default 0,
  start_date date,
  end_date date
);

-- ---------- events ----------
create table if not exists events (
  id text primary key,
  title text not null,
  desc text default '',
  date date not null,
  time text default '',
  type text default 'other',
  location text default ''
);

-- ---------- requests (resident tickets) ----------
create table if not exists requests (
  id text primary key,
  unit_id text not null references units(id) on delete cascade,
  category text default 'other',
  priority text default 'normal',
  subject text not null,
  body text default '',
  date date default current_date,
  status text default 'new',   -- new | in_progress | resolved | closed
  photo text default '',
  internal_note text default ''
);

create table if not exists request_comments (
  id bigint generated always as identity primary key,
  request_id text not null references requests(id) on delete cascade,
  by text not null,
  date timestamptz not null default now(),
  text text not null
);

-- ---------- documents ----------
create table if not exists documents (
  id text primary key,
  name text not null,
  category text default 'other',
  url text default '',
  note text default '',
  date date default current_date
);

-- ---------- votes + ballots ----------
create table if not exists votes (
  id text primary key,
  title text not null,
  options jsonb not null default '[]',
  deadline date,
  quorum int default 50,
  closed boolean default false,
  created date default current_date
);
create table if not exists ballots (
  vote_id text not null references votes(id) on delete cascade,
  unit_id text not null references units(id) on delete cascade,
  choice text not null,
  primary key (vote_id, unit_id)
);

-- ---------- contacts ----------
create table if not exists contacts (
  id text primary key,
  role text default 'other',
  name text not null,
  phone text default '',
  note text default ''
);

-- ---------- audit log ----------
create table if not exists audit (
  id bigint generated always as identity primary key,
  date timestamptz not null default now(),
  by text default 'system',
  action text not null,
  detail text default ''
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table building enable row level security;
alter table units enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table news enable row level security;
alter table works enable row level security;
alter table events enable row level security;
alter table requests enable row level security;
alter table request_comments enable row level security;
alter table documents enable row level security;
alter table votes enable row level security;
alter table ballots enable row level security;
alter table contacts enable row level security;
alter table audit enable row level security;

-- helper: is the current user an admin?
create or replace function is_admin() returns boolean
language sql security definer stable as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- helper: unit_id of the current user (null for admin / no profile)
create or replace function my_unit() returns text
language sql security definer stable as $$
  select unit_id from profiles where id = auth.uid();
$$;

-- profiles: everyone can read their own row; admin can read/write all
drop policy if exists profiles_self on profiles;
create policy profiles_self on profiles for select using (id = auth.uid() or is_admin());
drop policy if exists profiles_admin_write on profiles;
create policy profiles_admin_write on profiles for all using (is_admin()) with check (is_admin());

-- building: any logged-in user can read; only admin can write
drop policy if exists building_read on building;
create policy building_read on building for select using (auth.uid() is not null);
drop policy if exists building_write on building;
create policy building_write on building for all using (is_admin()) with check (is_admin());

-- units: admin sees/edits all; a resident sees only their own unit row
drop policy if exists units_read on units;
create policy units_read on units for select using (is_admin() or id = my_unit());
drop policy if exists units_write on units;
create policy units_write on units for all using (is_admin()) with check (is_admin());

-- payments: admin all; resident can read only their own unit's payments
drop policy if exists payments_read on payments;
create policy payments_read on payments for select using (is_admin() or unit_id = my_unit());
drop policy if exists payments_write on payments;
create policy payments_write on payments for all using (is_admin()) with check (is_admin());

-- expenses: everyone logged in can read (transparency); only admin writes
drop policy if exists expenses_read on expenses;
create policy expenses_read on expenses for select using (auth.uid() is not null);
drop policy if exists expenses_write on expenses;
create policy expenses_write on expenses for all using (is_admin()) with check (is_admin());

-- news / works / events / documents / contacts: public to logged-in users, admin-only write
drop policy if exists news_read on news;
create policy news_read on news for select using (auth.uid() is not null);
drop policy if exists news_write on news;
create policy news_write on news for all using (is_admin()) with check (is_admin());

drop policy if exists works_read on works;
create policy works_read on works for select using (auth.uid() is not null);
drop policy if exists works_write on works;
create policy works_write on works for all using (is_admin()) with check (is_admin());

drop policy if exists events_read on events;
create policy events_read on events for select using (auth.uid() is not null);
drop policy if exists events_write on events;
create policy events_write on events for all using (is_admin()) with check (is_admin());

drop policy if exists documents_read on documents;
create policy documents_read on documents for select using (auth.uid() is not null);
drop policy if exists documents_write on documents;
create policy documents_write on documents for all using (is_admin()) with check (is_admin());

drop policy if exists contacts_read on contacts;
create policy contacts_read on contacts for select using (auth.uid() is not null);
drop policy if exists contacts_write on contacts;
create policy contacts_write on contacts for all using (is_admin()) with check (is_admin());

-- requests: admin all; resident can read/insert their own unit's requests
drop policy if exists requests_read on requests;
create policy requests_read on requests for select using (is_admin() or unit_id = my_unit());
drop policy if exists requests_insert on requests;
create policy requests_insert on requests for insert with check (is_admin() or unit_id = my_unit());
drop policy if exists requests_write on requests;
create policy requests_write on requests for update using (is_admin()) with check (is_admin());
drop policy if exists requests_delete on requests;
create policy requests_delete on requests for delete using (is_admin());

-- request_comments: visible/insertable if you can see the parent request
drop policy if exists request_comments_read on request_comments;
create policy request_comments_read on request_comments for select using (
  is_admin() or exists (select 1 from requests r where r.id = request_id and r.unit_id = my_unit())
);
drop policy if exists request_comments_insert on request_comments;
create policy request_comments_insert on request_comments for insert with check (
  is_admin() or exists (select 1 from requests r where r.id = request_id and r.unit_id = my_unit())
);

-- votes: everyone logged in can read; only admin writes
drop policy if exists votes_read on votes;
create policy votes_read on votes for select using (auth.uid() is not null);
drop policy if exists votes_write on votes;
create policy votes_write on votes for all using (is_admin()) with check (is_admin());

-- ballots: everyone logged in can read (needed for tallies); a resident can only cast their own unit's ballot
drop policy if exists ballots_read on ballots;
create policy ballots_read on ballots for select using (auth.uid() is not null);
drop policy if exists ballots_upsert on ballots;
create policy ballots_upsert on ballots for insert with check (is_admin() or unit_id = my_unit());
drop policy if exists ballots_update on ballots;
create policy ballots_update on ballots for update using (is_admin() or unit_id = my_unit()) with check (is_admin() or unit_id = my_unit());

-- audit: admin only
drop policy if exists audit_admin on audit;
create policy audit_admin on audit for all using (is_admin()) with check (is_admin());

-- ============================================================
-- Realtime: broadcast row changes to all connected clients
-- ============================================================
alter publication supabase_realtime add table
  building, units, payments, expenses, news, works, events,
  requests, request_comments, documents, votes, ballots, contacts;
