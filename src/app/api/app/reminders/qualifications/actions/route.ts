import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentWorkspace } from '@/lib/workspace/current';
import { ok, fail } from '@/lib/api/response';

const schema = z.object({
  action: z.enum(['renew', 'waive']),
  qualificationIds: z.array(z.string().uuid()).min(1),
  reason: z.string().optional()
});

export async function POST(request: Request) {
  const ctx = await getCurrentWorkspace();
  if (!ctx) return NextResponse.json(fail('unauthorized', 'Authentication required'), { status: 401 });
  if (!['admin', 'owner'].includes(ctx.role)) return NextResponse.json(fail('forbidden', 'Role not allowed'), { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(fail('invalid_payload', 'Invalid action payload'), { status: 400 });

  const supabase = await createSupabaseServerClient();

  if (parsed.data.action === 'renew') {
    for (const id of parsed.data.qualificationIds) {
      const { data: rec } = await supabase
        .from('contractor_qualifications')
        .select('expiry_date')
        .eq('workspace_id', ctx.workspaceId)
        .eq('id', id)
        .single();

      const current = rec?.expiry_date ? new Date(`${rec.expiry_date}T00:00:00Z`) : new Date();
      current.setMonth(current.getMonth() + 12);
      await supabase
        .from('contractor_qualifications')
        .update({
          issue_date: new Date().toISOString().slice(0, 10),
          expiry_date: current.toISOString().slice(0, 10),
          waived: false,
          waiver_reason: null,
          waived_until: null
        })
        .eq('workspace_id', ctx.workspaceId)
        .eq('id', id);
    }
  }

  if (parsed.data.action === 'waive') {
    if (!parsed.data.reason?.trim()) {
      return NextResponse.json(fail('validation_error', 'reason is required for waive'), { status: 400 });
    }
    const waivedUntil = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    await supabase
      .from('contractor_qualifications')
      .update({ waived: true, waiver_reason: parsed.data.reason.trim(), waived_until: waivedUntil })
      .eq('workspace_id', ctx.workspaceId)
      .in('id', parsed.data.qualificationIds);
  }

  return NextResponse.json(ok({ action: parsed.data.action, count: parsed.data.qualificationIds.length }));
}
