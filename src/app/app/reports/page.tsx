import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';

export default async function ReportsPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const [permits, approvals, expiring, missing] = await Promise.all([
    ctx
      ? (await supabase
          .from('permits')
          .select('status,created_at')
          .eq('workspace_id', ctx.workspaceId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())).data ?? []
      : [],
    ctx
      ? (await supabase
          .from('permit_approvals')
          .select('decided_at')
          .eq('workspace_id', ctx.workspaceId)).data ?? []
      : [],
    ctx
      ? (await supabase
          .from('contractor_qualifications')
          .select('id')
          .eq('workspace_id', ctx.workspaceId)
          .lte('expiry_date', new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10))).data ?? []
      : [],
    ctx
      ? (await supabase
          .from('contractors')
          .select('id, contractor_qualifications(id)')
          .eq('workspace_id', ctx.workspaceId)).data ?? []
      : []
  ]);

  const byStatus = permits.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const missingCount = missing.filter((m) => !(m.contractor_qualifications as unknown[] | null)?.length).length;

  return (
    <AppShell title="Reports">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Permits by status (30d)">
          <ul className="space-y-1 text-sm">
            {Object.entries(byStatus).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span>{v}</span></li>
            ))}
            {Object.keys(byStatus).length === 0 ? <li className="text-slate-500">No permits in period.</li> : null}
          </ul>
        </Card>
        <Card title="Operational metrics">
          <ul className="space-y-2 text-sm">
            <li>Approval records: {approvals.length}</li>
            <li>Qualifications expiring in 30 days: {expiring.length}</li>
            <li>Contractors missing any qualification: {missingCount}</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
