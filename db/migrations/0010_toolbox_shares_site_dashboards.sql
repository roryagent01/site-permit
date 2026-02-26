-- DS-16.F / DS-16.I / DS-16.K

create table if not exists permit_briefings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  permit_id uuid not null references permits(id) on delete cascade,
  title text not null,
  notes text,
  held_at timestamptz not null default now(),
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists permit_briefing_attendees (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  briefing_id uuid not null references permit_briefings(id) on delete cascade,
  attendee_name text not null,
  acknowledged boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists permit_share_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  permit_id uuid not null references permits(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists permit_share_access_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  share_link_id uuid not null references permit_share_links(id) on delete cascade,
  accessed_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

alter table permit_briefings enable row level security;
alter table permit_briefing_attendees enable row level security;
alter table permit_share_links enable row level security;
alter table permit_share_access_logs enable row level security;

create policy "workspace members can manage permit briefings"
on permit_briefings for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage briefing attendees"
on permit_briefing_attendees for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage share links"
on permit_share_links for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can view share logs"
on permit_share_access_logs for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create index if not exists idx_share_links_permit_expires on permit_share_links (permit_id, expires_at);
create index if not exists idx_share_logs_link_accessed on permit_share_access_logs (share_link_id, accessed_at desc);
