import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default async function ReportsPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const [permits, approvals, expiring, missing] = await Promise.all([
    ctx
      ? (await supabase
          .from('permits')
          .select('id,status,created_at')
          .eq('workspace_id', ctx.workspaceId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())).data ?? []
      : [],
    ctx
      ? (await supabase
          .from('permit_approvals')
          .select('permit_id,decided_at')
          .eq('workspace_id', ctx.workspaceId)).data ?? []
      : [],
    ctx
      ? (await supabase
          .from('contractor_qualifications')
          .select('id,expiry_date,qualification_types(name)')
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

  const permitCreatedMap = new Map(permits.map((p) => [p.id, new Date(p.created_at).getTime()]));
  const approvalDurationsHours = approvals
    .map((a) => {
      const created = permitCreatedMap.get(a.permit_id);
      if (!created) return null;
      return (new Date(a.decided_at).getTime() - created) / (1000 * 60 * 60);
    })
    .filter((v): v is number => v !== null && v >= 0);

  const missingCount = missing.filter((m) => !(m.contractor_qualifications as unknown[] | null)?.length).length;

  const expiringByType = expiring.reduce<Record<string, number>>((acc, row) => {
    const name = (row.qualification_types as { name?: string } | null)?.name ?? 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const topExpiring = Object.entries(expiringByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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
            <li>Average time-to-approve: {avg(approvalDurationsHours).toFixed(1)} hours</li>
            <li>Approval records: {approvals.length}</li>
            <li>Qualifications expiring in 30 days: {expiring.length}</li>
            <li>Contractors missing any qualification: {missingCount}</li>
          </ul>
        </Card>

        <Card title="Top expiring qualification types (30d)">
          <ul className="space-y-1 text-sm">
            {topExpiring.map(([name, count]) => (
              <li key={name} className="flex justify-between"><span>{name}</span><span>{count}</span></li>
            ))}
            {topExpiring.length === 0 ? <li className="text-slate-500">No expiring qualifications in period.</li> : null}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
