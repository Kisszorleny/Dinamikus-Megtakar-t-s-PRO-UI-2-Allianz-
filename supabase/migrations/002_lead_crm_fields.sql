alter table public.lead_submissions
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists source_type text not null default 'landing_form',
  add column if not exists birth_date date,
  add column if not exists age_text text,
  add column if not exists call_time text,
  add column if not exists note text,
  add column if not exists subject text,
  add column if not exists cost_flag boolean default false,
  add column if not exists tax20_flag boolean default false,
  add column if not exists net_flag boolean default false,
  add column if not exists savings_amount_text text,
  add column if not exists goal_text text,
  add column if not exists duration_text text,
  add column if not exists deadline_date date,
  add column if not exists deadline_reason text,
  add column if not exists owner text,
  add column if not exists paid_flag boolean default false,
  add column if not exists lead_type_text text,
  add column if not exists client_number text,
  add column if not exists calendar_link text,
  add column if not exists help_needed text,
  add column if not exists leads_per_day integer,
  add column if not exists day_text text,
  add column if not exists time_text text,
  add column if not exists followup_note text,
  add column if not exists report_text text,
  add column if not exists revisit_text text,
  add column if not exists sheet_row_id text,
  add column if not exists last_synced_at timestamptz,
  add column if not exists calendar_google_event_id text,
  add column if not exists calendar_icloud_event_id text;

create index if not exists lead_submissions_source_type_idx on public.lead_submissions (source_type);
create index if not exists lead_submissions_deadline_date_idx on public.lead_submissions (deadline_date);
create index if not exists lead_submissions_sheet_row_id_idx on public.lead_submissions (sheet_row_id);

create or replace function public.set_lead_submissions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_lead_submissions_updated_at on public.lead_submissions;
create trigger trg_lead_submissions_updated_at
before update on public.lead_submissions
for each row execute function public.set_lead_submissions_updated_at();
