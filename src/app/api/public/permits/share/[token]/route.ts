import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();

  const { data: link } = await admin
    .from('permit_share_links')
    .select('id,workspace_id,permit_id,expires_at,revoked_at')
    .eq('token', token)
    .maybeSingle();

  if (!link) return NextResponse.json({ ok: false, error: { code: 'not_found', message: 'Share link not found' } }, { status: 404 });
  if (link.revoked_at) return NextResponse.json({ ok: false, error: { code: 'revoked', message: 'Share link revoked' } }, { status: 410 });
  if (new Date(link.expires_at).getTime() < Date.now()) return NextResponse.json({ ok: false, error: { code: 'expired', message: 'Share link expired' } }, { status: 410 });

  const { data: permit } = await admin
    .from('permits')
    .select('id,title,status,start_at,end_at,payload,created_at')
    .eq('workspace_id', link.workspace_id)
    .eq('id', link.permit_id)
    .maybeSingle();

  await admin.from('permit_share_access_logs').insert({
    workspace_id: link.workspace_id,
    share_link_id: link.id,
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    user_agent: request.headers.get('user-agent') ?? null
  });

  return NextResponse.json({ ok: true, data: { permit }, error: null });
}
