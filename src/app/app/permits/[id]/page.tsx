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
import { evaluateQualificationGate } from '@/lib/domain/qualification-gate';
import { UploadWidget } from '@/components/files/upload-widget';
import { getWorkspaceRoleRecipientEmails } from '@/lib/notifications/workspace-recipients';
import { permitDecisionEmailHtml, permitSubmittedEmailHtml, sendEmail } from '@/lib/notifications/email';

type QualificationGateResult = { blocked: boolean; reason?: string };

type ApprovalStep = { step_order: number; role: string; required: boolean };

async function getNextRequiredApprovalRole(
  workspaceId: string,
  permitId: string,
  templateId: string | null,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<{ nextRole: string | null; totalSteps: number; approvedCount: number }> {
  if (!templateId) return { nextRole: 'approver', totalSteps: 1, approvedCount: 0 };

  const [{ data: steps }, { data: approvals }] = await Promise.all([
    supabase
      .from('permit_template_steps')
      .select('step_order,role,required')
      .eq('workspace_id', workspaceId)
      .eq('template_id', templateId)
      .order('step_order', { ascending: true }),
    supabase
      .from('permit_approvals')
      .select('id,decision')
      .eq('workspace_id', workspaceId)
      .eq('permit_id', permitId)
      .eq('decision', 'approved')
  ]);

  const orderedSteps = (steps as ApprovalStep[] | null) ?? [];
  const totalSteps = orderedSteps.length || 1;
  const approvedCount = approvals?.length ?? 0;

  if (!orderedSteps.length) {
    return { nextRole: approvedCount > 0 ? null : 'approver', totalSteps, approvedCount };
  }

  const next = orderedSteps[approvedCount];
  return { nextRole: next?.role ?? null, totalSteps, approvedCount };
}

async function checkQualificationGate(
  workspaceId: string,
  templateId: string | null,
  contractorId: string | null,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<QualificationGateResult> {
  if (!templateId || !contractorId) return { blocked: false };

  const { data: tpl } = await supabase
    .from('permit_templates')
    .select('definition')
    .eq('workspace_id', workspaceId)
    .eq('id', templateId)
    .maybeSingle();

  const gate = (tpl?.definition as { qualificationGate?: { mode?: 'block' | 'warn'; requiredQualificationTypeIds?: string[] } })
    ?.qualificationGate;

  const { data: quals } = await supabase
    .from('contractor_qualifications')
    .select('qualification_type_id,expiry_date')
    .eq('workspace_id', workspaceId)
    .eq('contractor_id', contractorId);

  const today = new Date().toISOString().slice(0, 10);
  const evalResult = evaluateQualificationGate(gate, quals ?? [], today);
  return { blocked: evalResult.blocked, reason: evalResult.reason };
}

async function transitionPermitAction(formData: FormData) {
  'use server';
  const permitId = String(formData.get('permit_id'));
  const nextStatus = String(formData.get('next_status'));
  const closureNote = String(formData.get('closure_note') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;
  if (nextStatus === 'submitted' && !['issuer', 'admin', 'owner'].includes(ctx.role)) return;
  if (nextStatus === 'closed' && !['issuer', 'admin', 'owner'].includes(ctx.role)) return;
  if (nextStatus === 'active' && !['approver', 'admin', 'owner'].includes(ctx.role)) return;
  if (nextStatus === 'cancelled' && !['issuer', 'admin', 'owner'].includes(ctx.role)) return;
  if (nextStatus === 'needs_changes' && !['approver', 'admin', 'owner'].includes(ctx.role)) return;
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

  const { data: permitForGate } = await supabase
    .from('permits')
    .select('template_id,payload,end_at')
    .eq('id', permitId)
    .eq('workspace_id', ctx.workspaceId)
    .single();

  if (nextStatus === 'closed') {
    if (!closureNote) return;
    if (!permitForGate?.end_at) {
      await supabase
        .from('permits')
        .update({ end_at: new Date().toISOString(), payload: { ...(permitForGate?.payload as object), closure_note: closureNote } })
        .eq('id', permitId)
        .eq('workspace_id', ctx.workspaceId);
    }
  }

  if (nextStatus === 'cancelled' || nextStatus === 'needs_changes') {
    if (!reason) return;
  }

  if (nextStatus === 'submitted') {
    const contractorId = (permitForGate?.payload as { contractor_id?: string | null } | null)?.contractor_id ?? null;
    const gate = await checkQualificationGate(ctx.workspaceId, permitForGate?.template_id ?? null, contractorId, supabase);
    if (gate.blocked) {
      await logAuditEvent({
        workspaceId: ctx.workspaceId,
        actorUserId: ctx.user.id,
        action: 'permit.submit_blocked',
        objectType: 'permit',
        objectId: permitId,
        payload: { reason: gate.reason }
      });
      return;
    }
  }

  const updatePayload: Record<string, unknown> = { status: nextStatus, updated_at: new Date().toISOString() };
  if (nextStatus === 'closed') {
    updatePayload.end_at = permitForGate?.end_at ?? new Date().toISOString();
    updatePayload.closed_at = new Date().toISOString();
    updatePayload.payload = { ...(permitForGate?.payload as object), closure_note: closureNote };
  }
  if (nextStatus === 'submitted') updatePayload.submitted_at = new Date().toISOString();
  if (nextStatus === 'cancelled') {
    updatePayload.cancelled_at = new Date().toISOString();
    updatePayload.rejection_reason = reason;
    updatePayload.payload = { ...(permitForGate?.payload as object), cancellation_reason: reason };
  }
  if (nextStatus === 'needs_changes') {
    updatePayload.needs_changes_reason = reason;
    updatePayload.payload = { ...(permitForGate?.payload as object), needs_changes_reason: reason };
  }

  await supabase
    .from('permits')
    .update(updatePayload)
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
    const { data: permitInfo } = await supabase
      .from('permits')
      .select('title,template_id')
      .eq('workspace_id', ctx.workspaceId)
      .eq('id', permitId)
      .single();

    const nextStep = await getNextRequiredApprovalRole(ctx.workspaceId, permitId, permitInfo?.template_id ?? null, supabase);
    const role = (nextStep.nextRole as 'owner' | 'admin' | 'approver' | 'issuer' | 'viewer' | null) ?? 'approver';
    const recipients = await getWorkspaceRoleRecipientEmails(ctx.workspaceId, [role, 'admin', 'owner']);
    if (recipients.length) {
      await sendEmail({
        to: recipients,
        subject: `Permit submitted: ${permitInfo?.title ?? permitId}`,
        html: permitSubmittedEmailHtml({
          permitTitle: permitInfo?.title ?? permitId,
          workspaceName: ctx.workspaceName,
          permitId,
          appBaseUrl: process.env.APP_BASE_URL
        })
      });
    }
  }

  revalidatePath(`/app/permits/${permitId}`);
}

async function approvePermitAction(formData: FormData) {
  'use server';
  const permitId = String(formData.get('permit_id'));
  const comment = String(formData.get('comment') ?? 'Approved');
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;
  if (!['approver', 'admin', 'owner'].includes(ctx.role)) return;
  const supabase = await createSupabaseServerClient();

  const { data: permitForGate } = await supabase
    .from('permits')
    .select('template_id,payload,title,status')
    .eq('id', permitId)
    .eq('workspace_id', ctx.workspaceId)
    .single();
  if (permitForGate?.status !== 'submitted') return;

  const nextStep = await getNextRequiredApprovalRole(ctx.workspaceId, permitId, permitForGate?.template_id ?? null, supabase);
  if (nextStep.nextRole && ![nextStep.nextRole, 'admin', 'owner'].includes(ctx.role)) {
    await logAuditEvent({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.user.id,
      action: 'permit.approve_blocked_wrong_role',
      objectType: 'permit',
      objectId: permitId,
      payload: { requiredRole: nextStep.nextRole, actorRole: ctx.role }
    });
    return;
  }

  const contractorId = (permitForGate?.payload as { contractor_id?: string | null } | null)?.contractor_id ?? null;
  const gate = await checkQualificationGate(ctx.workspaceId, permitForGate?.template_id ?? null, contractorId, supabase);
  if (gate.blocked) {
    await logAuditEvent({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.user.id,
      action: 'permit.approve_blocked',
      objectType: 'permit',
      objectId: permitId,
      payload: { reason: gate.reason }
    });
    return;
  }

  await supabase.from('permit_approvals').insert({
    workspace_id: ctx.workspaceId,
    permit_id: permitId,
    approver_user_id: ctx.user.id,
    decision: 'approved',
    comment
  });

  const postStep = await getNextRequiredApprovalRole(ctx.workspaceId, permitId, permitForGate?.template_id ?? null, supabase);
  const finalApproved = postStep.nextRole === null || postStep.approvedCount >= postStep.totalSteps;

  if (finalApproved) {
    await supabase.from('permits').update({ status: 'approved' }).eq('id', permitId).eq('workspace_id', ctx.workspaceId);

    const recipients = await getWorkspaceRoleRecipientEmails(ctx.workspaceId, ['issuer', 'admin', 'owner']);
    if (recipients.length) {
      await sendEmail({
        to: recipients,
        subject: `Permit approved: ${permitForGate?.title ?? permitId}`,
        html: permitDecisionEmailHtml({
          permitTitle: permitForGate?.title ?? permitId,
          decision: 'approved',
          comment,
          permitId,
          appBaseUrl: process.env.APP_BASE_URL
        })
      });
    }
  } else {
    const nextRole = (postStep.nextRole as 'owner' | 'admin' | 'approver' | 'issuer' | 'viewer');
    const recipients = await getWorkspaceRoleRecipientEmails(ctx.workspaceId, [nextRole, 'admin', 'owner']);
    if (recipients.length) {
      await sendEmail({
        to: recipients,
        subject: `Permit awaiting next approval step: ${permitForGate?.title ?? permitId}`,
        html: permitSubmittedEmailHtml({
          permitTitle: permitForGate?.title ?? permitId,
          workspaceName: ctx.workspaceName,
          permitId,
          appBaseUrl: process.env.APP_BASE_URL
        })
      });
    }
  }

  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: 'permit.approved',
    objectType: 'permit',
    objectId: permitId,
    payload: { comment }
  });

  if (finalApproved) {
    await supabase
      .from('permits')
      .update({ approved_at: new Date().toISOString() })
      .eq('id', permitId)
      .eq('workspace_id', ctx.workspaceId);
  }

  revalidatePath(`/app/permits/${permitId}`);
}

