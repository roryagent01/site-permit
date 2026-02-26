import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { formatDateValue } from '@/lib/i18n/date';

type Group = { date: string; items: Array<{ id: string; title: string; status: string; start_at: string | null; end_at: string | null }> };

export default async function PermitCalendarPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();
  const { status } = await searchParams;

  let q = supabase
    .from('permits')
    .select('id,title,status,start_at,end_at,created_at')
    .eq('workspace_id', ctx?.workspaceId ?? '');

  if (status) q = q.eq('status', status);

  const permits = ctx ? (await q.order('start_at', { ascending: true })).data ?? [] : [];

  const groupsMap = new Map<string, Group['items']>();
  for (const p of permits) {
    const key = (p.start_at ?? p.created_at).slice(0, 10);
    const arr = groupsMap.get(key) ?? [];
    arr.push(p);
    groupsMap.set(key, arr);
  }

  const groups: Group[] = Array.from(groupsMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, items]) => ({ date, items }));

  return (
    <AppShell title="Permit Calendar / Timeline">
      <Card>
        <form className="mb-4 flex gap-2 text-sm">
          <select name="status" defaultValue={status ?? ''} className="rounded border px-3 py-2">
            <option value="">All statuses</option>
            <option value="draft">draft</option>
            <option value="submitted">submitted</option>
            <option value="approved">approved</option>
            <option value="active">active</option>
            <option value="needs_changes">needs_changes</option>
            <option value="closed">closed</option>
            <option value="cancelled">cancelled</option>
            <option value="expired">expired</option>
          </select>
          <button className="rounded border px-3 py-2" type="submit">Filter</button>
        </form>

        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.date} className="rounded border p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">{g.date}</h3>
              <ul className="space-y-2 text-sm">
                {g.items.map((p) => (
                  <li key={p.id} className="rounded bg-slate-50 p-2">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-slate-600">{p.status} • {p.start_at ? formatDateValue(p.start_at, { withTime: true }) : 'unscheduled'}</div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {groups.length === 0 ? <p className="text-sm text-slate-500">No permits in timeline.</p> : null}
        </div>
      </Card>
    </AppShell>
  );
}
