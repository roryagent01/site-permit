import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';

export default async function SiteDashboardPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const sites = ctx
    ? (await supabase.from('sites').select('id,name').eq('workspace_id', ctx.workspaceId).order('name')).data ?? []
    : [];

  const metrics = [] as Array<{ siteId: string; permits30d: number; active: number; expiringQuals: number }>;

  for (const s of sites) {
    const [permits30d, active, expiring] = await Promise.all([
      supabase
        .from('permits')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', ctx?.workspaceId ?? '')
        .eq('site_id', s.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
      supabase
        .from('permits')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', ctx?.workspaceId ?? '')
        .eq('site_id', s.id)
        .eq('status', 'active'),
      supabase
        .from('contractor_qualifications')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', ctx?.workspaceId ?? '')
        .lte('expiry_date', new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10))
    ]);

    metrics.push({
      siteId: s.id,
      permits30d: permits30d.count ?? 0,
      active: active.count ?? 0,
      expiringQuals: expiring.count ?? 0
    });
  }

  return (
    <AppShell title="Site-Level Dashboards">
      <Card>
        <ul className="space-y-3 text-sm">
          {sites.map((s) => {
            const m = metrics.find((x) => x.siteId === s.id);
            return (
              <li key={s.id} className="rounded border p-3">
                <div className="font-medium">{s.name}</div>
                <div className="text-slate-600">Permits (30d): {m?.permits30d ?? 0}</div>
                <div className="text-slate-600">Active permits: {m?.active ?? 0}</div>
                <div className="text-slate-600">Expiring qualifications (30d): {m?.expiringQuals ?? 0}</div>
              </li>
            );
          })}
          {!sites.length ? <li className="text-slate-500">No sites configured.</li> : null}
        </ul>
      </Card>
    </AppShell>
  );
}
