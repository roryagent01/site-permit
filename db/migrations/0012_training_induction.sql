-- DS-19 training + induction flows

create table if not exists training_modules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  summary text,
  content_url text,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists contractor_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  name text,
  email text not null,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  unique (workspace_id, contractor_id, email)
);

create table if not exists training_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  contractor_contact_id uuid references contractor_contacts(id) on delete set null,
  module_id uuid not null references training_modules(id) on delete cascade,
  recipient_email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  sent_at timestamptz,
  completed_at timestamptz,
  completion_payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists contractor_training_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  contractor_contact_id uuid references contractor_contacts(id) on delete set null,
  module_id uuid not null references training_modules(id) on delete cascade,
  invite_id uuid references training_invites(id) on delete set null,
  recipient_email text not null,
  completed_at timestamptz not null,
  unique (workspace_id, module_id, recipient_email)
);

alter table training_modules enable row level security;
alter table contractor_contacts enable row level security;
alter table training_invites enable row level security;
alter table contractor_training_records enable row level security;

create policy "workspace members can manage training modules"
on training_modules for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage contractor contacts"
on contractor_contacts for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage training invites"
on training_invites for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can view training records"
on contractor_training_records for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create index if not exists idx_training_invites_workspace_contractor on training_invites (workspace_id, contractor_id, created_at desc);
create index if not exists idx_training_records_workspace_contractor on contractor_training_records (workspace_id, contractor_id, completed_at desc);
