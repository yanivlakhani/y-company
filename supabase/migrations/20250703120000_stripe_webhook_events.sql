-- Idempotency guard for Stripe webhook delivery retries.
create table if not exists public.stripe_webhook_events (
  event_id   text primary key,
  session_id text not null,
  processed_at timestamptz default now()
);

alter table public.stripe_webhook_events enable row level security;

create policy "Service role manage stripe webhook events"
on public.stripe_webhook_events
for all
to service_role
using (true)
with check (true);
