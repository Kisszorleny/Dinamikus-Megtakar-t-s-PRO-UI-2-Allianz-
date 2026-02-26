create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'product_code_status') then
    create type public.product_code_status as enum ('confirmed', 'unknown');
  end if;
end
$$;

create table if not exists public.product_catalog (
  id uuid primary key default gen_random_uuid(),
  insurer text not null,
  product_name text not null,
  product_value text not null,
  variant_value text,
  product_type text not null,
  mnb_code text not null,
  product_code text,
  product_code_status public.product_code_status not null default 'unknown',
  source_ref text,
  version integer not null default 1 check (version >= 1),
  is_active boolean not null default true,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,
  metadata jsonb not null default '{}'::jsonb,
  constraint product_catalog_non_empty_mnb check (length(btrim(mnb_code)) > 0),
  constraint product_catalog_non_empty_product_code check (product_code is null or length(btrim(product_code)) > 0),
  constraint product_catalog_confirmed_requires_code check (
    product_code_status <> 'confirmed'::public.product_code_status or product_code is not null
  ),
  constraint product_catalog_validity_window check (valid_to is null or valid_to > valid_from),
  constraint product_catalog_unique_version unique (insurer, product_value, coalesce(variant_value, ''), version)
);

create table if not exists public.product_catalog_audit (
  id uuid primary key default gen_random_uuid(),
  product_catalog_id uuid not null references public.product_catalog(id) on delete cascade,
  action text not null check (action in ('insert', 'update')),
  old_values jsonb,
  new_values jsonb not null,
  changed_at timestamptz not null default now(),
  changed_by text,
  change_reason text
);

create index if not exists product_catalog_insurer_idx on public.product_catalog (insurer);
create index if not exists product_catalog_product_value_idx on public.product_catalog (product_value);
create index if not exists product_catalog_variant_value_idx on public.product_catalog (variant_value);
create index if not exists product_catalog_is_active_idx on public.product_catalog (is_active) where is_active = true;
create index if not exists product_catalog_product_code_status_idx on public.product_catalog (product_code_status);
create index if not exists product_catalog_updated_at_idx on public.product_catalog (updated_at desc);

create index if not exists product_catalog_audit_product_idx on public.product_catalog_audit (product_catalog_id);
create index if not exists product_catalog_audit_changed_at_idx on public.product_catalog_audit (changed_at desc);

create or replace function public.product_catalog_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists product_catalog_set_updated_at_tg on public.product_catalog;
create trigger product_catalog_set_updated_at_tg
before update on public.product_catalog
for each row
execute function public.product_catalog_set_updated_at();

create or replace function public.product_catalog_write_audit()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.product_catalog_audit (product_catalog_id, action, old_values, new_values, changed_by)
    values (new.id, 'insert', null, to_jsonb(new), new.created_by);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    insert into public.product_catalog_audit (product_catalog_id, action, old_values, new_values, changed_by)
    values (new.id, 'update', to_jsonb(old), to_jsonb(new), coalesce(new.updated_by, new.created_by));
    return new;
  end if;

  return null;
end;
$$;

drop trigger if exists product_catalog_write_audit_tg on public.product_catalog;
create trigger product_catalog_write_audit_tg
after insert or update on public.product_catalog
for each row
execute function public.product_catalog_write_audit();
