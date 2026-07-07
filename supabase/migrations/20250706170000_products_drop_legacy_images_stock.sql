-- Drop legacy products.images and products.stock; all live in product_variants.
-- Prerequisite: product_variants backfill applied, ingest/UI/checkout/admin migrated to variants.

alter table public.products
  drop column if exists images,
  drop column if exists stock;
