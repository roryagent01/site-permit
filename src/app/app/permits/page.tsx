import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';

export default async function PermitsPage() {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();

  const permits = ctx
    ? (await supabase
        .from('permits')
        .select('id,title,status,start_at,end_at,created_at')
        .eq('workspace_id', ctx.workspaceId)
        .order('created_at', { ascending: false })).data ?? []
    : [];

  return (
    <AppShell title="Permits">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-slate-600">Track Draft → Submitted → Approved → Active → Closed</p>
          <Link href="/app/permits/new" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white">
            New permit
          </Link>
        </div>
        <ul className="space-y-2 text-sm">
          {permits.map((p) => (
            <li key={p.id} className="rounded border p-2">
              <Link href={`/app/permits/${p.id}`} className="font-medium text-blue-800 hover:underline">
                {p.title}
              </Link>
              <div className="text-slate-600">Status: {p.status}</div>
            </li>
          ))}
          {permits.length === 0 ? <li className="text-slate-500">No permits created yet.</li> : null}
        </ul>
      </Card>
    </AppShell>
  );
}
