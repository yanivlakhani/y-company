-- Add ordered images array to products; backfill from thumb_url + lookbook_url.
-- Safe to run once. Does NOT drop thumb_url or lookbook_url (cleanup comes later).

alter table public.products
  add column if not exists images text[] not null default '{}';

update public.products
set images = array_remove(array[thumb_url, lookbook_url], null)
where images = '{}'
  and (thumb_url is not null or lookbook_url is not null);
