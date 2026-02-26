import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { ok, fail } from '@/lib/api/response';

export async function GET() {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (!['owner', 'admin'].includes(ctx.role)) return NextResponse.json(fail('forbidden', 'Role not allowed'), { status: 403 });

  const supabase = await createSupabaseServerClient();
  const [workspace, members, sites, permits, contractors, quals, training] = await Promise.all([
    supabase.from('workspaces').select('*').eq('id', ctx.workspaceId).maybeSingle(),
    supabase.from('workspace_members').select('*').eq('workspace_id', ctx.workspaceId),
    supabase.from('sites').select('*').eq('workspace_id', ctx.workspaceId),
    supabase.from('permits').select('*').eq('workspace_id', ctx.workspaceId),
    supabase.from('contractors').select('*').eq('workspace_id', ctx.workspaceId),
    supabase.from('contractor_qualifications').select('*').eq('workspace_id', ctx.workspaceId),
    supabase.from('contractor_training_records').select('*').eq('workspace_id', ctx.workspaceId)
  ]);

  return NextResponse.json(ok({
    exportedAt: new Date().toISOString(),
    workspace: workspace.data,
    members: members.data ?? [],
    sites: sites.data ?? [],
    permits: permits.data ?? [],
    contractors: contractors.data ?? [],
    qualifications: quals.data ?? [],
    trainingRecords: training.data ?? []
  }));
}
