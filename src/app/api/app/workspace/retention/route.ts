import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { ok, fail } from '@/lib/api/response';

const schema = z.object({ retentionDays: z.number().int().min(30).max(3650), archiveBeforeDelete: z.boolean().default(true) });

export async function GET() {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('workspace_retention_settings').select('*').eq('workspace_id', ctx.workspaceId).maybeSingle();
  return NextResponse.json(ok({ settings: data ?? { retention_days: 365, archive_before_delete: true } }));
}

export async function POST(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (!['owner', 'admin'].includes(ctx.role)) return NextResponse.json(fail('forbidden', 'Role not allowed'), { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(fail('invalid_payload', 'Invalid retention payload'), { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('workspace_retention_settings').upsert({
    workspace_id: ctx.workspaceId,
    retention_days: parsed.data.retentionDays,
    archive_before_delete: parsed.data.archiveBeforeDelete,
    updated_at: new Date().toISOString()
  }).select('*').single();

  return NextResponse.json(ok({ settings: data }));
}
