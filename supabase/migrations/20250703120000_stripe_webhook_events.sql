-- Idempotency guard for Stripe webhook delivery retries.
-- Matches app/api/webhooks/stripe/route.ts: insert/select/delete on event_id + session_id.
-- RLS enabled with no public policies — only the service-role (SUPABASE_SECRET_KEY) client can access.

create table if not exists public.stripe_webhook_events (
  event_id     text primary key,
  session_id   text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
