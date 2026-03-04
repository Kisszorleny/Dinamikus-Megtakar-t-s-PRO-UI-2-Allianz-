alter table public.lead_submissions
  add column if not exists calendar_field_updated_at jsonb not null default '{}'::jsonb;
