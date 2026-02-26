-- DS-16 expansion core tables

create table if not exists qualification_packs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists qualification_pack_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  pack_id uuid not null references qualification_packs(id) on delete cascade,
  qualification_type_id uuid not null references qualification_types(id) on delete cascade,
  required boolean not null default true,
  unique (pack_id, qualification_type_id)
);

create table if not exists permit_checklist_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  permit_id uuid not null references permits(id) on delete cascade,
  label text not null,
  required boolean not null default true,
  checked boolean not null default false,
  checked_by uuid,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists permit_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  permit_id uuid not null references permits(id) on delete cascade,
  title text not null,
  status text not null default 'open' check (status in ('open','done')),
  due_at timestamptz,
  assignee_user_id uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists template_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  template_id uuid not null references permit_templates(id) on delete cascade,
  version_no int not null,
  name text not null,
  category text not null,
  definition jsonb not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (template_id, version_no)
);

alter table contractor_qualifications
  add column if not exists waived boolean not null default false,
  add column if not exists waiver_reason text,
  add column if not exists waived_until date;

alter table qualification_packs enable row level security;
alter table qualification_pack_items enable row level security;
alter table permit_checklist_items enable row level security;
alter table permit_tasks enable row level security;
alter table template_versions enable row level security;

create policy "workspace members can manage qualification packs"
on qualification_packs for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage qualification pack items"
on qualification_pack_items for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage permit checklist"
on permit_checklist_items for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage permit tasks"
on permit_tasks for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can view template versions"
on template_versions for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));
