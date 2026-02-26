-- DS-22.C/D/E/F baseline structures

alter table workspaces
  add column if not exists locale text not null default 'en-IE',
  add column if not exists date_format text not null default 'DD/MM/YYYY',
  add column if not exists stripe_price_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists billing_status text not null default 'none';

create table if not exists file_scan_results (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  file_id uuid not null references files(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','clean','quarantined','failed')),
  engine text not null default 'baseline-rules',
  reason text,
  scanned_at timestamptz,
  created_at timestamptz not null default now(),
  unique (file_id)
);

alter table file_scan_results enable row level security;
create policy "workspace members can view scan results"
on file_scan_results for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));
