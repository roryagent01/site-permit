import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { getPlanLimitSnapshot } from '@/lib/limits';

function Meter({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(max, 1)) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span>
          {used} / {max}
        </span>
      </div>
      <div className="h-2 w-full rounded bg-slate-100">
        <div className="h-2 rounded bg-blue-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  if (!ctx) {
    return (
      <AppShell title="Settings">
        <p className="text-sm text-slate-600">No workspace context.</p>
      </AppShell>
    );
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('billing_email,dedicated_hosting,dedicated_region,support_tier')
    .eq('id', ctx.workspaceId)
    .maybeSingle();

  const [members, contractors, permitsMonth] = await Promise.all([
    supabase.from('workspace_members').select('*', { count: 'exact', head: true }).eq('workspace_id', ctx.workspaceId),
    supabase.from('contractors').select('*', { count: 'exact', head: true }).eq('workspace_id', ctx.workspaceId),
    supabase
      .from('permits')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', ctx.workspaceId)
      .gte('created_at', new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString())
  ]);

  const limits = getPlanLimitSnapshot(ctx.workspacePlan);

  return (
    <AppShell title="Workspace Settings & Plan Usage">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Workspace">
          <p className="text-sm">Name: {ctx.workspaceName}</p>
          <p className="text-sm">Plan: {ctx.workspacePlan}</p>
          <p className="text-sm">Support: {workspace?.support_tier ?? 'email'}</p>
          <p className="text-sm">Billing email: {workspace?.billing_email ?? 'not set'}</p>
          <p className="text-sm">Dedicated hosting: {workspace?.dedicated_hosting ? `yes (${workspace?.dedicated_region ?? 'region pending'})` : 'no'}</p>
        </Card>
        <Card title="Usage">
          <div className="space-y-3">
            <Meter label="Users" used={members.count ?? 0} max={limits.users} />
            <Meter label="Contractors" used={contractors.count ?? 0} max={limits.contractors} />
            <Meter label="Permits this month" used={permitsMonth.count ?? 0} max={limits.permitsPerMonth} />
          </div>
          <p className="mt-4 text-xs text-slate-600">Need more capacity? Upgrade via billing endpoint or sales-assisted flow.</p>
        </Card>
      </div>
    </AppShell>
  );
}
