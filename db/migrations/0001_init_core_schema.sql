-- DS-6 core schema + DS-2 tenant model baseline

create extension if not exists pgcrypto;

create type permit_status as enum (
  'draft',
  'submitted',
  'needs_changes',
  'approved',
  'active',
  'closed',
  'cancelled',
  'expired'
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'starter',
  created_at timestamptz not null default now()
);

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner','admin','approver','issuer','viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists permit_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  name text not null,
  category text not null,
  definition jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists permits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  template_id uuid references permit_templates(id) on delete set null,
  status permit_status not null default 'draft',
  title text not null,
  start_at timestamptz,
  end_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  permit_id uuid not null references permits(id) on delete cascade,
  approver_user_id uuid not null,
  decision text not null check (decision in ('approved','rejected','changes')),
  comment text,
  decided_at timestamptz not null default now()
);

create table if not exists contractors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  name text not null,
  contact_email text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table if not exists qualification_types (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  validity_months int,
  evidence_required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists contractor_qualifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  qualification_type_id uuid not null references qualification_types(id) on delete cascade,
  issue_date date,
  expiry_date date,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified')),
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists reminder_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references workspaces(id) on delete cascade,
  windows_days int[] not null default '{30,14,7}',
  digest_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  delivery_key text not null,
  recipient text not null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  unique (workspace_id, delivery_key, recipient)
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  actor_user_id uuid,
  action text not null,
  object_type text not null,
  object_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_permits_workspace_status on permits (workspace_id, status, created_at desc);
create index if not exists idx_quals_workspace_expiry on contractor_qualifications (workspace_id, expiry_date);
create index if not exists idx_contractors_workspace on contractors (workspace_id, created_at desc);
