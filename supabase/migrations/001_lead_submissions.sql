create extension if not exists pgcrypto;

create table if not exists public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null default 'landing_popup',
  request_type text not null check (request_type in ('A', 'B', 'C')),
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  form_payload jsonb not null default '{}'::jsonb,
  calc_snapshot jsonb not null default '{}'::jsonb,
  calc_summary jsonb not null default '{}'::jsonb,
  email_status text not null default 'queued' check (email_status in ('queued', 'sent', 'failed')),
  email_error text
);

create index if not exists lead_submissions_created_at_idx on public.lead_submissions (created_at desc);
create index if not exists lead_submissions_request_type_idx on public.lead_submissions (request_type);
create index if not exists lead_submissions_contact_email_idx on public.lead_submissions (contact_email);
