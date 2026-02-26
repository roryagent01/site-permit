import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { ok, fail } from '@/lib/api/response';

const createSchema = z.object({
  expiresInHours: z.number().int().min(1).max(720).default(72)
});

export async function GET(_: Request, { params }: { params: Promise<{ permitId: string }> }) {
  const { permitId } = await params;
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('permit_share_links')
    .select('id,token,expires_at,revoked_at,created_at')
    .eq('workspace_id', ctx.workspaceId)
    .eq('permit_id', permitId)
    .order('created_at', { ascending: false });

  return NextResponse.json(ok({ items: data ?? [] }));
}

export async function POST(request: Request, { params }: { params: Promise<{ permitId: string }> }) {
  const { permitId } = await params;
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (!['issuer', 'admin', 'owner'].includes(ctx.role)) return NextResponse.json(fail('forbidden', 'Role not allowed'), { status: 403 });

  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(fail('invalid_payload', 'Invalid payload'), { status: 400 });

  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + parsed.data.expiresInHours * 3600 * 1000).toISOString();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('permit_share_links')
    .insert({
      workspace_id: ctx.workspaceId,
      permit_id: permitId,
      token,
      expires_at: expiresAt,
      created_by: ctx.user.id
    })
    .select('id,token,expires_at')
    .single();

  if (error) return NextResponse.json(fail('create_failed', 'Could not create share link'), { status: 500 });

  return NextResponse.json(ok({
    ...data,
    publicUrl: `${process.env.APP_BASE_URL ?? ''}/api/public/permits/share/${token}`
  }));
}

export async function DELETE(request: Request, { params }: { params: Promise<{ permitId: string }> }) {
  const { permitId } = await params;
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (!['issuer', 'admin', 'owner'].includes(ctx.role)) return NextResponse.json(fail('forbidden', 'Role not allowed'), { status: 403 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json(fail('validation_error', 'id is required'), { status: 400 });

  const supabase = await createSupabaseServerClient();
  await supabase
    .from('permit_share_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('workspace_id', ctx.workspaceId)
    .eq('permit_id', permitId)
    .eq('id', id);

  return NextResponse.json(ok({ revoked: true, id }));
}
