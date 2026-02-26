import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  const { data: invite } = await admin
    .from('employee_invites')
    .select('id,email,role,workspace_id,expires_at,revoked_at,accepted_at')
    .eq('token', token)
    .maybeSingle();

  if (!invite) return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Invite not found' } }, { status: 404 });
  if (invite.revoked_at) return NextResponse.json({ ok: false, error: { code: 'revoked', message: 'Invite revoked' } }, { status: 410 });
  if (invite.accepted_at) return NextResponse.json({ ok: false, error: { code: 'used', message: 'Invite already used' } }, { status: 410 });
  if (new Date(invite.expires_at).getTime() < Date.now()) return NextResponse.json({ ok: false, error: { code: 'expired', message: 'Invite expired' } }, { status: 410 });

  return NextResponse.json({ ok: true, data: { email: invite.email, role: invite.role }, error: null });
}

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false, error: { code: 'auth_required', message: 'Login required to accept invite' } }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data: invite } = await admin
    .from('employee_invites')
    .select('id,email,role,workspace_id,expires_at,revoked_at,accepted_at')
    .eq('token', token)
    .maybeSingle();

  if (!invite) return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Invite not found' } }, { status: 404 });
  if (invite.revoked_at || invite.accepted_at || new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: { code: 'invalid_invite', message: 'Invite invalid' } }, { status: 410 });
  }

  if (auth.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json({ ok: false, error: { code: 'email_mismatch', message: 'Invite email does not match signed-in user' } }, { status: 403 });
  }

  await admin.from('workspace_members').upsert({ workspace_id: invite.workspace_id, user_id: auth.user.id, role: invite.role }, { onConflict: 'workspace_id,user_id' });
  await admin.from('employee_invites').update({ accepted_at: new Date().toISOString(), accepted_user_id: auth.user.id }).eq('id', invite.id);

  return NextResponse.json({ ok: true, data: { accepted: true, workspaceId: invite.workspace_id, role: invite.role }, error: null });
}
