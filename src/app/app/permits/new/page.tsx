import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { assertPermitsWithinLimit } from '@/lib/limits';
import { logAuditEvent } from '@/lib/audit/events';
import { upsertUsageCounter } from '@/lib/usage/counters';

async function createPermitAction(formData: FormData) {
  'use server';
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;
  const supabase = await createSupabaseServerClient();

  try {
    await assertPermitsWithinLimit(ctx.workspaceId, ctx.workspacePlan);
  } catch {
    redirect('/app/permits/new?error=permit_limit_reached');
  }

  const title = String(formData.get('title') ?? '');
  const { data } = await supabase
    .from('permits')
    .insert({
      workspace_id: ctx.workspaceId,
      template_id: String(formData.get('template_id')) || null,
      title,
      start_at: String(formData.get('start_at') ?? '') || null,
      end_at: String(formData.get('end_at') ?? '') || null,
      status: 'draft',
      payload: { location: String(formData.get('location') ?? '') },
      created_by: ctx.user.id
    })
    .select('id')
    .single();

  await upsertUsageCounter(ctx.workspaceId, { permits_created: 1 });
  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: 'permit.created',
    objectType: 'permit',
    objectId: data?.id,
    payload: { title }
  });

  if (data?.id) redirect(`/app/permits/${data.id}`);
  redirect('/app/permits');
}

export default async function NewPermitPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await getCurrentWorkspace();
  const supabase = await createSupabaseServerClient();
  const { error } = await searchParams;

  const templates = ctx
    ? (await supabase
        .from('permit_templates')
        .select('id,name,category')
        .eq('workspace_id', ctx.workspaceId)
        .order('name')).data ?? []
    : [];

  return (
    <AppShell title="Create Permit">
      {error === 'permit_limit_reached' ? (
        <p className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          Monthly permit limit reached for your plan. Upgrade to continue creating permits.
        </p>
      ) : null}
      <Card>
        <form action={createPermitAction} className="grid gap-3 md:grid-cols-2">
          <input name="title" required placeholder="Boiler room hot work" className="rounded-md border px-3 py-2" />
          <input name="location" required placeholder="Location" className="rounded-md border px-3 py-2" />
          <input name="start_at" type="datetime-local" className="rounded-md border px-3 py-2" />
          <input name="end_at" type="datetime-local" className="rounded-md border px-3 py-2" />
          <select name="template_id" className="rounded-md border px-3 py-2 md:col-span-2">
            <option value="">Select template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category})
              </option>
            ))}
          </select>
          <div className="md:col-span-2">
            <Button type="submit">Create draft permit</Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
