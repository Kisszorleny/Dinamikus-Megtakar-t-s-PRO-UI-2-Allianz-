create table if not exists public.email_template_variant_bundles (
  template_id uuid primary key references public.email_templates(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_id text not null,
  owner_role text not null check (owner_role in ('admin', 'user')),
  variants jsonb not null default '[]'::jsonb,
  constraint email_template_variant_bundles_variants_array check (jsonb_typeof(variants) = 'array')
);

create index if not exists email_template_variant_bundles_owner_id_idx
  on public.email_template_variant_bundles (owner_id);

create index if not exists email_template_variant_bundles_updated_at_idx
  on public.email_template_variant_bundles (updated_at desc);