async function decisionPermitAction(formData: FormData) {
  'use server';
  const permitId = String(formData.get('permit_id'));
  const decision = String(formData.get('decision')); // rejected | changes
  const comment = String(formData.get('comment') ?? '').trim();
  const ctx = await getCurrentWorkspace();
  if (!ctx) return;
  if (!['approver', 'admin', 'owner'].includes(ctx.role)) return;
  if (!['rejected', 'changes'].includes(decision)) return;
  if (!comment) return;

  const supabase = await createSupabaseServerClient();
  const { data: permit } = await supabase
    .from('permits')
    .select('title,status')
    .eq('workspace_id', ctx.workspaceId)
    .eq('id', permitId)
    .single();

  if (!permit || permit.status !== 'submitted') return;

  await supabase.from('permit_approvals').insert({
    workspace_id: ctx.workspaceId,
    permit_id: permitId,
    approver_user_id: ctx.user.id,
    decision,
    comment
  });

  if (decision === 'rejected') {
    await supabase
      .from('permits')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), rejection_reason: comment })
      .eq('workspace_id', ctx.workspaceId)
      .eq('id', permitId);
  } else {
    await supabase
      .from('permits')
      .update({ status: 'needs_changes', needs_changes_reason: comment })
      .eq('workspace_id', ctx.workspaceId)
      .eq('id', permitId);
  }

  const recipients = await getWorkspaceRoleRecipientEmails(ctx.workspaceId, ['issuer', 'admin', 'owner']);
  if (recipients.length) {
    await sendEmail({
      to: recipients,
      subject: `Permit ${decision === 'rejected' ? 'rejected' : 'needs changes'}: ${permit.title}`,
      html: permitDecisionEmailHtml({
        permitTitle: permit.title,
        decision,
        comment,
        permitId,
        appBaseUrl: process.env.APP_BASE_URL
      })
    });
  }

  await logAuditEvent({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.user.id,
    action: decision === 'rejected' ? 'permit.rejected' : 'permit.needs_changes',
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

  const [{ data: approvals }, { data: attachments }] = await Promise.all([
    supabase
      .from('permit_approvals')
      .select('id,decision,comment,decided_at,approver_user_id')
      .eq('workspace_id', ctx.workspaceId)
      .eq('permit_id', id)
      .order('decided_at', { ascending: false }),
    supabase
      .from('files')
      .select('id,path,bucket,created_at')
      .eq('workspace_id', ctx.workspaceId)
      .eq('permit_id', id)
      .order('created_at', { ascending: false })
  ]);

  const stepState = await getNextRequiredApprovalRole(ctx.workspaceId, id, permit.template_id, supabase);

  return (
    <AppShell title="Permit Detail">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <Card title="Permit">
            <h3 className="text-lg font-semibold">{permit.title}</h3>
            <p className="text-sm text-slate-600">Status: {permit.status}</p>
            <p className="text-sm text-slate-600">
              Approval progress: {Math.min(stepState.approvedCount, stepState.totalSteps)}/{stepState.totalSteps}
              {stepState.nextRole ? ` • Waiting on: ${stepState.nextRole}` : ' • Complete'}
            </p>
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
              <form action={decisionPermitAction} className="flex items-center gap-2">
                <input type="hidden" name="permit_id" value={permit.id} />
                <input type="hidden" name="decision" value="changes" />
                <input name="comment" placeholder="Needs changes reason" className="rounded border px-2 py-1 text-xs" />
                <Button type="submit" variant="secondary">Needs changes</Button>
              </form>
              <form action={decisionPermitAction} className="flex items-center gap-2">
                <input type="hidden" name="permit_id" value={permit.id} />
                <input type="hidden" name="decision" value="rejected" />
                <input name="comment" placeholder="Reject reason" className="rounded border px-2 py-1 text-xs" />
                <Button type="submit" variant="danger">Reject</Button>
              </form>
              <form action={transitionPermitAction}>
                <input type="hidden" name="permit_id" value={permit.id} />
                <input type="hidden" name="next_status" value="active" />
                <Button type="submit" variant="secondary">Activate</Button>
              </form>
              <form action={transitionPermitAction} className="flex items-center gap-2">
                <input type="hidden" name="permit_id" value={permit.id} />
                <input type="hidden" name="next_status" value="closed" />
                <input name="closure_note" placeholder="Closure notes" className="rounded border px-2 py-1 text-xs" />
                <Button type="submit" variant="secondary">Close</Button>
              </form>
              <Link href={`/api/permits/${permit.id}/pdf`} className="rounded-md border px-4 py-2 text-sm">Export PDF</Link>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <UploadWidget bucket="permit_attachments" permitId={permit.id} />
              <div className="rounded-md border p-3">
                <p className="mb-2 text-xs text-slate-600">Current attachments</p>
                <ul className="space-y-1 text-xs text-slate-700">
                  {attachments?.map((f) => (
                    <li key={f.id} className="truncate">{f.bucket}: {f.path}</li>
                  ))}
                  {!attachments?.length ? <li className="text-slate-500">No attachments yet.</li> : null}
                </ul>
              </div>
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
