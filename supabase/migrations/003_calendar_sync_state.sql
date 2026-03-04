create table if not exists public.sync_state (
  state_key text primary key,
  value_text text,
  updated_at timestamptz not null default now()
);
