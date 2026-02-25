-- DS-5 packaging / dedicated hosting metadata

alter table workspaces
  add column if not exists billing_email text,
  add column if not exists dedicated_hosting boolean not null default false,
  add column if not exists dedicated_region text,
  add column if not exists stripe_customer_id text,
  add column if not exists support_tier text not null default 'email' check (support_tier in ('email','priority'));
