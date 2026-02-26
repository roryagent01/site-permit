import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { ok, fail } from '@/lib/api/response';

const createSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'approver', 'issuer', 'viewer']).default('viewer'),
  expiresInHours: z.number().int().min(1).max(720).default(168)
});

export async function GET() {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('employee_invites')
    .select('id,email,role,expires_at,revoked_at,accepted_at,created_at')
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: false });
  return NextResponse.json(ok({ items: data ?? [] }));
}

export async function POST(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (!['owner', 'admin'].includes(ctx.role)) return NextResponse.json(fail('forbidden', 'Role not allowed'), { status: 403 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(fail('invalid_payload', 'Invalid invite payload'), { status: 400 });

  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + parsed.data.expiresInHours * 3600 * 1000).toISOString();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('employee_invites')
    .insert({
      workspace_id: ctx.workspaceId,
      email: parsed.data.email,
      role: parsed.data.role,
      token,
      expires_at: expiresAt,
      created_by: ctx.user.id
    })
    .select('id,email,role,expires_at,token')
    .single();

  return NextResponse.json(ok({ ...data, acceptUrl: `${process.env.APP_BASE_URL ?? ''}/api/public/onboarding/employee/${token}` }));
}

export async function DELETE(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (!['owner', 'admin'].includes(ctx.role)) return NextResponse.json(fail('forbidden', 'Role not allowed'), { status: 403 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json(fail('validation_error', 'id is required'), { status: 400 });

  const supabase = await createSupabaseServerClient();
  await supabase.from('employee_invites').update({ revoked_at: new Date().toISOString() }).eq('workspace_id', ctx.workspaceId).eq('id', id);
  return NextResponse.json(ok({ revoked: true, id }));
}
