import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/rbac';
import { Card } from '@/components/ui/card';

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(name, plan)')
    .eq('user_id', user.id);

  const workspaceId = memberships?.[0]?.workspace_id;
  const [permits30d, contractorsCount, firstPermit] = await Promise.all([
    workspaceId
      ? (await supabase
          .from('permits')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())).count ?? 0
      : 0,
    workspaceId
      ? (await supabase.from('contractors').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId)).count ?? 0
      : 0,
    workspaceId
      ? (await supabase
          .from('permits')
          .select('created_at')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()).data
      : null
  ]);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Signed in as {user.email}</p>

        <div className="mb-3">
          <Link href="/app/dashboard/sites" className="rounded-md border px-3 py-2 text-xs font-medium">Open site dashboards</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Permits (30d)">
            <p className="text-2xl font-semibold text-blue-900">{permits30d}</p>
          </Card>
          <Card title="Contractors tracked">
            <p className="text-2xl font-semibold text-blue-900">{contractorsCount}</p>
          </Card>
          <Card title="Activation metric">
            <p className="text-sm text-slate-700">
              {firstPermit?.created_at
                ? `First permit created: ${new Date(firstPermit.created_at).toLocaleString()}`
                : 'No permit yet. Target: first permit within 30 minutes.'}
            </p>
            {!firstPermit?.created_at ? (
              <Link href="/app/permits/new" className="mt-3 inline-block rounded-md bg-blue-700 px-3 py-2 text-xs font-medium text-white">
                Create first permit
              </Link>
            ) : null}
          </Card>
        </div>

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
