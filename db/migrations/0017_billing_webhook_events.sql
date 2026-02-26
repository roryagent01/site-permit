create table if not exists billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  customer_id text,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);
