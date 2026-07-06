-- Step 2 (variants): product_variants table + backfill from existing products.
-- Safe to run once. Re-run skips products that already have variants.
-- Does NOT drop products.images or products.stock (cleanup comes later).

create table if not exists public.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color      text not null,
  images     text[] not null default '{}',
  stock      int not null default 0 check (stock >= 0),
  is_default boolean not null default false,
  created_at timestamptz default now(),
  unique (product_id, color)
);

-- At most one default variant per product.
create unique index if not exists product_variants_one_default_per_product
  on public.product_variants (product_id)
  where is_default = true;

-- Backfill: one default variant per existing product (single-variant compatibility).
insert into public.product_variants (product_id, color, images, stock, is_default)
select
  p.id,
  'default',
  coalesce(p.images, '{}'::text[]),
  coalesce(p.stock, 0),
  true
from public.products p
where not exists (
  select 1
  from public.product_variants v
  where v.product_id = p.id
);

alter table public.product_variants enable row level security;

drop policy if exists "Public read product variants" on public.product_variants;

create policy "Public read product variants"
on public.product_variants
for select
to anon, authenticated
using (true);
