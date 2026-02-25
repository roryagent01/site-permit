import { AppShell } from '@/components/app-shell';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/rbac';

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(name, plan)')
    .eq('user_id', user.id);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Signed in as {user.email}</p>
        <div className="rounded-md border border-slate-200 p-3">
          <p className="mb-2 text-sm font-medium text-slate-800">Your workspaces</p>
          <ul className="space-y-1 text-sm text-slate-700">
            {memberships?.map((m) => (
              <li key={`${m.workspace_id}-${m.role}`}>
                {(m.workspaces as { name?: string } | null)?.name ?? 'Workspace'} — role: {m.role}
              </li>
            )) ?? <li>No workspace membership found.</li>}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
