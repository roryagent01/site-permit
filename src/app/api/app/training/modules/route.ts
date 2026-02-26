import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { ok, fail } from '@/lib/api/response';

const schema = z.object({ title: z.string().min(1), summary: z.string().optional(), contentUrl: z.string().url().optional() });

export async function GET() {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('training_modules').select('*').eq('workspace_id', ctx.workspaceId).order('created_at', { ascending: false });
  return NextResponse.json(ok({ items: data ?? [] }));
}

export async function POST(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (!['admin', 'owner', 'issuer'].includes(ctx.role)) return NextResponse.json(fail('forbidden', 'Role not allowed'), { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(fail('invalid_payload', 'Invalid module payload'), { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('training_modules').insert({
    workspace_id: ctx.workspaceId,
    title: parsed.data.title,
    summary: parsed.data.summary ?? null,
    content_url: parsed.data.contentUrl ?? null,
    created_by: ctx.user.id
  }).select('id,title').single();

  return NextResponse.json(ok({ module: data }));
}
