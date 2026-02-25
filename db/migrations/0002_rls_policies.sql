-- DS-6.B RLS tenant isolation baseline

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table sites enable row level security;
alter table permit_templates enable row level security;
alter table permits enable row level security;
alter table permit_approvals enable row level security;
alter table contractors enable row level security;
alter table qualification_types enable row level security;
alter table contractor_qualifications enable row level security;
alter table reminder_settings enable row level security;
alter table reminder_deliveries enable row level security;
alter table audit_events enable row level security;

create or replace function is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = auth.uid()
  );
$$;

-- Example policy pattern (repeatable baseline)
create policy "workspace members can view workspaces"
on workspaces for select
using (is_workspace_member(id));

create policy "workspace members can view workspace_members"
on workspace_members for select
using (is_workspace_member(workspace_id));

create policy "workspace members can manage permits"
on permits for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage contractors"
on contractors for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage qualification types"
on qualification_types for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage contractor qualifications"
on contractor_qualifications for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can view audit events"
on audit_events for select
using (is_workspace_member(workspace_id));
