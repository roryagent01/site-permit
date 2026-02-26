-- DS-18 workforce onboarding invites

create table if not exists employee_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner','admin','approver','issuer','viewer')),
  token text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  accepted_at timestamptz,
  accepted_user_id uuid,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists contractor_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  token text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  accepted_at timestamptz,
  contractor_id uuid references contractors(id) on delete set null,
  created_by uuid,
  created_at timestamptz not null default now()
);

alter table employee_invites enable row level security;
alter table contractor_invites enable row level security;

create policy "workspace members can manage employee invites"
on employee_invites for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage contractor invites"
on contractor_invites for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create index if not exists idx_employee_invites_workspace_created on employee_invites (workspace_id, created_at desc);
create index if not exists idx_contractor_invites_workspace_created on contractor_invites (workspace_id, created_at desc);
