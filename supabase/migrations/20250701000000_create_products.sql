-- Step 7: products table (exact schema per 020-data-and-ingest) + public "products" bucket.
-- Run once manually in Supabase Dashboard → SQL Editor.

create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  gender         text not null check (gender in ('men','women')),
  accessory_type text not null,
  folder_index   int  not null,
  slug           text unique,
  name           text not null,
  material       text,
  properties     text[] not null default '{}',
  description    text,
  price_fils     int  not null check (price_fils >= 0),
  stock          int  not null default 0 check (stock >= 0),
  thumb_url      text,
  lookbook_url   text,
  created_at     timestamptz default now(),
  unique (gender, accessory_type, folder_index)
);

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

create policy "Public read product images"
on storage.objects
for select
to public
using (bucket_id = 'products');

alter table public.products enable row level security;

create policy "Public read products"
on public.products
for select
to anon, authenticated
using (true);
