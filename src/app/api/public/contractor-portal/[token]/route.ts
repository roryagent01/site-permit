import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();

  const { data: invite } = await admin
    .from('contractor_portal_invites')
    .select('id,workspace_id,contractor_id,expires_at,revoked_at')
    .eq('token', token)
    .maybeSingle();

  if (!invite) return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Portal link not found' } }, { status: 404 });
  if (invite.revoked_at) return NextResponse.json({ ok: false, error: { code: 'revoked', message: 'Portal link revoked' } }, { status: 410 });
  if (new Date(invite.expires_at).getTime() < Date.now()) return NextResponse.json({ ok: false, error: { code: 'expired', message: 'Portal link expired' } }, { status: 410 });

  const [contractorRes, qualsRes, trainingRes] = await Promise.all([
    admin.from('contractors').select('id,name,status,contact_email').eq('workspace_id', invite.workspace_id).eq('id', invite.contractor_id).maybeSingle(),
    admin
      .from('contractor_qualifications')
      .select('id,expiry_date,verification_status,qualification_types(name)')
      .eq('workspace_id', invite.workspace_id)
      .eq('contractor_id', invite.contractor_id)
      .order('expiry_date', { ascending: true }),
    admin
      .from('contractor_training_records')
      .select('id,recipient_email,completed_at,training_modules(title)')
      .eq('workspace_id', invite.workspace_id)
      .eq('contractor_id', invite.contractor_id)
      .order('completed_at', { ascending: false })
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      contractor: contractorRes.data,
      qualifications: qualsRes.data ?? [],
      trainingRecords: trainingRes.data ?? []
    },
    error: null
  });
}
