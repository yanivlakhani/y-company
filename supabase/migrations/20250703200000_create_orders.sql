-- Order records written by the Stripe webhook (service-role only).
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  stripe_session_id  text unique not null,
  email              text,
  shipping_address   jsonb,
  items              jsonb not null,
  amount_total_fils  int not null,
  currency           text not null,
  status             text not null default 'unfulfilled',
  created_at         timestamptz not null default now()
);

alter table public.orders enable row level security;
