-- DS-16.C contractor portal scoped invite links

create table if not exists contractor_portal_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

alter table contractor_portal_invites enable row level security;

create policy "workspace members can manage contractor portal invites"
on contractor_portal_invites for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create index if not exists idx_contractor_portal_invites_workspace_created
  on contractor_portal_invites (workspace_id, created_at desc);
