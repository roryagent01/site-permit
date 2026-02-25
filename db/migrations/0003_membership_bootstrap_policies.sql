-- DS-2 + DS-6: allow first-workspace bootstrap and owner/admin member management

create or replace function has_workspace_role(target_workspace uuid, allowed_roles text[])
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = auth.uid()
      and wm.role = any(allowed_roles)
  );
$$;

create policy "authenticated users can create workspaces"
on workspaces for insert
with check (auth.uid() is not null);

create policy "owner_admin can update workspaces"
on workspaces for update
using (has_workspace_role(id, array['owner','admin']))
with check (has_workspace_role(id, array['owner','admin']));

create policy "self bootstrap or owner_admin can add memberships"
on workspace_members for insert
with check (
  (
    user_id = auth.uid()
    and auth.uid() is not null
    and not exists (
      select 1 from workspace_members existing where existing.workspace_id = workspace_id
    )
  )
  or has_workspace_role(workspace_id, array['owner','admin'])
);

create policy "owner_admin can update memberships"
on workspace_members for update
using (has_workspace_role(workspace_id, array['owner','admin']))
with check (has_workspace_role(workspace_id, array['owner','admin']));

create policy "owner_admin can delete memberships"
on workspace_members for delete
using (has_workspace_role(workspace_id, array['owner','admin']));
