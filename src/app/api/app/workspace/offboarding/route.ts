import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { ok, fail } from '@/lib/api/response';

const schema = z.object({ mode: z.enum(['archive', 'hard_delete']).default('archive'), confirm: z.literal(true) });

export async function POST(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (ctx.role !== 'owner') return NextResponse.json(fail('forbidden', 'Only owner can initiate offboarding'), { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(fail('invalid_payload', 'Invalid offboarding payload'), { status: 400 });

  const supabase = await createSupabaseServerClient();

  const summary = {
    permits: (await supabase.from('permits').select('id', { head: true, count: 'exact' }).eq('workspace_id', ctx.workspaceId)).count ?? 0,
    contractors: (await supabase.from('contractors').select('id', { head: true, count: 'exact' }).eq('workspace_id', ctx.workspaceId)).count ?? 0,
    members: (await supabase.from('workspace_members').select('id', { head: true, count: 'exact' }).eq('workspace_id', ctx.workspaceId)).count ?? 0
  };

  const { data } = await supabase.from('workspace_offboarding_jobs').insert({
    workspace_id: ctx.workspaceId,
    mode: parsed.data.mode,
    status: 'completed',
    summary,
    requested_by: ctx.user.id,
    completed_at: new Date().toISOString()
  }).select('id,mode,status,summary,created_at').single();

  return NextResponse.json(ok({ job: data, note: 'Execution is metadata-only in this version. Use controlled manual deletion runbook for destructive steps.' }));
}
