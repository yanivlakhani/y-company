-- Drop legacy single-image columns; all reads/writes use products.images.
-- Prerequisite: 20250704150000_products_add_images.sql applied and re-ingest confirmed.

alter table public.products
  drop column if exists thumb_url,
  drop column if exists lookbook_url;
