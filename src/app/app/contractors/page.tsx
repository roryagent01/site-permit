import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { assertContractorWithinLimit } from '@/lib/limits';
import { logAuditEvent } from '@/lib/audit/events';
import { upsertUsageCounter } from '@/lib/usage/counters';

async function createContractorAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;
  if (!['issuer', 'admin', 'owner'].includes(ctx.role)) return;
  const supabase = await createSupabaseServerClient();

  try {
    await assertContractorWithinLimit(ctx.workspaceId, ctx.workspacePlan);
  } catch {
    redirect('/app/contractors?error=contractor_limit_reached');
  }

  const name = String(formData.get('name') ?? '');
  const contactEmail = String(formData.get('contact_email') ?? '');

  const { data: contractor } = await supabase
    .from('contractors')
    .insert({
      workspace_id: ctx.workspaceId,
      name,
      contact_email: contactEmail,
      status: 'active'
    })
    .select('id')
    .single();

  await upsertUsageCounter(ctx.workspaceId, { contractor_count: 1 });
  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: 'contractor.created',
    objectType: 'contractor',
    objectId: contractor?.id,
    payload: { name }
  });

  revalidatePath('/app/contractors');
}

export default async function ContractorsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; error?: string; status?: string; page?: string }>;
}) {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();
  const { q, error, status, page } = await searchParams;

  const pageSize = 25;
  const pageNum = Math.max(1, Number(page || 1));
  const from = (pageNum - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('contractors')
    .select('id,name,contact_email,status,created_at', { count: 'exact' })
    .eq('workspace_id', ctx?.workspaceId ?? '');

  if (q) query = query.ilike('name', `%${q}%`);
  if (status) query = query.eq('status', status);

  const contractorsResp = ctx ? await query.order('created_at', { ascending: false }).range(from, to) : null;
  const contractors = contractorsResp?.data ?? [];
  const total = contractorsResp?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AppShell title="Contractors">
      {error === 'contractor_limit_reached' ? (
        <p className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          Contractor limit reached for your plan. Upgrade to add more contractors.
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Add contractor">
          <form action={createContractorAction} className="space-y-3">
            <input name="name" required placeholder="Acme Contractors Ltd" className="w-full rounded-md border px-3 py-2" />
            <input name="contact_email" type="email" placeholder="ops@acme.com" className="w-full rounded-md border px-3 py-2" />
            <Button type="submit">Add contractor</Button>
          </form>
        </Card>
        <Card title="Contractor list">
          <form className="mb-3 grid gap-2 md:grid-cols-3">
            <input name="q" defaultValue={q} placeholder="Search contractor" className="w-full rounded-md border px-3 py-2" />
            <select name="status" defaultValue={status ?? ''} className="rounded-md border px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <button type="submit" className="rounded border px-3 py-2 text-sm">Apply filters</button>
          </form>
          <ul className="space-y-2 text-sm">
            {contractors.map((c) => (
              <li key={c.id} className="rounded border p-2">
                <div className="font-medium">{c.name}</div>
                <div className="text-slate-600">{c.contact_email || 'No email'} • {c.status}</div>
              </li>
            ))}
            {contractors.length === 0 ? <li className="text-slate-500">No contractors found.</li> : null}
          </ul>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <span>Page {pageNum} of {totalPages} • {total} total</span>
            <div className="flex gap-2">
              {pageNum > 1 ? (
                <a
                  href={`/app/contractors?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), page: String(pageNum - 1) }).toString()}`}
                  className="rounded border px-2 py-1"
                >
                  Prev
                </a>
              ) : null}
              {pageNum < totalPages ? (
                <a
                  href={`/app/contractors?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), page: String(pageNum + 1) }).toString()}`}
                  className="rounded border px-2 py-1"
                >
                  Next
                </a>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
