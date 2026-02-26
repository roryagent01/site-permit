-- DS-15 ops/reliability/data lifecycle helpers

create table if not exists notification_failures (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete set null,
  channel text not null default 'email',
  event_type text not null,
  recipient text,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists workspace_retention_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references workspaces(id) on delete cascade,
  retention_days int not null default 365,
  archive_before_delete boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspace_offboarding_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  mode text not null check (mode in ('archive','hard_delete')),
  status text not null default 'queued' check (status in ('queued','completed','failed')),
  summary jsonb not null default '{}'::jsonb,
  requested_by uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table notification_failures enable row level security;
alter table workspace_retention_settings enable row level security;
alter table workspace_offboarding_jobs enable row level security;

create policy "workspace members can view notification failures"
on notification_failures for all
using (workspace_id is null or is_workspace_member(workspace_id))
with check (workspace_id is null or is_workspace_member(workspace_id));

create policy "workspace members can manage retention settings"
on workspace_retention_settings for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage offboarding jobs"
on workspace_offboarding_jobs for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));
