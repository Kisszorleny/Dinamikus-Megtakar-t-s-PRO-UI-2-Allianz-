create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_id text not null,
  owner_role text not null check (owner_role in ('admin', 'user')),
  name text not null,
  source_type text not null check (source_type in ('html', 'text', 'eml')),
  original_file_name text,
  subject text,
  raw_content text not null,
  html_content text not null default '',
  text_content text not null default '',
  conversion_status text not null default 'none' check (conversion_status in ('none', 'pending_review', 'approved', 'rejected')),
  conversion_target_tone text check (conversion_target_tone in ('tegezo')),
  converted_subject text,
  converted_html_content text,
  converted_text_content text,
  conversion_notes text,
  mappings jsonb not null default '[]'::jsonb,
  constraint email_templates_mappings_array check (jsonb_typeof(mappings) = 'array')
);

create index if not exists email_templates_owner_id_idx on public.email_templates (owner_id);
create index if not exists email_templates_updated_at_idx on public.email_templates (updated_at desc);
alter table public.email_templates
  add column if not exists conversion_status text not null default 'none',
  add column if not exists conversion_target_tone text,
  add column if not exists converted_subject text,
  add column if not exists converted_html_content text,
  add column if not exists converted_text_content text,
  add column if not exists conversion_notes text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_templates_conversion_status_check'
  ) then
    alter table public.email_templates
      add constraint email_templates_conversion_status_check
      check (conversion_status in ('none', 'pending_review', 'approved', 'rejected'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_templates_conversion_target_tone_check'
  ) then
    alter table public.email_templates
      add constraint email_templates_conversion_target_tone_check
      check (conversion_target_tone is null or conversion_target_tone in ('tegezo'));
  end if;
end
$$;

create table if not exists public.custom_presets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_id text not null,
  owner_role text not null check (owner_role in ('admin', 'user')),
  name text not null,
  product_scope text,
  entries jsonb not null default '[]'::jsonb,
  constraint custom_presets_entries_array check (jsonb_typeof(entries) = 'array')
);

create index if not exists custom_presets_owner_id_idx on public.custom_presets (owner_id);
create index if not exists custom_presets_product_scope_idx on public.custom_presets (product_scope);
create index if not exists custom_presets_updated_at_idx on public.custom_presets (updated_at desc);
