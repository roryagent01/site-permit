import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { PermitLiveStatus } from './permit-live';
import { logAuditEvent } from '@/lib/audit/events';
import { canTransitionPermit, type PermitStatus } from '@/lib/domain/permit';

async function transitionPermitAction(formData: FormData) {
  'use server';
  const permitId = String(formData.get('permit_id'));
  const nextStatus = String(formData.get('next_status'));
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from('permits')
    .select('status')
    .eq('id', permitId)
    .eq('workspace_id', ctx.workspaceId)
    .single();

  if (!existing?.status || !canTransitionPermit(existing.status as PermitStatus, nextStatus as PermitStatus)) {
    return;
  }

  await supabase
    .from('permits')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', permitId)
    .eq('workspace_id', ctx.workspaceId);

  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: `permit.${nextStatus}`,
    objectType: 'permit',
    objectId: permitId,
    payload: { status: nextStatus }
  });

  if (nextStatus === 'submitted') {
    await supabase.from('permit_approvals').insert({
      workspace_id: ctx.workspaceId,
      permit_id: permitId,
      approver_user_id: ctx.user.id,
      decision: 'changes',
      comment: 'Awaiting formal approver decision (v1 placeholder step).'
    });
  }

  revalidatePath(`/app/permits/${permitId}`);
}

async function approvePermitAction(formData: FormData) {
  'use server';
  const permitId = String(formData.get('permit_id'));
  const comment = String(formData.get('comment') ?? 'Approved');
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;
  const supabase = await createSupabaseServerClient();

  await supabase.from('permit_approvals').insert({
    workspace_id: ctx.workspaceId,
    permit_id: permitId,
    approver_user_id: ctx.user.id,
    decision: 'approved',
    comment
  });

  await supabase.from('permits').update({ status: 'approved' }).eq('id', permitId).eq('workspace_id', ctx.workspaceId);
  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: 'permit.approved',
    objectType: 'permit',
    objectId: permitId,
    payload: { comment }
  });
  revalidatePath(`/app/permits/${permitId}`);
}

export default async function PermitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCurrentWorkspace();
  if (!ctx) redirect('/auth/login');

  const supabase = await createSupabaseServerClient();
  const { data: permit } = await supabase
    .from('permits')
    .select('id,title,status,start_at,end_at,payload,created_at,template_id')
    .eq('workspace_id', ctx.workspaceId)
    .eq('id', id)
    .single();

  if (!permit) notFound();

  const { data: approvals } = await supabase
    .from('permit_approvals')
    .select('id,decision,comment,decided_at,approver_user_id')
    .eq('workspace_id', ctx.workspaceId)
    .eq('permit_id', id)
    .order('decided_at', { ascending: false });

  return (
    <AppShell title="Permit Detail">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <Card title="Permit">
            <h3 className="text-lg font-semibold">{permit.title}</h3>
            <p className="text-sm text-slate-600">Status: {permit.status}</p>
            <PermitLiveStatus permitId={permit.id} initialStatus={permit.status} />
            <p className="mt-2 text-sm text-slate-700">Location: {(permit.payload as { location?: string })?.location ?? '-'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={transitionPermitAction}>
                <input type="hidden" name="permit_id" value={permit.id} />
                <input type="hidden" name="next_status" value="submitted" />
                <Button type="submit" variant="secondary">Submit</Button>
              </form>
              <form action={approvePermitAction}>
                <input type="hidden" name="permit_id" value={permit.id} />
                <input type="hidden" name="comment" value="Approved by approver" />
                <Button type="submit">Approve</Button>
              </form>
              <form action={transitionPermitAction}>
                <input type="hidden" name="permit_id" value={permit.id} />
                <input type="hidden" name="next_status" value="active" />
                <Button type="submit" variant="secondary">Activate</Button>
              </form>
              <form action={transitionPermitAction}>
                <input type="hidden" name="permit_id" value={permit.id} />
                <input type="hidden" name="next_status" value="closed" />
                <Button type="submit" variant="secondary">Close</Button>
              </form>
              <Link href={`/api/permits/${permit.id}/pdf`} className="rounded-md border px-4 py-2 text-sm">Export PDF</Link>
            </div>
          </Card>
        </div>
        <Card title="Approvals">
          <ul className="space-y-2 text-sm">
            {approvals?.map((a) => (
              <li key={a.id} className="rounded border p-2">
                <div className="font-medium">{a.decision}</div>
                <div className="text-slate-600">{a.comment}</div>
              </li>
            ))}
            {!approvals?.length ? <li className="text-slate-500">No approval events yet.</li> : null}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
