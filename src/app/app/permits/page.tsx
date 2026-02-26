import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';

async function duplicatePermitAction(formData: FormData) {
  'use server';
  const permitId = String(formData.get('permit_id'));
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;
  if (!['issuer', 'admin', 'owner'].includes(ctx.role)) return;

  const supabase = await createSupabaseServerClient();
  const { data: src } = await supabase
    .from('permits')
    .select('title,template_id,site_id,start_at,end_at,payload')
    .eq('workspace_id', ctx.workspaceId)
    .eq('id', permitId)
    .single();

  if (!src) return;

  await supabase.from('permits').insert({
    workspace_id: ctx.workspaceId,
    template_id: src.template_id,
    site_id: src.site_id,
    title: `${src.title} (copy)`,
    start_at: src.start_at,
    end_at: src.end_at,
    payload: src.payload,
    status: 'draft',
    created_by: ctx.user.id
  });

  revalidatePath('/app/permits');
}

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
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm text-slate-600">Track Draft → Submitted → Approved → Active → Closed</p>
          <div className="flex gap-2">
            <Link href="/app/permits/calendar" className="rounded-md border px-4 py-2 text-sm font-medium">
              Calendar view
            </Link>
            <Link href="/app/permits/new" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white">
              New permit
            </Link>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {permits.map((p) => (
            <li key={p.id} className="rounded border p-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/app/permits/${p.id}`} className="font-medium text-blue-800 hover:underline">
                    {p.title}
                  </Link>
                  <div className="text-slate-600">Status: {p.status}</div>
                </div>
                <form action={duplicatePermitAction}>
                  <input type="hidden" name="permit_id" value={p.id} />
                  <Button type="submit" variant="secondary" className="min-h-0 px-3 py-1.5 text-xs">
                    Issue again
                  </Button>
                </form>
              </div>
            </li>
          ))}
          {permits.length === 0 ? <li className="text-slate-500">No permits created yet.</li> : null}
        </ul>
      </Card>
    </AppShell>
  );
}
