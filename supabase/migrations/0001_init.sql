-- Jade Book Nest Reading Challenge 2026
-- Applied by the app on startup when DATABASE_URL is set, and safe to run
-- again in the Supabase SQL editor.

create table if not exists users (
  id uuid primary key,
  name text not null,
  password_hash text not null,
  age integer,
  role text not null default 'reader' check (role in ('reader', 'organizer')),
  pair_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists pairs (
  id uuid primary key,
  created_by uuid not null references users (id),
  pending_partner_name text,
  created_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key,
  pair_id uuid not null references pairs (id) on delete cascade,
  author_id uuid not null references users (id),
  reader_name text not null,
  kind text not null check (kind in ('currently_reading', 'kickoff', 'finished', 'best')),
  title text not null,
  body text not null default '',
  borrowed_from_jbn boolean not null default false,
  created_at timestamptz not null
);

create table if not exists adjustments (
  id uuid primary key,
  pair_id uuid not null references pairs (id) on delete cascade,
  points integer not null,
  note text not null,
  created_by uuid references users (id),
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id text primary key,
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null
);

create unique index if not exists users_name_lower_idx on users (lower(name));
create index if not exists entries_pair_created_idx on entries (pair_id, created_at);
create index if not exists adjustments_pair_idx on adjustments (pair_id, created_at);
create index if not exists sessions_user_idx on sessions (user_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_pair_id_fkey'
  ) then
    alter table users
      add constraint users_pair_id_fkey
      foreign key (pair_id) references pairs (id);
  end if;
end $$;
