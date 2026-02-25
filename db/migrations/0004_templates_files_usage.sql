-- DS-3.A / DS-5.C / DS-6 additions

create table if not exists permit_template_steps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  template_id uuid not null references permit_templates(id) on delete cascade,
  step_order int not null,
  role text not null check (role in ('owner','admin','approver','issuer','viewer')),
  required boolean not null default true,
  created_at timestamptz not null default now(),
  unique (template_id, step_order)
);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  permit_id uuid references permits(id) on delete set null,
  contractor_qualification_id uuid references contractor_qualifications(id) on delete set null,
  bucket text not null,
  path text not null,
  size_bytes bigint,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists usage_counters (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  period_month text not null,
  permits_created int not null default 0,
  storage_used_bytes bigint not null default 0,
  contractor_count int not null default 0,
  member_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, period_month)
);

alter table permit_template_steps enable row level security;
alter table files enable row level security;
alter table usage_counters enable row level security;

create policy "workspace members can manage permit template steps"
on permit_template_steps for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage files"
on files for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can view usage counters"
on usage_counters for select
using (is_workspace_member(workspace_id));
