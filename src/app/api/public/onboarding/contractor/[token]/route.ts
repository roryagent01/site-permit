import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const acceptSchema = z.object({
  companyName: z.string().min(1),
  contactEmail: z.string().email().optional(),
  notes: z.string().optional()
});

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  const { data: invite } = await admin
    .from('contractor_invites')
    .select('id,workspace_id,site_id,expires_at,revoked_at,accepted_at')
    .eq('token', token)
    .maybeSingle();

  if (!invite) return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Invite not found' } }, { status: 404 });
  if (invite.revoked_at) return NextResponse.json({ ok: false, error: { code: 'revoked', message: 'Invite revoked' } }, { status: 410 });
  if (invite.accepted_at) return NextResponse.json({ ok: false, error: { code: 'used', message: 'Invite already used' } }, { status: 410 });
  if (new Date(invite.expires_at).getTime() < Date.now()) return NextResponse.json({ ok: false, error: { code: 'expired', message: 'Invite expired' } }, { status: 410 });

  return NextResponse.json({ ok: true, data: { siteId: invite.site_id }, error: null });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const parsed = acceptSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: 'invalid_payload', message: 'Invalid payload' } }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: invite } = await admin
    .from('contractor_invites')
    .select('id,workspace_id,site_id,expires_at,revoked_at,accepted_at')
    .eq('token', token)
    .maybeSingle();

  if (!invite) return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Invite not found' } }, { status: 404 });
  if (invite.revoked_at || invite.accepted_at || new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: { code: 'invalid_invite', message: 'Invite invalid' } }, { status: 410 });
  }

  const { data: contractor } = await admin
    .from('contractors')
    .insert({
      workspace_id: invite.workspace_id,
      site_id: invite.site_id,
      name: parsed.data.companyName,
      contact_email: parsed.data.contactEmail ?? null,
      status: 'active'
    })
    .select('id')
    .single();

  await admin.from('contractor_invites').update({ accepted_at: new Date().toISOString(), contractor_id: contractor?.id ?? null }).eq('id', invite.id);

  return NextResponse.json({ ok: true, data: { accepted: true, contractorId: contractor?.id }, error: null });
}
