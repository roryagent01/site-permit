import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const completeSchema = z.object({
  completed: z.boolean().refine((v) => v === true),
  payload: z.record(z.string(), z.any()).optional()
});

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  const { data: invite } = await admin
    .from('training_invites')
    .select('id,module_id,recipient_email,expires_at,revoked_at,completed_at,training_modules(title,summary,content_url)')
    .eq('token', token)
    .maybeSingle();

  if (!invite) return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Training link not found' } }, { status: 404 });
  if (invite.revoked_at) return NextResponse.json({ ok: false, error: { code: 'revoked', message: 'Training link revoked' } }, { status: 410 });
  if (invite.completed_at) return NextResponse.json({ ok: false, error: { code: 'used', message: 'Training already completed' } }, { status: 410 });
  if (new Date(invite.expires_at).getTime() < Date.now()) return NextResponse.json({ ok: false, error: { code: 'expired', message: 'Training link expired' } }, { status: 410 });

  return NextResponse.json({ ok: true, data: { recipientEmail: invite.recipient_email, module: invite.training_modules }, error: null });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const parsed = completeSchema.safeParse(await request.json().catch(() => ({ completed: true })));
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: 'invalid_payload', message: 'Invalid completion payload' } }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: invite } = await admin
    .from('training_invites')
    .select('id,workspace_id,contractor_id,contractor_contact_id,module_id,recipient_email,expires_at,revoked_at,completed_at')
    .eq('token', token)
    .maybeSingle();

  if (!invite) return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Training link not found' } }, { status: 404 });
  if (invite.revoked_at || invite.completed_at || new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: { code: 'invalid_link', message: 'Training link invalid' } }, { status: 410 });
  }

  const now = new Date().toISOString();
  await admin
    .from('training_invites')
    .update({ completed_at: now, completion_payload: parsed.data.payload ?? {} })
    .eq('id', invite.id);

  await admin.from('contractor_training_records').upsert({
    workspace_id: invite.workspace_id,
    contractor_id: invite.contractor_id,
    contractor_contact_id: invite.contractor_contact_id,
    module_id: invite.module_id,
    invite_id: invite.id,
    recipient_email: invite.recipient_email,
    completed_at: now
  }, { onConflict: 'workspace_id,module_id,recipient_email' });

  return NextResponse.json({ ok: true, data: { completed: true, completedAt: now }, error: null });
}
