import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { ok, fail } from '@/lib/api/response';
import { sendEmailWithRetry } from '@/lib/notifications/email';

const schema = z.object({
  contractorId: z.string().uuid(),
  moduleId: z.string().uuid(),
  recipients: z.array(z.object({ email: z.string().email(), name: z.string().optional() })).min(1),
  expiresInHours: z.number().int().min(1).max(720).default(168)
});

export async function GET(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  const contractorId = new URL(request.url).searchParams.get('contractorId');
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from('training_invites')
    .select('id,contractor_id,module_id,recipient_email,expires_at,completed_at,revoked_at,created_at')
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (contractorId) q = q.eq('contractor_id', contractorId);
  const { data } = await q;
  return NextResponse.json(ok({ items: data ?? [] }));
}

export async function POST(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (!['admin', 'owner', 'issuer'].includes(ctx.role)) return NextResponse.json(fail('forbidden', 'Role not allowed'), { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(fail('invalid_payload', 'Invalid training invite payload'), { status: 400 });

  const supabase = await createSupabaseServerClient();
  const expiresAt = new Date(Date.now() + parsed.data.expiresInHours * 3600 * 1000).toISOString();

  const created: Array<{ id: string; email: string; url: string }> = [];

  for (const recipient of parsed.data.recipients) {
    const { data: contact } = await supabase
      .from('contractor_contacts')
      .upsert({
        workspace_id: ctx.workspaceId,
        contractor_id: parsed.data.contractorId,
        email: recipient.email,
        name: recipient.name ?? null,
        status: 'active'
      }, { onConflict: 'workspace_id,contractor_id,email' })
      .select('id')
      .single();

    const token = randomBytes(24).toString('base64url');
    const { data: invite } = await supabase
      .from('training_invites')
      .insert({
        workspace_id: ctx.workspaceId,
        contractor_id: parsed.data.contractorId,
        contractor_contact_id: contact?.id ?? null,
        module_id: parsed.data.moduleId,
        recipient_email: recipient.email,
        token,
        expires_at: expiresAt,
        sent_at: new Date().toISOString(),
        created_by: ctx.user.id
      })
      .select('id')
      .single();

    const url = `${process.env.APP_BASE_URL ?? ''}/api/public/training/${token}`;
    created.push({ id: invite?.id ?? '', email: recipient.email, url });

    const emailResult = await sendEmailWithRetry({
      to: recipient.email,
      subject: 'Site induction training link',
      html: `<p>Please complete your site induction before arrival.</p><p><a href="${url}">Open training link</a></p>`
    });

    if (!emailResult.ok) {
      await supabase.from('notification_failures').insert({
        workspace_id: ctx.workspaceId,
        channel: 'email',
        event_type: 'training_invite',
        recipient: recipient.email,
        payload: { contractorId: parsed.data.contractorId, moduleId: parsed.data.moduleId },
        error_message: emailResult.error ?? 'unknown_email_error'
      });
    }
  }

  return NextResponse.json(ok({ invites: created, count: created.length }));
}
