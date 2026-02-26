import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { canTransitionPermit, type PermitStatus } from '@/lib/domain/permit';
import { ok, fail } from '@/lib/api/response';

const transitionSchema = z.object({
  action: z.literal('transition'),
  nextStatus: z.enum(['submitted', 'active', 'closed', 'cancelled', 'needs_changes']),
  closureNote: z.string().optional(),
  reason: z.string().optional()
});

const decisionSchema = z.object({
  action: z.literal('decision'),
  decision: z.enum(['approved', 'rejected', 'changes']),
  comment: z.string().min(1)
});

const checklistSchema = z.object({
  action: z.literal('checklist'),
  mode: z.enum(['add', 'toggle']),
  itemId: z.string().uuid().optional(),
  label: z.string().optional(),
  required: z.boolean().optional(),
  checked: z.boolean().optional()
});

const taskSchema = z.object({
  action: z.literal('task'),
  mode: z.enum(['complete']) ,
  taskId: z.string().uuid()
});

const bodySchema = z.discriminatedUnion('action', [transitionSchema, decisionSchema, checklistSchema, taskSchema]);

function roleAllowed(role: string, allowed: string[]) {
  return allowed.includes(role);
}

export async function POST(request: Request, { params }: { params: Promise<{ permitId: string }> }) {
  const { permitId } = await params;
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(fail('invalid_payload', 'Invalid action payload'), { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: permit } = await supabase
    .from('permits')
    .select('id,status,payload,end_at')
    .eq('workspace_id', ctx.workspaceId)
    .eq('id', permitId)
    .maybeSingle();

  if (!permit) return NextResponse.json(fail('not_found', 'Permit not found'), { status: 404 });

  const input = parsed.data;

  if (input.action === 'transition') {
    const allowedByStatus: Record<string, string[]> = {
      submitted: ['issuer', 'admin', 'owner'],
      active: ['approver', 'admin', 'owner'],
      closed: ['issuer', 'admin', 'owner'],
      cancelled: ['issuer', 'admin', 'owner'],
      needs_changes: ['approver', 'admin', 'owner']
    };
    if (!roleAllowed(ctx.role, allowedByStatus[input.nextStatus])) {
      return NextResponse.json(fail('forbidden', 'Role not allowed for this transition'), { status: 403 });
    }

    if (!canTransitionPermit(permit.status as PermitStatus, input.nextStatus as PermitStatus)) {
      return NextResponse.json(fail('invalid_transition', 'Transition not allowed', { from: permit.status, to: input.nextStatus }), {
        status: 409
      });
    }

    const update: Record<string, unknown> = { status: input.nextStatus, updated_at: new Date().toISOString() };
    if (input.nextStatus === 'closed') {
      if (!input.closureNote?.trim()) return NextResponse.json(fail('validation_error', 'closureNote is required'), { status: 400 });
      update.end_at = permit.end_at ?? new Date().toISOString();
      update.closed_at = new Date().toISOString();
      update.payload = { ...(permit.payload as object), closure_note: input.closureNote };
    }
    if (input.nextStatus === 'submitted') update.submitted_at = new Date().toISOString();
    if (input.nextStatus === 'cancelled') {
      if (!input.reason?.trim()) return NextResponse.json(fail('validation_error', 'reason is required'), { status: 400 });
      update.cancelled_at = new Date().toISOString();
      update.rejection_reason = input.reason;
    }
    if (input.nextStatus === 'needs_changes') {
      if (!input.reason?.trim()) return NextResponse.json(fail('validation_error', 'reason is required'), { status: 400 });
      update.needs_changes_reason = input.reason;
    }

    await supabase.from('permits').update(update).eq('workspace_id', ctx.workspaceId).eq('id', permitId);
    return NextResponse.json(ok({ permitId, status: input.nextStatus }));
  }

  if (input.action === 'decision') {
    if (!roleAllowed(ctx.role, ['approver', 'admin', 'owner'])) {
      return NextResponse.json(fail('forbidden', 'Role not allowed for decisions'), { status: 403 });
    }

    await supabase.from('permit_approvals').insert({
      workspace_id: ctx.workspaceId,
      permit_id: permitId,
      approver_user_id: ctx.user.id,
      decision: input.decision,
      comment: input.comment
    });

    if (input.decision === 'approved') {
      await supabase.from('permits').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('workspace_id', ctx.workspaceId).eq('id', permitId);
    } else if (input.decision === 'rejected') {
      await supabase.from('permits').update({ status: 'cancelled', rejection_reason: input.comment }).eq('workspace_id', ctx.workspaceId).eq('id', permitId);
    } else {
      await supabase.from('permits').update({ status: 'needs_changes', needs_changes_reason: input.comment }).eq('workspace_id', ctx.workspaceId).eq('id', permitId);
      await supabase.from('permit_tasks').insert({
        workspace_id: ctx.workspaceId,
        permit_id: permitId,
        title: `Address changes: ${input.comment.slice(0, 120)}`,
        status: 'open',
        due_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        assignee_user_id: null
      });
    }

    return NextResponse.json(ok({ permitId, decision: input.decision }));
  }

  if (input.action === 'checklist') {
    if (!roleAllowed(ctx.role, ['issuer', 'approver', 'admin', 'owner'])) {
      return NextResponse.json(fail('forbidden', 'Role not allowed for checklist actions'), { status: 403 });
    }

    if (input.mode === 'add') {
      if (!input.label?.trim()) return NextResponse.json(fail('validation_error', 'label is required'), { status: 400 });
      const { data } = await supabase
        .from('permit_checklist_items')
        .insert({ workspace_id: ctx.workspaceId, permit_id: permitId, label: input.label.trim(), required: input.required ?? true })
        .select('id')
        .single();
      return NextResponse.json(ok({ permitId, itemId: data?.id }));
    }

    if (!input.itemId) return NextResponse.json(fail('validation_error', 'itemId is required'), { status: 400 });
    await supabase
      .from('permit_checklist_items')
      .update({ checked: input.checked ?? false, checked_by: ctx.user.id, checked_at: input.checked ? new Date().toISOString() : null })
      .eq('workspace_id', ctx.workspaceId)
      .eq('id', input.itemId);
    return NextResponse.json(ok({ permitId, itemId: input.itemId, checked: input.checked ?? false }));
  }

  if (!roleAllowed(ctx.role, ['issuer', 'admin', 'owner'])) {
    return NextResponse.json(fail('forbidden', 'Role not allowed for task actions'), { status: 403 });
  }
  await supabase
    .from('permit_tasks')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('workspace_id', ctx.workspaceId)
    .eq('id', input.taskId);

  return NextResponse.json(ok({ permitId, taskId: input.taskId, status: 'done' }));
}
